import { describe, expect, it, vi } from "vitest";

import { AbuseProtectionUnavailableError } from "@nitipcuy/adapters";
import { MarketplaceUseCaseError } from "@nitipcuy/application";

vi.mock("server-only", () => ({}));

import { HttpBoundaryError, routeFailure } from "./http-security";

describe("shared abuse HTTP failures", () => {
  it("returns a generic rate-limit response with bounded retry guidance", async () => {
    const response = routeFailure(
      new HttpBoundaryError(429, "RATE_LIMITED", 37),
    );

    expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toBe("37");
    await expect(response.json()).resolves.toEqual({ error: "RATE_LIMITED" });
  });

  it("fails closed generically when shared abuse authority is unavailable", async () => {
    const response = routeFailure(new AbuseProtectionUnavailableError());

    expect(response.status).toBe(503);
    expect(response.headers.get("retry-after")).toBeNull();
    await expect(response.json()).resolves.toEqual({
      error: "SERVICE_UNAVAILABLE",
    });
  });

  it.each([
    "CAPACITY_UNAVAILABLE",
    "IDEMPOTENCY_CONFLICT",
    "IDEMPOTENCY_IN_PROGRESS",
    "OFFER_REVISION_STALE",
  ] as const)("maps %s to one generic conflict", async (code) => {
    const response = routeFailure(new MarketplaceUseCaseError(code));

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      error: "REQUEST_CONFLICT",
    });
  });
});
