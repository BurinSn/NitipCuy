import { describe, expect, it } from "vitest";

import {
  RequestPerimeterConfigurationError,
  buildBrowserSecurityHeaders,
  buildContentSecurityPolicy,
  canonicalExternalUrl,
  canonicalOriginHeader,
  createCanonicalRequestHeaders,
  createRequestNonce,
  edgeProofHeader,
  evaluateRequestPerimeter,
  readRequestPerimeterPolicy,
  requestNonceHeader,
} from "./request-perimeter-core";

const edgeProof = "a-secure-edge-proof-with-at-least-32-characters";

describe("request perimeter configuration", () => {
  it("allows explicitly local direct development only for loopback origins", () => {
    expect(
      readRequestPerimeterPolicy({
        NITIPCUY_APP_ORIGIN: "http://localhost:3000",
        NITIPCUY_PROXY_MODE: "LOCAL_DIRECT",
      }),
    ).toEqual({
      appOrigin: "http://localhost:3000",
      edgeProof: null,
      mode: "LOCAL_DIRECT",
    });

    expect(() =>
      readRequestPerimeterPolicy({
        NITIPCUY_APP_ORIGIN: "https://preview.nitipcuy.example",
        NITIPCUY_PROXY_MODE: "LOCAL_DIRECT",
      }),
    ).toThrow(RequestPerimeterConfigurationError);
    expect(() =>
      readRequestPerimeterPolicy({
        NITIPCUY_APP_ORIGIN: "http://localhost:3000",
      }),
    ).toThrow(RequestPerimeterConfigurationError);
  });

  it("requires HTTPS and a bounded edge proof for trusted proxy mode", () => {
    expect(
      readRequestPerimeterPolicy({
        NITIPCUY_APP_ORIGIN: "https://preview.nitipcuy.example",
        NITIPCUY_EDGE_REQUEST_SECRET: edgeProof,
        NITIPCUY_PROXY_MODE: "TRUSTED_PROXY",
      }),
    ).toEqual({
      appOrigin: "https://preview.nitipcuy.example",
      edgeProof,
      mode: "TRUSTED_PROXY",
    });

    for (const environment of [
      {
        NITIPCUY_APP_ORIGIN: "http://preview.nitipcuy.example",
        NITIPCUY_EDGE_REQUEST_SECRET: edgeProof,
        NITIPCUY_PROXY_MODE: "TRUSTED_PROXY",
      },
      {
        NITIPCUY_APP_ORIGIN: "https://preview.nitipcuy.example/path",
        NITIPCUY_EDGE_REQUEST_SECRET: edgeProof,
        NITIPCUY_PROXY_MODE: "TRUSTED_PROXY",
      },
      {
        NITIPCUY_APP_ORIGIN: "https://preview.nitipcuy.example",
        NITIPCUY_EDGE_REQUEST_SECRET: "too-short",
        NITIPCUY_PROXY_MODE: "TRUSTED_PROXY",
      },
      {
        NITIPCUY_APP_ORIGIN: "https://preview.nitipcuy.example",
        NITIPCUY_EDGE_REQUEST_SECRET: edgeProof,
        NITIPCUY_PROXY_MODE: "UNKNOWN",
      },
      {
        NITIPCUY_APP_ORIGIN: "https://preview.nitipcuy.example",
        NITIPCUY_EDGE_REQUEST_SECRET: edgeProof,
        NITIPCUY_PROXY_MODE: " TRUSTED_PROXY ",
      },
    ]) {
      expect(() => readRequestPerimeterPolicy(environment)).toThrow(
        RequestPerimeterConfigurationError,
      );
    }
  });
});

describe("request perimeter decisions", () => {
  const localPolicy = readRequestPerimeterPolicy({
    NITIPCUY_APP_ORIGIN: "http://localhost:3000",
    NITIPCUY_PROXY_MODE: "LOCAL_DIRECT",
  });
  const proxyPolicy = readRequestPerimeterPolicy({
    NITIPCUY_APP_ORIGIN: "https://preview.nitipcuy.example",
    NITIPCUY_EDGE_REQUEST_SECRET: edgeProof,
    NITIPCUY_PROXY_MODE: "TRUSTED_PROXY",
  });

  it("accepts an exact local request and matching framework forwarding metadata", () => {
    for (const headers of [
      new Headers({ host: "localhost:3000" }),
      new Headers({
        host: "localhost:3000",
        "x-forwarded-host": "localhost:3000",
        "x-forwarded-port": "3000",
        "x-forwarded-proto": "http",
      }),
    ]) {
      expect(
        evaluateRequestPerimeter(localPolicy, {
          headers,
          requestUrl: "http://internal-next-origin/trips",
        }),
      ).toEqual({ allowed: true });
    }
  });

  it.each([
    {
      headers: { host: "evil.example" },
      requestUrl: "http://localhost:3000/",
    },
    {
      headers: {
        host: "localhost:3000",
        "x-forwarded-host": "evil.example",
      },
      requestUrl: "http://localhost:3000/",
    },
    {
      headers: {
        forwarded: "host=localhost:3000;proto=http",
        host: "localhost:3000",
      },
      requestUrl: "http://localhost:3000/",
    },
    {
      headers: {
        host: "localhost:3000",
        "x-forwarded-host": "localhost:3000, evil.example",
      },
      requestUrl: "http://localhost:3000/",
    },
  ])(
    "rejects hostile or ambiguous local metadata",
    ({ headers, requestUrl }) => {
      expect(
        evaluateRequestPerimeter(localPolicy, {
          headers: new Headers(headers),
          requestUrl,
        }).allowed,
      ).toBe(false);
    },
  );

  it("accepts only exact trusted proxy evidence and canonical forwarding values", () => {
    const headers = new Headers({
      [edgeProofHeader]: edgeProof,
      host: "internal-origin.example",
      "x-forwarded-host": "preview.nitipcuy.example",
      "x-forwarded-port": "443",
      "x-forwarded-proto": "https",
    });
    expect(
      evaluateRequestPerimeter(proxyPolicy, {
        headers,
        requestUrl: "http://internal-origin.example/trips",
      }),
    ).toEqual({ allowed: true });
  });

  it.each([
    {},
    { [edgeProofHeader]: "wrong-edge-proof-with-at-least-32-characters" },
    {
      [edgeProofHeader]: edgeProof,
      "x-forwarded-host": "evil.example",
      "x-forwarded-proto": "https",
    },
    {
      [edgeProofHeader]: edgeProof,
      "x-forwarded-host": "preview.nitipcuy.example",
      "x-forwarded-proto": "http",
    },
    {
      [edgeProofHeader]: edgeProof,
      "x-forwarded-host": "preview.nitipcuy.example",
      "x-forwarded-proto": "https, http",
    },
  ])("rejects missing, forged, or contradictory proxy evidence", (values) => {
    const headers = new Headers({
      host: "internal-origin.example",
      ...values,
    });
    expect(
      evaluateRequestPerimeter(proxyPolicy, {
        headers,
        requestUrl: "http://internal-origin.example/",
      }).allowed,
    ).toBe(false);
  });
});

