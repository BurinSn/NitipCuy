import type {
  AuditPort,
  AuditRecord,
  ClockPort,
  IdentifierPort,
  IdentityVerificationPort,
  OutboxMessage,
  OutboxPort,
  VerifiedExternalIdentity,
} from "@nitipcuy/application";

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
