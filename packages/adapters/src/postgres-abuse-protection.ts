import { createHmac } from "node:crypto";

import type { ClockPort, IdentifierPort } from "@nitipcuy/application";
import type { AccountId } from "@nitipcuy/domain";

import type { Prisma, PrismaClient } from "./generated/prisma/client";
import { sharedCounterTransactionOptions } from "./prisma-transaction";

const maximumPolicyWindowMs = 24 * 60 * 60_000;
const maximumRetryAfterSeconds = 24 * 60 * 60;

export type AbuseRateLimitAxis =
  "NETWORK" | "ACCOUNT" | "SESSION" | "DEVICE" | "TARGET";

export interface AbuseBucketLimit {
  readonly axis: AbuseRateLimitAxis;
  readonly maximumAttempts: number;
  readonly subject: string;
  readonly windowMs: number;
}

export interface AbuseProtectionRequest {
  readonly actorAccountId?: AccountId;
  readonly correlationId: string;
  readonly limits: readonly AbuseBucketLimit[];
  readonly policy: string;
}

export type AbuseProtectionDecision =
  | Readonly<{ readonly allowed: true }>
  | Readonly<{
      readonly allowed: false;
      readonly deniedAxes: readonly AbuseRateLimitAxis[];
      readonly retryAfterSeconds: number;
    }>;

export interface PostgresAbuseProtectionOptions {
  readonly cleanupBatchSize?: number;
  readonly identifiers: IdentifierPort;
  readonly subjectHmacKey: Uint8Array;
  readonly testClock?: ClockPort;
  readonly testTargetAcknowledgement?: "DISPOSABLE_TEST_DATABASE";
}

export class AbuseProtectionUnavailableError extends Error {
  constructor(options?: ErrorOptions) {
    super("Shared abuse protection is unavailable.", options);
    this.name = "AbuseProtectionUnavailableError";
  }
}

export class PostgresAbuseProtection {
  private readonly cleanupBatchSize: number;
  private readonly subjectHmacKey: Uint8Array;

  constructor(
    private readonly prisma: PrismaClient,
    private readonly options: PostgresAbuseProtectionOptions,
  ) {
    if (options.subjectHmacKey.byteLength !== 32) {
      throw new Error("Abuse subject HMAC key must contain exactly 32 bytes.");
    }
    if (
      Boolean(options.testClock) !==
      (options.testTargetAcknowledgement === "DISPOSABLE_TEST_DATABASE")
    ) {
      throw new Error(
        "An injected abuse clock requires disposable-test-database acknowledgement.",
      );
    }
    this.subjectHmacKey = Uint8Array.from(options.subjectHmacKey);
    this.cleanupBatchSize = boundedInteger(
      options.cleanupBatchSize ?? 100,
      "Abuse cleanup batch size",
      1,
      1_000,
    );
  }

  async evaluate(
    request: AbuseProtectionRequest,
  ): Promise<AbuseProtectionDecision> {
    const policy = validPolicy(request.policy);
    const correlationId = boundedText(
      request.correlationId,
      "Correlation ID",
      120,
    );
    const limits = normalizedLimits(request.limits);

    try {
      return await this.prisma.$transaction(async (transaction) => {
        const now = await this.authoritativeNow(transaction);
        await transaction.$executeRaw`
          DELETE FROM "abuse_rate_limit_bucket"
          WHERE ctid IN (
            SELECT ctid
            FROM "abuse_rate_limit_bucket"
            WHERE "expires_at" <= ${now}
            ORDER BY "expires_at" ASC
            LIMIT ${this.cleanupBatchSize}
          )
        `;

        const denied: Array<{
          readonly axis: AbuseRateLimitAxis;
          readonly expiresAt: Date;
          readonly key: {
            readonly axis: AbuseRateLimitAxis;
            readonly policy: string;
            readonly subjectDigest: string;
            readonly windowStartedAt: Date;
          };
        }> = [];

        for (const limit of limits) {
          const windowStartedAt = new Date(
            Math.floor(now.getTime() / limit.windowMs) * limit.windowMs,
          );
          const expiresAt = new Date(
            windowStartedAt.getTime() + limit.windowMs,
          );
          const key = {
            axis: limit.axis,
            policy,
            subjectDigest: this.subjectDigest(limit.axis, limit.subject),
            windowStartedAt,
          } as const;
          const bucket = await transaction.abuseRateLimitBucket.upsert({
            create: {
              ...key,
              expiresAt,
              updatedAt: now,
            },
            update: {
              attemptCount: { increment: 1 },
              updatedAt: now,
            },
            where: {
              policy_axis_subjectDigest_windowStartedAt: key,
            },
          });

          if (bucket.attemptCount > limit.maximumAttempts) {
            denied.push({ axis: limit.axis, expiresAt, key });
          }
        }

        for (const denial of denied) {
          const auditClaim = await transaction.abuseRateLimitBucket.updateMany({
            data: { denialAudited: true, updatedAt: now },
            where: {
              ...denial.key,
              denialAudited: false,
            },
          });
          if (auditClaim.count === 1) {
            await transaction.auditEvent.create({
              data: {
                ...(request.actorAccountId
                  ? { actorAccountId: request.actorAccountId }
                  : {}),
                action: `security.rate-limit.${policy}`,
                correlationId,
                id: this.options.identifiers.next("abuse-audit"),
                occurredAt: now,
                outcome: "DENIED",
                reasonCode: `RATE_LIMIT_${denial.axis}`,
                targetId: `${policy}:${denial.axis.toLowerCase()}`,
                targetType: "abuse-policy",
              },
            });
          }
        }

        if (denied.length === 0) {
          return Object.freeze({ allowed: true });
        }

        return Object.freeze({
          allowed: false,
          deniedAxes: Object.freeze(denied.map(({ axis }) => axis)),
          retryAfterSeconds: Math.min(
            maximumRetryAfterSeconds,
            Math.max(
              1,
              ...denied.map(({ expiresAt }) =>
                Math.ceil((expiresAt.getTime() - now.getTime()) / 1_000),
              ),
            ),
          ),
        });
      }, sharedCounterTransactionOptions);
    } catch (error) {
      throw new AbuseProtectionUnavailableError({ cause: error });
    }
  }

