import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { isIP } from "node:net";

import { decodeExactBase64Key } from "./security-key-core";

export const canonicalOriginHeader = "x-nitipcuy-canonical-origin";
export const canonicalClientNetworkHeader = "x-nitipcuy-client-network-subject";
export const requestNonceHeader = "x-nitipcuy-request-nonce";
export const edgeProofHeader = "x-nitipcuy-edge-proof";

export type RequestPerimeterMode = "LOCAL_DIRECT" | "TRUSTED_PROXY";

export interface RequestPerimeterPolicy {
  readonly abuseSubjectHmacKey: Uint8Array;
  readonly appOrigin: string;
  readonly edgeProof: string | null;
  readonly mode: RequestPerimeterMode;
}

export interface RequestPerimeterInput {
  readonly headers: Headers;
  readonly requestUrl: string;
}

export type RequestPerimeterDecision =
  | Readonly<{ allowed: true; clientNetwork: string }>
  | Readonly<{
      allowed: false;
      reasonCode:
        | "CANONICAL_REQUEST_MISMATCH"
        | "DIRECT_ORIGIN_DENIED"
        | "FORWARDED_METADATA_REJECTED";
    }>;

export type BrowserSecurityHeaders = Readonly<
  Record<string, string> & { readonly "Content-Security-Policy": string }
>;

const ambiguousForwardingHeaders = [
  "forwarded",
  "x-forwarded-prefix",
  "x-original-host",
  "x-original-url",
  canonicalClientNetworkHeader,
] as const;

const downstreamRemovedHeaders = [
  edgeProofHeader,
  "forwarded",
  "x-forwarded-for",
  "x-forwarded-host",
  "x-forwarded-port",
  "x-forwarded-prefix",
  "x-forwarded-proto",
  "x-original-host",
  "x-original-url",
] as const;

export class RequestPerimeterConfigurationError extends Error {
  constructor() {
    super("NitipCuy request perimeter is not configured.");
    this.name = "RequestPerimeterConfigurationError";
  }
}

export function readRequestPerimeterPolicy(
  environment: Readonly<Record<string, string | undefined>> = process.env,
): RequestPerimeterPolicy {
  const appOrigin = parseCanonicalOrigin(
    requiredValue(environment.NITIPCUY_APP_ORIGIN),
  );
  const abuseSubjectHmacKey = decodeExactBase64Key(
    environment.NITIPCUY_ABUSE_SUBJECT_HMAC_KEY_BASE64,
  );
  if (!abuseSubjectHmacKey) {
    throw new RequestPerimeterConfigurationError();
  }
  const mode = requiredValue(environment.NITIPCUY_PROXY_MODE);

  if (mode === "LOCAL_DIRECT") {
    if (!isLocalOrigin(appOrigin)) {
      throw new RequestPerimeterConfigurationError();
    }
    return Object.freeze({
      abuseSubjectHmacKey,
      appOrigin,
      edgeProof: null,
      mode,
    });
  }

  if (mode === "TRUSTED_PROXY") {
    if (!appOrigin.startsWith("https://")) {
      throw new RequestPerimeterConfigurationError();
    }
    const edgeProof = requiredValue(environment.NITIPCUY_EDGE_REQUEST_SECRET);
    if (
      edgeProof.length < 32 ||
      edgeProof.length > 256 ||
      /[\r\n]/.test(edgeProof)
    ) {
      throw new RequestPerimeterConfigurationError();
    }
    return Object.freeze({ abuseSubjectHmacKey, appOrigin, edgeProof, mode });
  }

  throw new RequestPerimeterConfigurationError();
}

