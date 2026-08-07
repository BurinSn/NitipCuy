import { createHmac, randomBytes, randomUUID } from "node:crypto";

import type { ClockPort } from "@nitipcuy/application";
import {
  accountId,
  sessionId,
  type AccountId,
  type AssuranceLevel,
  type AuthenticatedActor,
  type Capability,
  type SessionId,
} from "@nitipcuy/domain";

import type { Prisma, PrismaClient } from "./generated/prisma/client";
import { createHostOnlyBrowserCookie } from "./browser-cookie";
import { serializableTransactionOptions } from "./prisma-transaction";

const tokenBytes = 32;

export const sessionCookie = createHostOnlyBrowserCookie(
  "__Host-nitipcuy-session",
);

export interface SessionAuthorityOptions {
  readonly clock: ClockPort;
  readonly idleTtlMs?: number;
  readonly absoluteTtlMs?: number;
  readonly tokenHmacKey: Uint8Array;
}

export interface SessionGrant {
  readonly token: string;
  readonly actor: AuthenticatedActor;
  readonly idleExpiresAt: string;
  readonly absoluteExpiresAt: string;
}

export interface ActiveSessionSummary {
  readonly id: SessionId;
  readonly assurance: AssuranceLevel;
  readonly createdAt: string;
  readonly lastSeenAt: string;
  readonly idleExpiresAt: string;
  readonly absoluteExpiresAt: string;
}

export class PostgresSessionAuthority {
  private readonly idleTtlMs: number;
  private readonly absoluteTtlMs: number;
  private readonly tokenHmacKey: Uint8Array;

  constructor(
    private readonly prisma: PrismaClient,
    private readonly options: SessionAuthorityOptions,
  ) {
    this.idleTtlMs = boundedTtl(
      options.idleTtlMs ?? 30 * 60_000,
      "Idle session TTL",
      5 * 60_000,
      24 * 60 * 60_000,
    );
    this.absoluteTtlMs = boundedTtl(
      options.absoluteTtlMs ?? 12 * 60 * 60_000,
      "Absolute session TTL",
      this.idleTtlMs,
      30 * 24 * 60 * 60_000,
    );
    if (options.tokenHmacKey.byteLength < 32) {
      throw new Error("Session token HMAC key must contain at least 32 bytes.");
    }
    this.tokenHmacKey = Uint8Array.from(options.tokenHmacKey);
  }

  create(requestedAccountId: AccountId): Promise<SessionGrant | null> {
    return this.prisma.$transaction(async (transaction) => {
      const account = await transaction.account.findUnique({
        include: { capabilities: true },
        where: { id: requestedAccountId },
      });
      if (!account || account.status !== "ACTIVE") {
        return null;
      }

      return this.createPersistedGrant(transaction, {
        account,
        assurance: "BASE",
        familyId: randomUUID(),
        parentSessionId: null,
      });
    }, serializableTransactionOptions);
  }

  async validate(token: string): Promise<AuthenticatedActor | null> {
    const digest = this.digestToken(token);

    return this.prisma.$transaction(async (transaction) => {
      const stored = await transaction.browserSession.findUnique({
        include: { account: { include: { capabilities: true } } },
        where: { tokenDigest: digest },
      });
      if (!stored) {
        return null;
      }

      if (stored.status === "ROTATED") {
        const now = this.now();
        await transaction.browserSession.updateMany({
          data: {
            revocationReason: "ROTATED_TOKEN_REUSE",
            revokedAt: now,
            status: "REVOKED",
          },
          where: { familyId: stored.familyId, status: "ACTIVE" },
        });
        return null;
      }

      const now = this.now();
      if (
        stored.status !== "ACTIVE" ||
        stored.account.status !== "ACTIVE" ||
        stored.accountSessionVersion !== stored.account.sessionVersion ||
        stored.idleExpiresAt <= now ||
        stored.absoluteExpiresAt <= now
      ) {
        await transaction.browserSession.updateMany({
          data: {
            revocationReason:
              stored.idleExpiresAt <= now || stored.absoluteExpiresAt <= now
                ? "EXPIRED"
                : "ACCOUNT_STATE_CHANGED",
            revokedAt: now,
            status:
              stored.idleExpiresAt <= now || stored.absoluteExpiresAt <= now
                ? "EXPIRED"
                : "REVOKED",
          },
          where: { id: stored.id, status: "ACTIVE" },
        });
        return null;
      }

      const idleExpiresAt = new Date(
        Math.min(
          now.getTime() + this.idleTtlMs,
          stored.absoluteExpiresAt.getTime(),
        ),
      );
      const touched = await transaction.browserSession.updateMany({
        data: { idleExpiresAt, lastSeenAt: now },
        where: { id: stored.id, status: "ACTIVE", tokenDigest: digest },
      });

      return touched.count === 1 ? mapActor(stored) : null;
    }, serializableTransactionOptions);
  }

  rotate(token: string): Promise<SessionGrant | null> {
    const digest = this.digestToken(token);

    return this.prisma.$transaction(async (transaction) => {
      const stored = await transaction.browserSession.findUnique({
        include: { account: { include: { capabilities: true } } },
        where: { tokenDigest: digest },
      });
      const now = this.now();
      if (
        !stored ||
        stored.status !== "ACTIVE" ||
        stored.account.status !== "ACTIVE" ||
        stored.accountSessionVersion !== stored.account.sessionVersion ||
        stored.idleExpiresAt <= now ||
        stored.absoluteExpiresAt <= now
      ) {
        return null;
      }

      const rotated = await transaction.browserSession.updateMany({
        data: { status: "ROTATED" },
        where: { id: stored.id, status: "ACTIVE", tokenDigest: digest },
      });
      if (rotated.count !== 1) {
        return null;
      }

      return this.createPersistedGrant(transaction, {
        account: stored.account,
        assurance: stored.assurance,
        absoluteExpiresAt: stored.absoluteExpiresAt,
        familyId: stored.familyId,
        parentSessionId: stored.id,
      });
    }, serializableTransactionOptions);
  }

