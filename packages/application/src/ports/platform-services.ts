export interface VerifiedExternalIdentity {
  readonly provider: string;
  readonly subject: string;
  readonly assurance: "BASE" | "STRONG";
  readonly authenticatedAt: string;
}

export interface IdentityVerificationPort {
  verifyProof(proofReference: string): Promise<VerifiedExternalIdentity | null>;
}

export interface StoreEvidenceCommand {
  readonly idempotencyKey: string;
  readonly evidenceId: string;
  readonly ownerAccountId: string;
  readonly classification:
    "PURCHASE" | "COLLECTION" | "WEIGHT" | "DISPATCH" | "DELIVERY";
  readonly contentType: string;
  readonly byteLength: number;
  readonly sha256: string;
  readonly content: Uint8Array;
}

export interface StoredEvidence {
  readonly objectReference: string;
  readonly sha256: string;
  readonly byteLength: number;
}

export interface EvidenceStoragePort {
  store(command: StoreEvidenceCommand): Promise<StoredEvidence>;
}

export interface ClockPort {
  now(): string;
}

export interface IdentifierPort {
  next(namespace: string): string;
}

export interface AuditRecord {
  readonly actorId: string;
  readonly action: string;
  readonly targetType: string;
  readonly targetId: string;
  readonly reasonCode: string;
  readonly occurredAt: string;
  readonly correlationId: string;
  readonly outcome: "SUCCEEDED" | "DENIED" | "FAILED";
}

export interface AuditPort {
  append(record: AuditRecord): Promise<void>;
}

export interface OutboxMessage {
  readonly id: string;
  readonly topic: string;
  readonly aggregateType: string;
  readonly aggregateId: string;
  readonly occurredAt: string;
  readonly payload: Readonly<Record<string, unknown>>;
}

export interface OutboxPort {
  enqueue(message: OutboxMessage): Promise<void>;
}
