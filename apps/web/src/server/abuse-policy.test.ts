import { describe, expect, it } from "vitest";

import { accountId, sessionId } from "@nitipcuy/domain";

import {
  AbusePolicyContextError,
  abusePolicyDefinitions,
  abusePolicyStorageKey,
  buildAbuseLimits,
} from "./abuse-policy";

const actor = {
  accountId: accountId("00000000-0000-4000-8000-000000000001"),
  assurance: "BASE" as const,
  capabilities: new Set<never>(),
  sessionId: sessionId("00000000-0000-4000-8000-000000000002"),
};

describe("abuse policy authority", () => {
  it("builds action-scoped network, account, session, and target axes", () => {
    expect(
      buildAbuseLimits("discussion.question", {
        actor,
        networkSubject: "network-subject",
        targetSubject: "trip-001",
      }).map(({ axis, subject }) => ({ axis, subject })),
    ).toEqual([
      { axis: "NETWORK", subject: "network-subject" },
      { axis: "ACCOUNT", subject: actor.accountId },
      { axis: "SESSION", subject: actor.sessionId },
      { axis: "TARGET", subject: "trip-001" },
    ]);
  });

  it("uses a presented opaque session subject before authentication", () => {
    expect(
      buildAbuseLimits("session.validate", {
        networkSubject: "network-subject",
        sessionSubject: "opaque-session-token",
      }).map(({ axis }) => axis),
    ).toEqual(["NETWORK", "SESSION"]);
  });

  it("keeps the callback device axis optional and rejects missing required context", () => {
    expect(
      buildAbuseLimits("auth.callback", {
        networkSubject: "network-subject",
      }).map(({ axis }) => axis),
    ).toEqual(["NETWORK"]);
    expect(() =>
      buildAbuseLimits("moderation.trip", {
        actor,
        networkSubject: "network-subject",
      }),
    ).toThrow(AbusePolicyContextError);
    expect(() =>
      buildAbuseLimits("public.trip-detail", {
        networkSubject: "network-subject",
        targetSubject: "x".repeat(513),
      }),
    ).toThrow(AbusePolicyContextError);
  });

  it("keeps every policy bounded and independently named", () => {
    expect(Object.keys(abusePolicyDefinitions)).toHaveLength(12);
    for (const [name, definitions] of Object.entries(abusePolicyDefinitions)) {
      expect(name).toMatch(/^[a-z][a-z0-9.-]+$/);
      expect(definitions.length).toBeGreaterThan(0);
      expect(definitions.length).toBeLessThanOrEqual(5);
      expect(definitions.some(({ axis }) => axis === "NETWORK")).toBe(true);
      expect(new Set(definitions.map(({ axis }) => axis)).size).toBe(
        definitions.length,
      );
      expect(
        abusePolicyStorageKey(name as keyof typeof abusePolicyDefinitions),
      ).toBe(`${name}.v1`);
    }
  });
});