  private subjectDigest(axis: AbuseRateLimitAxis, subject: string): string {
    return createHmac("sha256", this.subjectHmacKey)
      .update("nitipcuy-abuse-subject-v1\0")
      .update(axis)
      .update("\0")
      .update(subject)
      .digest("hex");
  }

  private async authoritativeNow(
    transaction: Prisma.TransactionClient,
  ): Promise<Date> {
    if (this.options.testClock) {
      return validInstant(this.options.testClock.now());
    }
    const rows = await transaction.$queryRaw<
      readonly [{ readonly now: Date }]
    >`SELECT CURRENT_TIMESTAMP(3) AS "now"`;
    const now = rows[0]?.now;
    if (!(now instanceof Date) || !Number.isFinite(now.getTime())) {
      throw new Error("Database abuse decision time is invalid.");
    }
    return now;
  }
}

function normalizedLimits(
  limits: readonly AbuseBucketLimit[],
): readonly AbuseBucketLimit[] {
  if (limits.length === 0 || limits.length > 5) {
    throw new Error("Abuse policy must contain between one and five axes.");
  }

  const axes = new Set<AbuseRateLimitAxis>();
  return Object.freeze(
    [...limits]
      .map((limit) => {
        if (axes.has(limit.axis)) {
          throw new Error("Abuse policy axes must be unique.");
        }
        axes.add(limit.axis);
        return Object.freeze({
          axis: limit.axis,
          maximumAttempts: boundedInteger(
            limit.maximumAttempts,
            "Maximum attempts",
            1,
            10_000,
          ),
          subject: boundedText(limit.subject, "Abuse subject", 512),
          windowMs: boundedInteger(
            limit.windowMs,
            "Abuse policy window",
            1_000,
            maximumPolicyWindowMs,
          ),
        });
      })
      .sort((left, right) => left.axis.localeCompare(right.axis)),
  );
}

function validPolicy(value: string): string {
  if (!/^[a-z][a-z0-9.-]{1,79}$/.test(value)) {
    throw new Error("Abuse policy name is invalid.");
  }
  return value;
}

function validInstant(value: string): Date {
  const instant = new Date(value);
  if (!Number.isFinite(instant.getTime())) {
    throw new Error("Abuse decision time is invalid.");
  }
  return instant;
}

function boundedText(value: string, field: string, maximum: number): string {
  if (
    value.length < 1 ||
    value.length > maximum ||
    value.trim() !== value ||
    /[\u0000-\u001f\u007f]/.test(value)
  ) {
    throw new Error(`${field} is invalid.`);
  }
  return value;
}

function boundedInteger(
  value: number,
  field: string,
  minimum: number,
  maximum: number,
): number {
  if (!Number.isInteger(value) || value < minimum || value > maximum) {
    throw new Error(`${field} must be between ${minimum} and ${maximum}.`);
  }
  return value;
}
