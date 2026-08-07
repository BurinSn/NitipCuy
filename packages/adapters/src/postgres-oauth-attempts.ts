import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
  randomUUID,
} from "node:crypto";

import type { ClockPort } from "@nitipcuy/application";

import type { PrismaClient } from "./generated/prisma/client";
import { createHostOnlyBrowserCookie } from "./browser-cookie";
import { serializableTransactionOptions } from "./prisma-transaction";

export interface OAuthAttemptAuthorityOptions {
  readonly clock: ClockPort;
  readonly encryptionKey: Uint8Array;
  readonly ttlMs?: number;
}

export interface OAuthAttemptStart {
  readonly state: string;
  readonly browserBinding: string;
  readonly nonce: string;
  readonly codeVerifier: string;
  readonly returnTo: string;
  readonly expiresAt: string;
}

export interface ConsumedOAuthAttempt {
  readonly nonce: string;
  readonly codeVerifier: string;
  readonly returnTo: string;
}

export const oauthAttemptCookie = createHostOnlyBrowserCookie(
  "__Host-nitipcuy-oauth-attempt",
);

export class PostgresOAuthAttemptAuthority {
  private readonly encryptionKey: Uint8Array;
  private readonly ttlMs: number;

  constructor(
    private readonly prisma: PrismaClient,
    private readonly options: OAuthAttemptAuthorityOptions,
  ) {
    if (options.encryptionKey.byteLength !== 32) {
      throw new Error(
        "OAuth attempt encryption key must contain exactly 32 bytes.",
      );
    }
    this.encryptionKey = Uint8Array.from(options.encryptionKey);
    this.ttlMs = boundedTtl(options.ttlMs ?? 10 * 60_000);
  }

  async create(returnToInput: string): Promise<OAuthAttemptStart> {
    const returnTo = safeLocalReturnPath(returnToInput);
    const now = this.now();
    const expiresAt = new Date(now.getTime() + this.ttlMs);
    const state = randomBytes(32).toString("base64url");
    const browserBinding = randomBytes(32).toString("base64url");
    const nonce = randomBytes(32).toString("base64url");
    const codeVerifier = randomBytes(64).toString("base64url");

    await this.prisma.oAuthAttempt.create({
      data: {
        createdAt: now,
        browserBindingDigest: digestOpaque(browserBinding),
        expiresAt,
        id: randomUUID(),
        returnTo,
        sealedCodeVerifier: seal(codeVerifier, this.encryptionKey),
        sealedNonce: seal(nonce, this.encryptionKey),
        stateDigest: digestOpaque(state),
      },
    });

    return Object.freeze({
      browserBinding,
      codeVerifier,
      expiresAt: expiresAt.toISOString(),
      nonce,
      returnTo,
      state,
    });
  }

  consume(
    state: string,
    browserBinding: string,
  ): Promise<ConsumedOAuthAttempt | null> {
    const stateDigest = digestOpaque(normalizeOpaque(state, "invalid-state"));
    const browserBindingDigest = digestOpaque(
      normalizeOpaque(browserBinding, "invalid-browser-binding"),
    );

    return this.prisma.$transaction(async (transaction) => {
      const attempt = await transaction.oAuthAttempt.findUnique({
        where: { stateDigest },
      });
      if (
        !attempt ||
        attempt.status !== "PENDING" ||
        attempt.browserBindingDigest !== browserBindingDigest
      ) {
        return null;
      }

      const now = this.now();
      if (attempt.expiresAt <= now) {
        await transaction.oAuthAttempt.updateMany({
          data: { status: "EXPIRED" },
          where: { id: attempt.id, status: "PENDING" },
        });
        return null;
      }

      let codeVerifier: string;
      let nonce: string;
      try {
        codeVerifier = unseal(attempt.sealedCodeVerifier, this.encryptionKey);
        nonce = unseal(attempt.sealedNonce, this.encryptionKey);
      } catch {
        await transaction.oAuthAttempt.updateMany({
          data: { status: "EXPIRED" },
          where: { id: attempt.id, status: "PENDING" },
        });
        return null;
      }

      const claimed = await transaction.oAuthAttempt.updateMany({
        data: { consumedAt: now, status: "CONSUMED" },
        where: { id: attempt.id, status: "PENDING" },
      });
      if (claimed.count !== 1) {
        return null;
      }

      return Object.freeze({
        codeVerifier,
        nonce,
        returnTo: safeLocalReturnPath(attempt.returnTo),
      });
    }, serializableTransactionOptions);
  }

  private now(): Date {
    const value = new Date(this.options.clock.now());
    if (Number.isNaN(value.getTime())) {
      throw new Error("Clock returned an invalid instant.");
    }
    return value;
  }
}

export function safeLocalReturnPath(value: string): string {
  const normalized = value.trim();
  if (
    normalized.length < 1 ||
    normalized.length > 512 ||
    !normalized.startsWith("/") ||
    normalized.startsWith("//") ||
    !/^\/[A-Za-z0-9/_?=&.%-]*$/.test(normalized) ||
    /[\\\u0000-\u001f\u007f]/.test(normalized) ||
    /%(?:0a|0d|2f|5c)/i.test(normalized)
  ) {
    throw new Error("OAuth return path must be a safe local path.");
  }

  const parsed = new URL(normalized, "https://nitipcuy.invalid");
  if (parsed.origin !== "https://nitipcuy.invalid") {
    throw new Error("OAuth return path must be a safe local path.");
  }
  return `${parsed.pathname}${parsed.search}${parsed.hash}`;
}

function normalizeOpaque(value: string, invalidValue: string): string {
  const normalized = value.trim();
  if (!/^[A-Za-z0-9_-]{40,128}$/.test(normalized)) {
    return invalidValue;
  }
  return normalized;
}

function digestOpaque(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function seal(value: string, key: Uint8Array): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(value, "utf8"),
    cipher.final(),
  ]);
  return [
    "v1",
    iv.toString("base64url"),
    ciphertext.toString("base64url"),
    cipher.getAuthTag().toString("base64url"),
  ].join(".");
}

function unseal(value: string, key: Uint8Array): string {
  const [version, iv, ciphertext, authTag, ...extra] = value.split(".");
  if (version !== "v1" || !iv || !ciphertext || !authTag || extra.length > 0) {
    throw new Error("Stored OAuth attempt ciphertext is invalid.");
  }

  const decipher = createDecipheriv(
    "aes-256-gcm",
    key,
    Buffer.from(iv, "base64url"),
  );
  decipher.setAuthTag(Buffer.from(authTag, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(ciphertext, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}

function boundedTtl(value: number): number {
  if (!Number.isInteger(value) || value < 60_000 || value > 30 * 60_000) {
    throw new Error("OAuth attempt TTL must be between 1 and 30 minutes.");
  }
  return value;
}
