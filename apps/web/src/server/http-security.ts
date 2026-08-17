import "server-only";

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import type { AuthenticatedActor } from "@nitipcuy/domain";
import { randomUUID } from "node:crypto";
import {
  AbuseProtectionUnavailableError,
  type AbuseBucketLimit,
  type AbuseProtectionDecision,
} from "@nitipcuy/adapters";
import {
  DomainValidationError,
  MarketplaceStateConflictError,
} from "@nitipcuy/domain";
import { MarketplaceUseCaseError } from "@nitipcuy/application";

import { isSameOriginJsonMutation } from "./http-security-core";
import {
  AbusePolicyContextError,
  abusePolicyStorageKey,
  buildAbuseLimits,
  type AbusePolicyContext,
  type AbusePolicyName,
} from "./abuse-policy";
import { canonicalClientNetworkHeader } from "./request-perimeter-core";
import {
  getRuntime,
  RuntimeConfigurationError,
  runtimeSessionCookie,
} from "./runtime";

const maximumJsonBytes = 8_192;

export function requireSameOriginMutation(request: NextRequest): void {
  const runtime = getRuntime();
  const origin = request.headers.get("origin");
  const fetchSite = request.headers.get("sec-fetch-site");
  const contentType = request.headers.get("content-type")?.split(";", 1)[0];

  if (
    !isSameOriginJsonMutation({
      appOrigin: runtime.appOrigin,
      contentType: contentType ?? null,
      fetchSite,
      origin,
    })
  ) {
    throw new HttpBoundaryError(403, "REQUEST_DENIED");
  }
}

export async function requireAuthenticatedActor(
  request: NextRequest,
): Promise<AuthenticatedActor> {
  const token = request.cookies.get(runtimeSessionCookie.name)?.value;
  if (!token) {
    throw new HttpBoundaryError(401, "AUTHENTICATION_REQUIRED");
  }
  await requireAbuseAllowance(
    request,
    "session.validate",
    { sessionSubject: token },
    randomUUID(),
  );
  const actor = await getRuntime().sessions.validate(token);
  if (!actor) {
    throw new HttpBoundaryError(401, "AUTHENTICATION_REQUIRED");
  }
  return actor;
}

export async function requireAbuseAllowance(
  request: NextRequest,
  policy: AbusePolicyName,
  context: Omit<AbusePolicyContext, "networkSubject">,
  correlationId: string,
): Promise<void> {
  const networkSubject = request.headers.get(canonicalClientNetworkHeader);
  if (!networkSubject || !/^[0-9a-f]{64}$/.test(networkSubject)) {
    throw new HttpBoundaryError(503, "SERVICE_UNAVAILABLE");
  }

  let limits: readonly AbuseBucketLimit[];
  try {
    limits = buildAbuseLimits(policy, { ...context, networkSubject });
  } catch (error) {
    if (error instanceof AbusePolicyContextError) {
      throw new HttpBoundaryError(
        error.kind === "INVALID" ? 400 : 503,
        error.kind === "INVALID" ? "REQUEST_INVALID" : "SERVICE_UNAVAILABLE",
      );
    }
    throw error;
  }

  const decision: AbuseProtectionDecision =
    await getRuntime().abuseProtection.evaluate({
      ...(context.actor ? { actorAccountId: context.actor.accountId } : {}),
      correlationId,
      limits,
      policy: abusePolicyStorageKey(policy),
    });
  if (!decision.allowed) {
    throw new HttpBoundaryError(
      429,
      "RATE_LIMITED",
      decision.retryAfterSeconds,
    );
  }
}

export async function readBoundedJson(
  request: NextRequest,
): Promise<Readonly<Record<string, unknown>>> {
  const declaredLength = Number(request.headers.get("content-length") ?? "0");
  if (
    !Number.isFinite(declaredLength) ||
    declaredLength < 0 ||
    declaredLength > maximumJsonBytes
  ) {
    throw new HttpBoundaryError(413, "REQUEST_TOO_LARGE");
  }

  const body = await request.text();
  if (Buffer.byteLength(body, "utf8") > maximumJsonBytes) {
    throw new HttpBoundaryError(413, "REQUEST_TOO_LARGE");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(body) as unknown;
  } catch {
    throw new HttpBoundaryError(400, "REQUEST_INVALID");
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new HttpBoundaryError(400, "REQUEST_INVALID");
  }
  return parsed as Readonly<Record<string, unknown>>;
}

export function requiredString(
  input: Readonly<Record<string, unknown>>,
  field: string,
): string {
  const value = input[field];
  if (typeof value !== "string") {
    throw new HttpBoundaryError(400, "REQUEST_INVALID");
  }
  return value;
}