export function evaluateRequestPerimeter(
  policy: RequestPerimeterPolicy,
  input: RequestPerimeterInput,
): RequestPerimeterDecision {
  const canonicalUrl = new URL(policy.appOrigin);

  if (
    ambiguousForwardingHeaders.some((name) => input.headers.has(name)) ||
    hasAmbiguousValue(input.headers.get("x-forwarded-host")) ||
    hasAmbiguousValue(input.headers.get("x-forwarded-proto")) ||
    hasAmbiguousValue(input.headers.get("x-forwarded-port"))
  ) {
    return denied("FORWARDED_METADATA_REJECTED");
  }

  if (policy.mode === "LOCAL_DIRECT") {
    const requestUrl = safeUrl(input.requestUrl);
    if (
      !requestUrl ||
      requestUrl.protocol !== canonicalUrl.protocol ||
      input.headers.get("host") !== canonicalUrl.host ||
      !optionalHeaderEquals(
        input.headers.get("x-forwarded-host"),
        canonicalUrl.host,
      ) ||
      !optionalHeaderEquals(
        input.headers.get("x-forwarded-proto"),
        canonicalUrl.protocol.slice(0, -1),
      ) ||
      !optionalHeaderEquals(
        input.headers.get("x-forwarded-port"),
        canonicalPort(canonicalUrl),
      ) ||
      !isOptionalLoopbackAddress(input.headers.get("x-forwarded-for"))
    ) {
      return denied("CANONICAL_REQUEST_MISMATCH");
    }
    return Object.freeze({ allowed: true, clientNetwork: "loopback" });
  }

  const presentedProof = input.headers.get(edgeProofHeader);
  if (
    !policy.edgeProof ||
    !presentedProof ||
    !secretsEqual(policy.edgeProof, presentedProof)
  ) {
    return denied("DIRECT_ORIGIN_DENIED");
  }

  if (
    input.headers.get("x-forwarded-host") !== canonicalUrl.host ||
    input.headers.get("x-forwarded-proto") !==
      canonicalUrl.protocol.slice(0, -1) ||
    !optionalHeaderEquals(
      input.headers.get("x-forwarded-port"),
      canonicalPort(canonicalUrl),
    )
  ) {
    return denied("CANONICAL_REQUEST_MISMATCH");
  }

  const clientNetwork = canonicalClientAddress(
    input.headers.get("x-forwarded-for"),
  );
  if (!clientNetwork) {
    return denied("FORWARDED_METADATA_REJECTED");
  }

  return Object.freeze({ allowed: true, clientNetwork });
}

export function createRequestNonce(): string {
  return randomBytes(18).toString("base64");
}

export function createCanonicalRequestHeaders(
  incoming: Headers,
  appOrigin: string,
  nonce: string,
  contentSecurityPolicy: string,
  clientNetworkSubject: string,
): Headers {
  const headers = new Headers(incoming);
  for (const name of downstreamRemovedHeaders) {
    headers.delete(name);
  }
  headers.set("host", new URL(appOrigin).host);
  headers.set(canonicalOriginHeader, appOrigin);
  headers.set(canonicalClientNetworkHeader, clientNetworkSubject);
  headers.set(requestNonceHeader, nonce);
  headers.set("content-security-policy", contentSecurityPolicy);
  return headers;
}

export function createClientNetworkSubject(
  hmacKey: Uint8Array,
  canonicalClientNetwork: string,
): string {
  if (hmacKey.byteLength !== 32 || !canonicalClientNetwork) {
    throw new RequestPerimeterConfigurationError();
  }
  return createHmac("sha256", hmacKey)
    .update("nitipcuy-client-network-v1\0")
    .update(canonicalClientNetwork)
    .digest("hex");
}

export function canonicalExternalUrl(
  expectedOrigin: string,
  canonicalOrigin: string | null,
  pathname: string,
  search: string,
): string | null {
  if (
    canonicalOrigin !== expectedOrigin ||
    !pathname.startsWith("/") ||
    (search !== "" && !search.startsWith("?"))
  ) {
    return null;
  }

  const url = new URL(`${pathname}${search}`, expectedOrigin);
  return url.origin === expectedOrigin ? url.toString() : null;
}

export function buildContentSecurityPolicy(
  nonce: string,
  options: Readonly<{ development: boolean; https: boolean }>,
): string {
  const scriptSources = [
    "'self'",
    `'nonce-${nonce}'`,
    "'strict-dynamic'",
    ...(options.development ? ["'unsafe-eval'"] : []),
  ];
  const directives = [
    "default-src 'self'",
    `script-src ${scriptSources.join(" ")}`,
    `style-src 'self' 'nonce-${nonce}'`,
    "img-src 'self' blob: data:",
    "font-src 'self'",
    "connect-src 'self'",
    "media-src 'self'",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'self'",
    "frame-src 'none'",
    "frame-ancestors 'none'",
    ...(options.https ? ["upgrade-insecure-requests"] : []),
  ];
  return `${directives.join("; ")};`;
}