describe("canonical downstream context and browser headers", () => {
  const policy = readRequestPerimeterPolicy({
    NITIPCUY_APP_ORIGIN: "https://preview.nitipcuy.example",
    NITIPCUY_EDGE_REQUEST_SECRET: edgeProof,
    NITIPCUY_PROXY_MODE: "TRUSTED_PROXY",
  });

  it("overwrites client-controlled internal headers and removes edge proof", () => {
    const headers = createCanonicalRequestHeaders(
      new Headers({
        [canonicalOriginHeader]: "https://evil.example",
        [edgeProofHeader]: edgeProof,
        [requestNonceHeader]: "attacker-nonce",
        "x-forwarded-for": "203.0.113.10",
        "x-forwarded-host": "preview.nitipcuy.example",
        "x-forwarded-proto": "https",
      }),
      policy.appOrigin,
      "trusted-nonce",
      "default-src 'self';",
    );
    expect(headers.get(canonicalOriginHeader)).toBe(policy.appOrigin);
    expect(headers.get(requestNonceHeader)).toBe("trusted-nonce");
    expect(headers.get(edgeProofHeader)).toBeNull();
    expect(headers.get("x-forwarded-for")).toBeNull();
    expect(headers.get("x-forwarded-host")).toBeNull();
    expect(headers.get("x-forwarded-proto")).toBeNull();
    expect(headers.get("host")).toBe("preview.nitipcuy.example");
    expect(headers.get("content-security-policy")).toBe("default-src 'self';");
  });

  it("constructs an external callback URL only from matching canonical context", () => {
    expect(
      canonicalExternalUrl(
        policy.appOrigin,
        policy.appOrigin,
        "/auth/google/callback",
        "?state=opaque",
      ),
    ).toBe(
      "https://preview.nitipcuy.example/auth/google/callback?state=opaque",
    );
    expect(
      canonicalExternalUrl(
        policy.appOrigin,
        "https://evil.example",
        "/auth/google/callback",
        "?state=opaque",
      ),
    ).toBeNull();
    expect(
      canonicalExternalUrl(
        policy.appOrigin,
        policy.appOrigin,
        "//evil.example/callback",
        "",
      ),
    ).toBeNull();
  });

  it("creates fresh base64 nonces", () => {
    const first = createRequestNonce();
    const second = createRequestNonce();
    expect(first).toMatch(/^[A-Za-z0-9+/]+={0,2}$/);
    expect(second).not.toBe(first);
  });

  it("builds a strict production CSP without unsafe inline or eval", () => {
    const policyValue = buildContentSecurityPolicy("nonce-value", {
      development: false,
      https: true,
    });
    expect(policyValue).toContain("'nonce-nonce-value'");
    expect(policyValue).toContain("'strict-dynamic'");
    expect(policyValue).toContain("frame-ancestors 'none'");
    expect(policyValue).toContain("upgrade-insecure-requests");
    expect(policyValue).not.toContain("'unsafe-inline'");
    expect(policyValue).not.toContain("'unsafe-eval'");
  });

  it("adds defensive headers and forces no-store for private or denied responses", () => {
    const authHeaders = buildBrowserSecurityHeaders(
      policy,
      "nonce-value",
      "/auth/google/start",
      "production",
    );
    const apiHeaders = buildBrowserSecurityHeaders(
      policy,
      "nonce-value",
      "/api/account/session",
      "production",
    );
    const publicHeaders = buildBrowserSecurityHeaders(
      policy,
      "nonce-value",
      "/trips/demo-trip",
      "production",
    );
    const deniedPublicHeaders = buildBrowserSecurityHeaders(
      policy,
      "nonce-value",
      "/trips/demo-trip",
      "production",
      true,
    );

    expect(authHeaders["Cache-Control"]).toContain("no-store");
    expect(apiHeaders["Cache-Control"]).toContain("no-store");
    expect(publicHeaders["Cache-Control"]).toBeUndefined();
    expect(deniedPublicHeaders["Cache-Control"]).toContain("no-store");
    expect(publicHeaders["Strict-Transport-Security"]).toBe("max-age=86400");
    expect(publicHeaders["X-Frame-Options"]).toBe("DENY");
    expect(publicHeaders["X-Content-Type-Options"]).toBe("nosniff");
  });
});