export function requiredNumber(
  input: Readonly<Record<string, unknown>>,
  field: string,
): number {
  const value = input[field];
  if (typeof value !== "number") {
    throw new HttpBoundaryError(400, "REQUEST_INVALID");
  }
  return value;
}

export function requiredInteger(
  input: Readonly<Record<string, unknown>>,
  field: string,
): number {
  const value = requiredNumber(input, field);
  if (!Number.isSafeInteger(value)) {
    throw new HttpBoundaryError(400, "REQUEST_INVALID");
  }
  return value;
}

export function requiredBoolean(
  input: Readonly<Record<string, unknown>>,
  field: string,
): boolean {
  const value = input[field];
  if (typeof value !== "boolean") {
    throw new HttpBoundaryError(400, "REQUEST_INVALID");
  }
  return value;
}

export function optionalString(
  input: Readonly<Record<string, unknown>>,
  field: string,
): string | undefined {
  const value = input[field];
  if (value === undefined) {
    return undefined;
  }
  if (typeof value !== "string") {
    throw new HttpBoundaryError(400, "REQUEST_INVALID");
  }
  return value;
}

export function requireExactFields(
  input: Readonly<Record<string, unknown>>,
  allowedFields: ReadonlySet<string>,
): void {
  if (Object.keys(input).some((field) => !allowedFields.has(field))) {
    throw new HttpBoundaryError(400, "REQUEST_INVALID");
  }
}

export function requiredStringArray(
  input: Readonly<Record<string, unknown>>,
  field: string,
): readonly string[] {
  const value = input[field];
  if (
    !Array.isArray(value) ||
    !value.every((entry) => typeof entry === "string")
  ) {
    throw new HttpBoundaryError(400, "REQUEST_INVALID");
  }
  return value;
}

export function rejectInvalidRequest(): never {
  throw new HttpBoundaryError(400, "REQUEST_INVALID");
}

export function routeFailure(error: unknown): NextResponse {
  if (error instanceof RuntimeConfigurationError) {
    return NextResponse.json({ error: "SERVICE_UNAVAILABLE" }, { status: 503 });
  }

  if (error instanceof HttpBoundaryError) {
    return NextResponse.json(
      { error: error.code },
      {
        ...(error.retryAfterSeconds
          ? { headers: { "Retry-After": String(error.retryAfterSeconds) } }
          : {}),
        status: error.status,
      },
    );
  }

  if (error instanceof AbuseProtectionUnavailableError) {
    return NextResponse.json({ error: "SERVICE_UNAVAILABLE" }, { status: 503 });
  }

  if (error instanceof MarketplaceUseCaseError) {
    if (error.code === "SESSION_INACTIVE") {
      return NextResponse.json(
        { error: "AUTHENTICATION_REQUIRED" },
        { status: 401 },
      );
    }
    if (
      error.code === "RESOURCE_NOT_FOUND" ||
      error.code === "RESOURCE_NOT_OWNED" ||
      error.code === "TRIP_NOT_PUBLISHED"
    ) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }
    if (
      error.code === "ANSWER_ALREADY_EXISTS" ||
      error.code === "PROFILE_ALREADY_EXISTS" ||
      error.code === "CAPACITY_UNAVAILABLE" ||
      error.code === "IDEMPOTENCY_CONFLICT" ||
      error.code === "IDEMPOTENCY_IN_PROGRESS" ||
      error.code === "OFFER_REVISION_STALE"
    ) {
      return NextResponse.json({ error: "REQUEST_CONFLICT" }, { status: 409 });
    }
    return NextResponse.json({ error: "REQUEST_DENIED" }, { status: 403 });
  }

  if (error instanceof MarketplaceStateConflictError) {
    return NextResponse.json({ error: "REQUEST_CONFLICT" }, { status: 409 });
  }

  if (error instanceof DomainValidationError) {
    return NextResponse.json({ error: "REQUEST_INVALID" }, { status: 400 });
  }

  if (
    error instanceof Error &&
    (error.name.startsWith("PrismaClient") ||
      error.name === "OptimisticConcurrencyError")
  ) {
    return NextResponse.json(
      {
        error:
          error.name === "OptimisticConcurrencyError"
            ? "REQUEST_CONFLICT"
            : "SERVICE_UNAVAILABLE",
      },
      { status: error.name === "OptimisticConcurrencyError" ? 409 : 503 },
    );
  }

  return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
}

export class HttpBoundaryError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    readonly retryAfterSeconds?: number,
  ) {
    super(code);
    this.name = "HttpBoundaryError";
  }
}
