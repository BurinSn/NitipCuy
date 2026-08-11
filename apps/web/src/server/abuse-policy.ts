import { createHash } from "node:crypto";

import type { AbuseBucketLimit, AbuseRateLimitAxis } from "@nitipcuy/adapters";
import type { AuthenticatedActor } from "@nitipcuy/domain";

export type AbusePolicyName = keyof typeof abusePolicyDefinitions;

export interface AbusePolicyContext {
  readonly actor?: AuthenticatedActor;
  readonly deviceSubject?: string;
  readonly networkSubject: string;
  readonly sessionSubject?: string;
  readonly targetSubject?: string;
}

export class AbusePolicyContextError extends Error {
  constructor(readonly kind: "INVALID" | "MISSING") {
    super("Abuse policy context is invalid.");
    this.name = "AbusePolicyContextError";
  }
}

interface AxisDefinition {
  readonly axis: AbuseRateLimitAxis;
  readonly maximumAttempts: number;
  readonly required: boolean;
  readonly source:
    | "account"
    | "account-target"
    | "device"
    | "network"
    | "network-target"
    | "session";
  readonly windowMs: number;
}

const minute = 60_000;

export const abusePolicyDefinitions = Object.freeze({
  "auth.callback": axes(
    axis("NETWORK", "network", 20, 10 * minute),
    axis("DEVICE", "device", 8, 10 * minute, false),
  ),
  "auth.start": axes(axis("NETWORK", "network", 10, 10 * minute)),
  "discussion.answer": axes(
    axis("NETWORK", "network", 30, minute),
    axis("ACCOUNT", "account", 12, 10 * minute),
    axis("SESSION", "session", 12, 10 * minute),
    axis("TARGET", "account-target", 6, 10 * minute),
  ),
  "discussion.question": axes(
    axis("NETWORK", "network", 30, minute),
    axis("ACCOUNT", "account", 12, 10 * minute),
    axis("SESSION", "session", 12, 10 * minute),
    axis("TARGET", "account-target", 6, 10 * minute),
  ),
  "moderation.trip": axes(
    axis("NETWORK", "network", 20, minute),
    axis("ACCOUNT", "account", 10, 10 * minute),
    axis("SESSION", "session", 10, 10 * minute),
    axis("TARGET", "account-target", 4, 10 * minute),
  ),
  "profile.create": axes(
    axis("NETWORK", "network", 30, minute),
    axis("ACCOUNT", "account", 6, 10 * minute),
    axis("SESSION", "session", 6, 10 * minute),
  ),
  "public.trip-detail": axes(
    axis("NETWORK", "network", 120, minute),
    axis("TARGET", "network-target", 60, minute),
  ),
  "public.trip-list": axes(axis("NETWORK", "network", 120, minute)),
  "session.logout": axes(
    axis("NETWORK", "network", 60, minute),
    axis("SESSION", "session", 10, minute, false),
  ),
  "session.validate": axes(
    axis("NETWORK", "network", 120, minute),
    axis("SESSION", "session", 60, minute),
  ),
  "trip.create": axes(
    axis("NETWORK", "network", 60, minute),
    axis("ACCOUNT", "account", 20, 10 * minute),
    axis("SESSION", "session", 20, 10 * minute),
  ),
  "trip.submit": axes(
    axis("NETWORK", "network", 30, minute),
    axis("ACCOUNT", "account", 10, 10 * minute),
    axis("SESSION", "session", 10, 10 * minute),
    axis("TARGET", "account-target", 5, 10 * minute),
  ),
});

export function buildAbuseLimits(
  policy: AbusePolicyName,
  context: AbusePolicyContext,
): readonly AbuseBucketLimit[] {
  return abusePolicyDefinitions[policy]
    .map((definition) => {
      const subject = subjectFor(definition.source, context);
      if (!subject && definition.required) {
        throw new AbusePolicyContextError("MISSING");
      }
      return subject
        ? Object.freeze({
            axis: definition.axis,
            maximumAttempts: definition.maximumAttempts,
            subject,
            windowMs: definition.windowMs,
          })
        : null;
    })
    .filter((limit): limit is AbuseBucketLimit => limit !== null);
}

export function abusePolicyStorageKey(policy: AbusePolicyName): string {
  return `${policy}.v1`;
}

function axes(...definitions: readonly AxisDefinition[]) {
  return Object.freeze(definitions);
}

function axis(
  axisName: AbuseRateLimitAxis,
  source: AxisDefinition["source"],
  maximumAttempts: number,
  windowMs: number,
  required = true,
): AxisDefinition {
  return Object.freeze({
    axis: axisName,
    maximumAttempts,
    required,
    source,
    windowMs,
  });
}

function subjectFor(
  source: AxisDefinition["source"],
  context: AbusePolicyContext,
): string | undefined {
  let subject: string | undefined;
  if (source === "account") {
    subject = context.actor?.accountId;
  } else if (source === "account-target") {
    return compoundSubject(context.actor?.accountId, context.targetSubject);
  } else if (source === "session") {
    subject = context.actor?.sessionId ?? context.sessionSubject;
  } else if (source === "device") {
    subject = context.deviceSubject;
  } else if (source === "network-target") {
    return compoundSubject(context.networkSubject, context.targetSubject);
  } else {
    subject = context.networkSubject;
  }

  validateSubject(subject);
  return subject;
}

function compoundSubject(
  first: string | undefined,
  second: string | undefined,
): string | undefined {
  validateSubject(first);
  validateSubject(second);
  if (first === undefined || second === undefined) {
    return undefined;
  }
  return createHash("sha256")
    .update("nitipcuy-abuse-compound-subject-v1\0")
    .update(String(first.length))
    .update(":")
    .update(first)
    .update(String(second.length))
    .update(":")
    .update(second)
    .digest("hex");
}

function validateSubject(subject: string | undefined): void {
  if (
    subject !== undefined &&
    (subject.length < 1 ||
      subject.length > 512 ||
      subject.trim() !== subject ||
      /[\u0000-\u001f\u007f]/.test(subject))
  ) {
    throw new AbusePolicyContextError("INVALID");
  }
}