export function buildBrowserSecurityHeaders(
  policy: RequestPerimeterPolicy,
  nonce: string,
  pathname: string,
  nodeEnvironment: string | undefined,
  forceNoStore = false,
): BrowserSecurityHeaders {
  const headers: Record<string, string> & {
    "Content-Security-Policy": string;
  } = {
    "Content-Security-Policy": buildContentSecurityPolicy(nonce, {
      development: nodeEnvironment !== "production",
      https: policy.appOrigin.startsWith("https://"),
    }),
    "Cross-Origin-Opener-Policy": "same-origin",
    "Cross-Origin-Resource-Policy": "same-origin",
    "Origin-Agent-Cluster": "?1",
    "Permissions-Policy":
      "accelerometer=(), camera=(), geolocation=(), gyroscope=(), microphone=(), payment=(), usb=()",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
  };

  if (policy.appOrigin.startsWith("https://")) {
    headers["Strict-Transport-Security"] = "max-age=86400";
  }

  if (forceNoStore || isPrivateResponsePath(pathname)) {
    headers["Cache-Control"] = "private, no-store, max-age=0";
    headers.Expires = "0";
    headers.Pragma = "no-cache";
  }

  return Object.freeze(headers);
}

export function buildConfigurationFailureHeaders(): Readonly<
  Record<string, string>
> {
  return Object.freeze({
    "Cache-Control": "private, no-store, max-age=0",
    "Content-Security-Policy":
      "default-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none';",
    "Content-Type": "application/json; charset=utf-8",
    "Cross-Origin-Opener-Policy": "same-origin",
    "Cross-Origin-Resource-Policy": "same-origin",
    Expires: "0",
    "Origin-Agent-Cluster": "?1",
    Pragma: "no-cache",
    "Referrer-Policy": "no-referrer",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
  });
}

export function isPrivateResponsePath(pathname: string): boolean {
  return (
    pathname === "/auth" ||
    pathname.startsWith("/auth/") ||
    pathname === "/api" ||
    pathname.startsWith("/api/")
  );
}

export function applyResponseHeaders(
  responseHeaders: Headers,
  securityHeaders: Readonly<Record<string, string>>,
): void {
  for (const [name, value] of Object.entries(securityHeaders)) {
    responseHeaders.set(name, value);
  }
}

function parseCanonicalOrigin(value: string): string {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new RequestPerimeterConfigurationError();
  }

  const local = isLoopbackHostname(url.hostname);
  if (
    (url.protocol !== "https:" && !(url.protocol === "http:" && local)) ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  ) {
    throw new RequestPerimeterConfigurationError();
  }
  return url.origin;
}

function isLocalOrigin(origin: string): boolean {
  return isLoopbackHostname(new URL(origin).hostname);
}

function isLoopbackHostname(hostname: string): boolean {
  return (
    hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]"
  );
}

function requiredValue(value: string | undefined): string {
  if (!value || value !== value.trim()) {
    throw new RequestPerimeterConfigurationError();
  }
  return value;
}

function hasAmbiguousValue(value: string | null): boolean {
  return value !== null && (value.includes(",") || value !== value.trim());
}

function optionalHeaderEquals(value: string | null, expected: string): boolean {
  return value === null || value === expected;
}

function canonicalPort(url: URL): string {
  return url.port || (url.protocol === "https:" ? "443" : "80");
}

function secretsEqual(expected: string, presented: string): boolean {
  const expectedBytes = Buffer.from(expected);
  const presentedBytes = Buffer.from(presented);
  return (
    expectedBytes.byteLength === presentedBytes.byteLength &&
    timingSafeEqual(expectedBytes, presentedBytes)
  );
}

function safeUrl(value: string): URL | null {
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

function canonicalClientAddress(value: string | null): string | null {
  if (!value || value.trim() !== value || value.includes(",")) {
    return null;
  }
  const version = isIP(value);
  if (version === 4) {
    return value;
  }
  if (version === 6 && !value.includes("%")) {
    const hostname = new URL(`http://[${value}]/`).hostname;
    return hostname.slice(1, -1).toLowerCase();
  }
  return null;
}

function isOptionalLoopbackAddress(value: string | null): boolean {
  if (value === null) {
    return true;
  }
  const address = canonicalClientAddress(value);
  return (
    address === "127.0.0.1" || address === "::1" || address === "::ffff:7f00:1"
  );
}

function denied(
  reasonCode: Exclude<
    RequestPerimeterDecision,
    { allowed: true }
  >["reasonCode"],
): RequestPerimeterDecision {
  return Object.freeze({ allowed: false, reasonCode });
}
