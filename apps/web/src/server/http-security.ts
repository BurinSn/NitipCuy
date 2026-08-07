import "server-only";

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import type { AuthenticatedActor } from "@nitipcuy/domain";
import {
  DomainValidationError,
  MarketplaceStateConflictError,
} from "@nitipcuy/domain";
import { MarketplaceUseCaseError } from "@nitipcuy/application";

import { isSameOriginJsonMutation } from "./http-security-core";
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
  const actor = await getRuntime().sessions.validate(token);
  if (!actor) {
    throw new HttpBoundaryError(401, "AUTHENTICATION_REQUIRED");
  }
  return actor;
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
    return NextResponse.json({ error: error.code }, { status: error.status });
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
      error.code === "PROFILE_ALREADY_EXISTS"
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

class HttpBoundaryError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
  ) {
    super(code);
    this.name = "HttpBoundaryError";
  }
}
