export interface ClaimIdempotencyCommand {
  readonly scope: string;
  readonly operation: string;
  readonly key: string;
  readonly fingerprint: string;
  readonly retentionSeconds: number;
}

export type IdempotencyClaim =
  | {
      readonly status: "CLAIMED";
      readonly leaseId: string;
    }
  | {
      readonly status: "REPLAY";
      readonly result: unknown;
    }
  | {
      readonly status: "CONFLICT";
    }
  | {
      readonly status: "IN_PROGRESS";
    }
  | {
      readonly status: "RECOVERY_REQUIRED";
    };

export interface CompleteIdempotencyCommand {
  readonly scope: string;
  readonly operation: string;
  readonly key: string;
  readonly fingerprint: string;
  readonly leaseId: string;
  readonly result: unknown;
}

export interface RequireIdempotencyRecoveryCommand {
  readonly scope: string;
  readonly operation: string;
  readonly key: string;
  readonly fingerprint: string;
  readonly leaseId: string;
}

export interface IdempotencyStorePort {
  /**
   * Atomically claims a scoped key or reports its existing state.
   *
   * Production implementations must share this state across every web and
   * worker instance. A process-local implementation is suitable only for
   * deterministic tests and local architecture probes.
   */
  claim(command: ClaimIdempotencyCommand): Promise<IdempotencyClaim>;
  complete(command: CompleteIdempotencyCommand): Promise<void>;
  requireRecovery(command: RequireIdempotencyRecoveryCommand): Promise<void>;
}

export interface IdempotentOperation {
  readonly scope: string;
  readonly operation: string;
  readonly key: string;
  readonly fingerprint: string;
  readonly retentionSeconds: number;
}

export class IdempotencyValidationError extends Error {
  readonly code = "IDEMPOTENCY_VALIDATION_FAILED";

  constructor(message: string) {
    super(message);
    this.name = "IdempotencyValidationError";
  }
}

export class IdempotencyConflictError extends Error {
  readonly code = "IDEMPOTENCY_KEY_REUSED";

  constructor(operation: string) {
    super(
      `Idempotency key was already used with a different ${operation} payload.`,
    );
    this.name = "IdempotencyConflictError";
  }
}

export class IdempotencyInProgressError extends Error {
  readonly code = "IDEMPOTENCY_OPERATION_IN_PROGRESS";

  constructor(operation: string) {
    super(
      `An operation with this ${operation} idempotency key is in progress.`,
    );
    this.name = "IdempotencyInProgressError";
  }
}

export class IdempotencyRecoveryRequiredError extends Error {
  readonly code = "IDEMPOTENCY_RECOVERY_REQUIRED";

  constructor(operation: string) {
    super(
      `The previous ${operation} attempt has an uncertain outcome and requires reconciliation.`,
    );
    this.name = "IdempotencyRecoveryRequiredError";
  }
}

export async function executeIdempotently<Result>(
  store: IdempotencyStorePort,
  operation: IdempotentOperation,
  execute: () => Promise<Result>,
): Promise<Result> {
  validateOperation(operation);

  const claim = await store.claim(operation);

  if (claim.status === "REPLAY") {
    return claim.result as Result;
  }

  if (claim.status === "CONFLICT") {
    throw new IdempotencyConflictError(operation.operation);
  }

  if (claim.status === "IN_PROGRESS") {
    throw new IdempotencyInProgressError(operation.operation);
  }

  if (claim.status === "RECOVERY_REQUIRED") {
    throw new IdempotencyRecoveryRequiredError(operation.operation);
  }

  let result: Result;

  try {
    result = await execute();
  } catch (error) {
    try {
      await store.requireRecovery({
        scope: operation.scope,
        operation: operation.operation,
        key: operation.key,
        fingerprint: operation.fingerprint,
        leaseId: claim.leaseId,
      });
    } catch (stateError) {
      throw new AggregateError(
        [error, stateError],
        "The operation failed and its idempotency recovery state could not be recorded.",
      );
    }

    throw error;
  }

  await store.complete({
    scope: operation.scope,
    operation: operation.operation,
    key: operation.key,
    fingerprint: operation.fingerprint,
    leaseId: claim.leaseId,
    result,
  });

  return result;
}

function validateOperation(operation: IdempotentOperation): void {
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{2,191}$/.test(operation.scope)) {
    throw new IdempotencyValidationError(
      "Idempotency scope must contain 3-192 safe visible characters.",
    );
  }

  if (!/^[a-z][a-z0-9.-]{2,63}$/.test(operation.operation)) {
    throw new IdempotencyValidationError(
      "Idempotency operation namespace is invalid.",
    );
  }

  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{7,127}$/.test(operation.key)) {
    throw new IdempotencyValidationError(
      "Idempotency key must contain 8-128 safe visible characters.",
    );
  }

  if (!/^[a-f0-9]{64}$/.test(operation.fingerprint)) {
    throw new IdempotencyValidationError(
      "Idempotency fingerprint must be a lowercase SHA-256 value.",
    );
  }

  if (
    !Number.isSafeInteger(operation.retentionSeconds) ||
    operation.retentionSeconds < 60 ||
    operation.retentionSeconds > 31_536_000
  ) {
    throw new IdempotencyValidationError(
      "Idempotency retention must be between 60 seconds and 365 days.",
    );
  }
}
