export interface VerifiedExternalIdentity {
  readonly provider: string;
  readonly subject: string;
  readonly assurance: "BASE" | "STRONG";
  readonly authenticatedAt: string;
}

export interface IdentityVerificationPort {
  verifyProof(proofReference: string): Promise<VerifiedExternalIdentity | null>;
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