  async revoke(token: string, reason = "USER_LOGOUT"): Promise<boolean> {
    const result = await this.prisma.browserSession.updateMany({
      data: {
        revocationReason: boundedReason(reason),
        revokedAt: this.now(),
        status: "REVOKED",
      },
      where: { status: "ACTIVE", tokenDigest: this.digestToken(token) },
    });
    return result.count === 1;
  }

  async revokeAll(
    account: AccountId,
    reason = "ACCOUNT_WIDE_REVOCATION",
  ): Promise<void> {
    await this.prisma.$transaction(async (transaction) => {
      await transaction.account.update({
        data: { sessionVersion: { increment: 1 } },
        where: { id: account },
      });
      await transaction.browserSession.updateMany({
        data: {
          revocationReason: boundedReason(reason),
          revokedAt: this.now(),
          status: "REVOKED",
        },
        where: { accountId: account, status: "ACTIVE" },
      });
    }, serializableTransactionOptions);
  }

  async listActive(
    account: AccountId,
  ): Promise<readonly ActiveSessionSummary[]> {
    const now = this.now();
    const rows = await this.prisma.browserSession.findMany({
      orderBy: [{ lastSeenAt: "desc" }, { id: "asc" }],
      where: {
        absoluteExpiresAt: { gt: now },
        accountId: account,
        idleExpiresAt: { gt: now },
        status: "ACTIVE",
      },
    });

    return Object.freeze(
      rows.map((row) =>
        Object.freeze({
          absoluteExpiresAt: row.absoluteExpiresAt.toISOString(),
          assurance: row.assurance,
          createdAt: row.createdAt.toISOString(),
          id: sessionId(row.id),
          idleExpiresAt: row.idleExpiresAt.toISOString(),
          lastSeenAt: row.lastSeenAt.toISOString(),
        }),
      ),
    );
  }

  async revokeById(account: AccountId, id: SessionId): Promise<boolean> {
    const result = await this.prisma.browserSession.updateMany({
      data: {
        revocationReason: "USER_SESSION_REVOCATION",
        revokedAt: this.now(),
        status: "REVOKED",
      },
      where: { accountId: account, id, status: "ACTIVE" },
    });
    return result.count === 1;
  }

  private async createPersistedGrant(
    transaction: Prisma.TransactionClient,
    input: {
      readonly account: {
        readonly id: string;
        readonly sessionVersion: number;
        readonly capabilities: readonly { readonly capability: Capability }[];
      };
      readonly assurance: AssuranceLevel;
      readonly familyId: string;
      readonly parentSessionId: string | null;
      readonly absoluteExpiresAt?: Date;
    },
  ): Promise<SessionGrant> {
    const now = this.now();
    const absoluteExpiresAt =
      input.absoluteExpiresAt ?? new Date(now.getTime() + this.absoluteTtlMs);
    const idleExpiresAt = new Date(
      Math.min(now.getTime() + this.idleTtlMs, absoluteExpiresAt.getTime()),
    );
    const token = randomBytes(tokenBytes).toString("base64url");
    const id = randomUUID();

    await transaction.browserSession.create({
      data: {
        absoluteExpiresAt,
        accountId: input.account.id,
        accountSessionVersion: input.account.sessionVersion,
        assurance: input.assurance,
        createdAt: now,
        familyId: input.familyId,
        id,
        idleExpiresAt,
        lastSeenAt: now,
        parentSessionId: input.parentSessionId,
        tokenDigest: this.digestToken(token),
      },
    });

    return Object.freeze({
      absoluteExpiresAt: absoluteExpiresAt.toISOString(),
      actor: mapActor({
        account: input.account,
        assurance: input.assurance,
        id,
      }),
      idleExpiresAt: idleExpiresAt.toISOString(),
      token,
    });
  }

  private digestToken(token: string): string {
    if (!/^[A-Za-z0-9_-]{40,128}$/.test(token)) {
      return createHmac("sha256", this.tokenHmacKey)
        .update("invalid-session-token")
        .digest("hex");
    }
    return createHmac("sha256", this.tokenHmacKey).update(token).digest("hex");
  }

  private now(): Date {
    const value = new Date(this.options.clock.now());
    if (Number.isNaN(value.getTime())) {
      throw new Error("Clock returned an invalid instant.");
    }
    return value;
  }
}

function mapActor(input: {
  readonly id: string;
  readonly assurance: AssuranceLevel;
  readonly account: {
    readonly id: string;
    readonly capabilities: readonly { readonly capability: Capability }[];
  };
}): AuthenticatedActor {
  return Object.freeze({
    accountId: accountId(input.account.id),
    assurance: input.assurance,
    capabilities: new Set(
      input.account.capabilities.map((entry) => entry.capability),
    ),
    sessionId: sessionId(input.id),
  });
}

function boundedTtl(
  value: number,
  field: string,
  minimum: number,
  maximum: number,
): number {
  if (!Number.isInteger(value) || value < minimum || value > maximum) {
    throw new Error(`${field} must be between ${minimum} and ${maximum} ms.`);
  }
  return value;
}

function boundedReason(value: string): string {
  const normalized = value.trim();
  if (!/^[A-Z0-9_]{2,80}$/.test(normalized)) {
    throw new Error("Session revocation reason is invalid.");
  }
  return normalized;
}
