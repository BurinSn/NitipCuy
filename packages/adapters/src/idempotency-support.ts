import { createHash } from "node:crypto";

import type {
  ClaimIdempotencyCommand,
  CompleteIdempotencyCommand,
  IdempotencyClaim,
  IdempotencyStorePort,
  RequireIdempotencyRecoveryCommand,
} from "@nitipcuy/application";

interface PendingIdempotencyRecord {
  readonly state: "PENDING";
  readonly fingerprint: string;
  readonly leaseId: string;
  readonly retentionSeconds: number;
}

interface CompletedIdempotencyRecord {
  readonly state: "COMPLETED";
  readonly fingerprint: string;
  readonly result: unknown;
  readonly expiresAtMilliseconds: number;
}

interface RecoveryRequiredIdempotencyRecord {
  readonly state: "RECOVERY_REQUIRED";
  readonly fingerprint: string;
}

type IdempotencyRecord =
  | PendingIdempotencyRecord
  | CompletedIdempotencyRecord
  | RecoveryRequiredIdempotencyRecord;

/**
 * Test-only idempotency authority.
 *
 * Production composition must replace this process-local store with a shared,
 * durable implementation whose claim, completion, and recovery transitions
 * are atomic.
 */
export class InMemoryIdempotencyStore implements IdempotencyStorePort {
  private readonly records = new Map<string, IdempotencyRecord>();
  private leaseSequence = 0;

  constructor(private readonly nowMilliseconds: () => number = Date.now) {}

  claim(command: ClaimIdempotencyCommand): Promise<IdempotencyClaim> {
    const scopedKey = toScopedKey(
      command.scope,
      command.operation,
      command.key,
    );
    const now = this.nowMilliseconds();
    const existing = this.records.get(scopedKey);

    if (
      existing?.state === "COMPLETED" &&
      existing.expiresAtMilliseconds <= now
    ) {
      this.records.delete(scopedKey);
    } else if (existing && existing.fingerprint !== command.fingerprint) {
      return Promise.resolve({ status: "CONFLICT" });
    } else if (existing?.state === "PENDING") {
      return Promise.resolve({ status: "IN_PROGRESS" });
    } else if (existing?.state === "RECOVERY_REQUIRED") {
      return Promise.resolve({ status: "RECOVERY_REQUIRED" });
    } else if (existing?.state === "COMPLETED") {
      return Promise.resolve({
        status: "REPLAY",
        result: cloneValue(existing.result),
      });
    }

    this.leaseSequence += 1;
    const leaseId = `in-memory-idempotency-lease-${this.leaseSequence}`;
    this.records.set(scopedKey, {
      state: "PENDING",
      fingerprint: command.fingerprint,
      leaseId,
      retentionSeconds: command.retentionSeconds,
    });

    return Promise.resolve({ status: "CLAIMED", leaseId });
  }

  complete(command: CompleteIdempotencyCommand): Promise<void> {
    const scopedKey = toScopedKey(
      command.scope,
      command.operation,
      command.key,
    );
    const existing = this.records.get(scopedKey);

    if (
      existing?.state !== "PENDING" ||
      existing.fingerprint !== command.fingerprint ||
      existing.leaseId !== command.leaseId
    ) {
      return Promise.reject(
        new Error("Idempotency completion does not own the active claim."),
      );
    }

    this.records.set(scopedKey, {
      state: "COMPLETED",
      fingerprint: existing.fingerprint,
      result: cloneValue(command.result),
      expiresAtMilliseconds: addRetention(
        this.nowMilliseconds(),
        existing.retentionSeconds,
      ),
    });

    return Promise.resolve();
  }

  requireRecovery(command: RequireIdempotencyRecoveryCommand): Promise<void> {
    const scopedKey = toScopedKey(
      command.scope,
      command.operation,
      command.key,
    );
    const existing = this.records.get(scopedKey);

    if (
      existing?.state !== "PENDING" ||
      existing.fingerprint !== command.fingerprint ||
      existing.leaseId !== command.leaseId
    ) {
      return Promise.reject(
        new Error(
          "Idempotency recovery transition does not own the active claim.",
        ),
      );
    }

    this.records.set(scopedKey, {
      state: "RECOVERY_REQUIRED",
      fingerprint: existing.fingerprint,
    });
    return Promise.resolve();
  }
}

export function commandFingerprint(
  payload: Readonly<Record<string, unknown>>,
): string {
  return createHash("sha256").update(canonicalize(payload)).digest("hex");
}

function toScopedKey(scope: string, operation: string, key: string): string {
  return `${scope}\u0000${operation}\u0000${key}`;
}

function addRetention(now: number, retentionSeconds: number): number {
  const expiresAt = now + retentionSeconds * 1_000;

  if (!Number.isSafeInteger(expiresAt)) {
    throw new Error("Idempotency expiry exceeds the supported clock range.");
  }

  return expiresAt;
}

function canonicalize(value: unknown): string {
  if (value === null) {
    return "null";
  }

  if (typeof value === "string") {
    return `string:${JSON.stringify(value)}`;
  }

  if (typeof value === "boolean") {
    return value ? "boolean:true" : "boolean:false";
  }

  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new Error("Idempotency payload contains a non-finite number.");
    }

    return `number:${Object.is(value, -0) ? "-0" : JSON.stringify(value)}`;
  }

  if (typeof value === "bigint") {
    return `bigint:${value.toString()}`;
  }

  if (value instanceof Uint8Array) {
    return `bytes:[${Array.from(value).join(",")}]`;
  }

  if (Array.isArray(value)) {
    return `array:[${value.map((item) => canonicalize(item)).join(",")}]`;
  }

  if (typeof value === "object") {
    const prototype = Object.getPrototypeOf(value);

    if (prototype !== Object.prototype && prototype !== null) {
      throw new Error("Idempotency payload contains a non-plain object.");
    }

    const record = value as Readonly<Record<string, unknown>>;
    return `object:{${Object.keys(record)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalize(record[key])}`)
      .join(",")}}`;
  }

  throw new Error("Idempotency payload contains an unsupported value.");
}

function cloneValue<Value>(value: Value): Value {
  return structuredClone(value);
}
