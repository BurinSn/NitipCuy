import type {
  AuditPort,
  AuditRecord,
  ClockPort,
  EvidenceStoragePort,
  IdempotencyStorePort,
  IdentifierPort,
  IdentityVerificationPort,
  OutboxMessage,
  OutboxPort,
  StoredEvidence,
  StoreEvidenceCommand,
  VerifiedExternalIdentity,
} from "@nitipcuy/application";
import { executeIdempotently } from "@nitipcuy/application";

import {
  commandFingerprint,
  InMemoryIdempotencyStore,
} from "./idempotency-support";

const EVIDENCE_IDEMPOTENCY_RETENTION_SECONDS = 30 * 24 * 60 * 60;

export class FixedClock implements ClockPort {
  constructor(private readonly instant: string) {
    if (
      !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(?:\.\d{3})?)?(Z|[+-]\d{2}:\d{2})$/.test(
        instant,
      ) ||
      Number.isNaN(Date.parse(instant))
    ) {
      throw new Error("Fixed clock requires an ISO timestamp with a timezone.");
    }
  }

  now(): string {
    return this.instant;
  }
}

export class SequenceIdentifier implements IdentifierPort {
  private value = 0;

  next(namespace: string): string {
    const normalized = namespace.trim().toLowerCase();

    if (!/^[a-z][a-z0-9-]{1,31}$/.test(normalized)) {
      throw new Error("Identifier namespace is invalid.");
    }

    this.value += 1;
    return `${normalized}-${this.value.toString().padStart(4, "0")}`;
  }
}

export class InMemoryAudit implements AuditPort {
  readonly records: AuditRecord[] = [];

  append(record: AuditRecord): Promise<void> {
    this.records.push(Object.freeze({ ...record }));
    return Promise.resolve();
  }
}

export class InMemoryOutbox implements OutboxPort {
  readonly messages: OutboxMessage[] = [];

  enqueue(message: OutboxMessage): Promise<void> {
    this.messages.push(
      Object.freeze({
        ...message,
        payload: Object.freeze({ ...message.payload }),
      }),
    );
    return Promise.resolve();
  }
}

export class MockIdentityVerification implements IdentityVerificationPort {
  constructor(
    private readonly identities: Readonly<
      Record<string, VerifiedExternalIdentity>
    >,
  ) {}

  verifyProof(
    proofReference: string,
  ): Promise<VerifiedExternalIdentity | null> {
    const identity = this.identities[proofReference];
    return Promise.resolve(identity ? Object.freeze({ ...identity }) : null);
  }
}

export class InMemoryEvidenceStorage implements EvidenceStoragePort {
  readonly stored: StoreEvidenceCommand[] = [];

  constructor(
    private readonly idempotencyStore: IdempotencyStorePort = new InMemoryIdempotencyStore(),
  ) {}

  store(command: StoreEvidenceCommand): Promise<StoredEvidence> {
    if (
      command.byteLength <= 0 ||
      command.byteLength !== command.content.byteLength
    ) {
      return Promise.reject(
        new Error("Evidence byte length must match non-empty content."),
      );
    }

    if (!/^[a-f0-9]{64}$/.test(command.sha256)) {
      return Promise.reject(
        new Error("Evidence SHA-256 must be lowercase hexadecimal."),
      );
    }

    return executeIdempotently(
      this.idempotencyStore,
      {
        scope: `account:${command.ownerAccountId}`,
        operation: "evidence.store",
        key: command.idempotencyKey,
        fingerprint: commandFingerprint({
          evidenceId: command.evidenceId,
          ownerAccountId: command.ownerAccountId,
          classification: command.classification,
          contentType: command.contentType,
          byteLength: command.byteLength,
          sha256: command.sha256,
          content: command.content,
        }),
        retentionSeconds: EVIDENCE_IDEMPOTENCY_RETENTION_SECONDS,
      },
      () => {
        const snapshot = Object.freeze({
          ...command,
          content: new Uint8Array(command.content),
        });
        this.stored.push(snapshot);

        return Promise.resolve(
          Object.freeze({
            objectReference: `mock-evidence-${command.evidenceId}`,
            sha256: command.sha256,
            byteLength: command.byteLength,
          }),
        );
      },
    );
  }
}
