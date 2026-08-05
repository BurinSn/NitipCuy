import { describe, expect, it } from "vitest";

import {
  executeIdempotently,
  IdempotencyConflictError,
  IdempotencyInProgressError,
  IdempotencyRecoveryRequiredError,
  IdempotencyValidationError,
} from "@nitipcuy/application";
import type { IdempotencyStorePort } from "@nitipcuy/application";

import {
  InMemoryIdempotencyStore,
  MockLogisticsGateway,
  MockPaymentGateway,
} from "./index";
import { commandFingerprint } from "./idempotency-support";

const fingerprintA = "a".repeat(64);
const fingerprintB = "b".repeat(64);

describe("idempotency contract", () => {
  it("uses unambiguous type-tagged canonical fingerprints", () => {
    expect(commandFingerprint({ value: 1n })).not.toBe(
      commandFingerprint({ value: { $bigint: "1" } }),
    );
    expect(commandFingerprint({ value: new Uint8Array([1, 2]) })).not.toBe(
      commandFingerprint({ value: { $bytes: [1, 2] } }),
    );
    expect(() =>
      commandFingerprint({ value: new Date("2026-07-31T00:00:00Z") }),
    ).toThrow("Idempotency payload contains a non-plain object.");
  });

  it("replays a completed result without executing the operation twice", async () => {
    const store = new InMemoryIdempotencyStore();
    let executions = 0;
    const operation = {
      scope: "test:account-001",
      operation: "test.replay",
      key: "replay-key-001",
      fingerprint: fingerprintA,
      retentionSeconds: 60,
    };

    const first = await executeIdempotently(store, operation, async () => {
      executions += 1;
      return { status: "DONE", nested: { value: 1 } };
    });
    first.nested.value = 9;

    const replay = await executeIdempotently(store, operation, async () => {
      executions += 1;
      return { status: "UNEXPECTED", nested: { value: 2 } };
    });

    expect(replay).toEqual({ status: "DONE", nested: { value: 1 } });
    expect(executions).toBe(1);
  });

  it("rejects key reuse when the semantic payload changes", async () => {
    const store = new InMemoryIdempotencyStore();

    await executeIdempotently(
      store,
      {
        scope: "test:account-001",
        operation: "test.conflict",
        key: "conflict-key-001",
        fingerprint: fingerprintA,
        retentionSeconds: 60,
      },
      async () => "first",
    );

    await expect(
      executeIdempotently(
        store,
        {
          scope: "test:account-001",
          operation: "test.conflict",
          key: "conflict-key-001",
          fingerprint: fingerprintB,
          retentionSeconds: 60,
        },
        async () => "second",
      ),
    ).rejects.toBeInstanceOf(IdempotencyConflictError);
  });

  it("never replays a result across idempotency scopes", async () => {
    const store = new InMemoryIdempotencyStore();
    let executions = 0;
    const baseOperation = {
      operation: "test.scope",
      key: "shared-key-001",
      fingerprint: fingerprintA,
      retentionSeconds: 60,
    };

    const first = await executeIdempotently(
      store,
      { ...baseOperation, scope: "account:account-001" },
      async () => {
        executions += 1;
        return "account-001-result";
      },
    );
    const second = await executeIdempotently(
      store,
      { ...baseOperation, scope: "account:account-002" },
      async () => {
        executions += 1;
        return "account-002-result";
      },
    );

    expect(first).toBe("account-001-result");
    expect(second).toBe("account-002-result");
    expect(executions).toBe(2);
  });

  it("fails closed while the first matching operation is still running", async () => {
    const store = new InMemoryIdempotencyStore();
    let finish: ((value: string) => void) | undefined;
    const operation = {
      scope: "test:account-001",
      operation: "test.concurrent",
      key: "concurrent-key-001",
      fingerprint: fingerprintA,
      retentionSeconds: 60,
    };
    const first = executeIdempotently(
      store,
      operation,
      () =>
        new Promise<string>((resolve) => {
          finish = resolve;
        }),
    );

    await expect(
      executeIdempotently(store, operation, async () => "duplicate"),
    ).rejects.toBeInstanceOf(IdempotencyInProgressError);

    expect(finish).toBeTypeOf("function");
    finish?.("completed");
    await expect(first).resolves.toBe("completed");
  });

  it("blocks blind retries after an execution has an uncertain outcome", async () => {
    const store = new InMemoryIdempotencyStore();
    const operation = {
      scope: "test:account-001",
      operation: "test.retry",
      key: "retry-key-001",
      fingerprint: fingerprintA,
      retentionSeconds: 60,
    };
    let attempts = 0;

    await expect(
      executeIdempotently(store, operation, async () => {
        attempts += 1;
        throw new Error("temporary failure");
      }),
    ).rejects.toThrow("temporary failure");

    await expect(
      executeIdempotently(store, operation, async () => {
        attempts += 1;
        return "unsafe retry";
      }),
    ).rejects.toBeInstanceOf(IdempotencyRecoveryRequiredError);
    expect(attempts).toBe(1);
  });

  it("permits a fresh claim after the declared retention expires", async () => {
    let now = 1_000;
    const store = new InMemoryIdempotencyStore(() => now);

    await executeIdempotently(
      store,
      {
        scope: "test:account-001",
        operation: "test.expiry",
        key: "expiry-key-001",
        fingerprint: fingerprintA,
        retentionSeconds: 60,
      },
      async () => "first",
    );

    now += 60_000;

    await expect(
      executeIdempotently(
        store,
        {
          scope: "test:account-001",
          operation: "test.expiry",
          key: "expiry-key-001",
          fingerprint: fingerprintB,
          retentionSeconds: 60,
        },
        async () => "after-expiry",
      ),
    ).resolves.toBe("after-expiry");
  });

  it("starts completed-result retention when completion is recorded", async () => {
    let now = 1_000;
    const store = new InMemoryIdempotencyStore(() => now);
    const baseOperation = {
      scope: "test:account-001",
      operation: "test.completion-expiry",
      key: "completion-expiry-key-001",
      retentionSeconds: 60,
    };

    await executeIdempotently(
      store,
      { ...baseOperation, fingerprint: fingerprintA },
      async () => {
        now += 60_000;
        return "completed-late";
      },
    );

    await expect(
      executeIdempotently(
        store,
        { ...baseOperation, fingerprint: fingerprintB },
        async () => "must-conflict",
      ),
    ).rejects.toBeInstanceOf(IdempotencyConflictError);

    now += 60_000;

    await expect(
      executeIdempotently(
        store,
        { ...baseOperation, fingerprint: fingerprintB },
        async () => "after-completion-expiry",
      ),
    ).resolves.toBe("after-completion-expiry");
  });

  it("rejects unsafe keys before executing a protected action", async () => {
    const store = new InMemoryIdempotencyStore();
    let executed = false;

    await expect(
      executeIdempotently(
        store,
        {
          scope: "test:account-001",
          operation: "test.validation",
          key: "bad key",
          fingerprint: fingerprintA,
          retentionSeconds: 60,
        },
        async () => {
          executed = true;
          return "unsafe";
        },
      ),
    ).rejects.toBeInstanceOf(IdempotencyValidationError);
    expect(executed).toBe(false);
  });

  it("fails closed when the idempotency authority is unavailable", async () => {
    const unavailableStore: IdempotencyStorePort = {
      claim: () => Promise.reject(new Error("idempotency unavailable")),
      complete: () => Promise.resolve(),
      requireRecovery: () => Promise.resolve(),
    };
    let executed = false;

    await expect(
      executeIdempotently(
        unavailableStore,
        {
          scope: "test:account-001",
          operation: "test.unavailable",
          key: "unavailable-key-001",
          fingerprint: fingerprintA,
          retentionSeconds: 60,
        },
        async () => {
          executed = true;
          return "unsafe";
        },
      ),
    ).rejects.toThrow("idempotency unavailable");
    expect(executed).toBe(false);
  });

  it("replays payment initiation, release, and refund submissions", async () => {
    const gateway = new MockPaymentGateway({
      initiationReceipt: {
        submissionStatus: "ACCEPTED_FOR_PROCESSING",
        operationReference: "operation-initiate-001",
        paymentReference: "payment-001",
        expiresAt: "2026-09-20T09:00:00+07:00",
        customerAction: {
          kind: "DISPLAY_QR",
          payload: "configured-qr-payload",
        },
      },
      releaseReceipt: {
        submissionStatus: "ACCEPTED_FOR_PROCESSING",
        operationReference: "operation-release-001",
      },
      refundReceipt: {
        submissionStatus: "UNKNOWN",
        reasonCode: "TIMEOUT",
        operationReference: null,
      },
    });
    const initiation = {
      idempotencyKey: "payment-initiate-001",
      paymentAttemptId: "payment-attempt-001",
      orderId: "order-001",
      amountMinor: 250_000n,
      currency: "IDR" as const,
    };
    const release = {
      idempotencyKey: "payment-release-001",
      orderId: "order-001",
      paymentReference: "payment-001",
      sellerAmountMinor: 230_000n,
      platformAmountMinor: 20_000n,
      currency: "IDR" as const,
    };
    const refund = {
      idempotencyKey: "payment-refund-001",
      orderId: "order-001",
      paymentReference: "payment-001",
      amountMinor: 250_000n,
      currency: "IDR" as const,
    };

    expect(await gateway.initiatePayment(initiation)).toEqual(
      await gateway.initiatePayment(initiation),
    );
    expect(await gateway.requestRelease(release)).toEqual(
      await gateway.requestRelease(release),
    );
    expect(await gateway.requestRefund(refund)).toEqual(
      await gateway.requestRefund(refund),
    );
    expect(gateway.initiations).toHaveLength(1);
    expect(gateway.releaseRequests).toHaveLength(1);
    expect(gateway.refundRequests).toHaveLength(1);
  });

  it("rejects changed payment amounts under a completed key", async () => {
    const gateway = new MockPaymentGateway({
      initiationReceipt: {
        submissionStatus: "REJECTED",
        reasonCode: "PROVIDER_REJECTED",
      },
    });
    const command = {
      idempotencyKey: "payment-conflict-001",
      paymentAttemptId: "payment-attempt-001",
      orderId: "order-001",
      amountMinor: 250_000n,
      currency: "IDR" as const,
    };

    await gateway.initiatePayment(command);

    await expect(
      gateway.initiatePayment({ ...command, amountMinor: 275_000n }),
    ).rejects.toBeInstanceOf(IdempotencyConflictError);
    expect(gateway.initiations).toHaveLength(1);
  });

  it("replays dispatch registration and rejects changed tracking data", async () => {
    const gateway = new MockLogisticsGateway([]);
    const command = {
      idempotencyKey: "dispatch-key-001",
      orderId: "order-001",
      quoteReference: "quote-001",
      trackingNumber: "TRACKING-001",
    };

    const first = await gateway.registerDispatch(command);
    const replay = await gateway.registerDispatch({ ...command });

    expect(replay).toEqual(first);
    expect(gateway.dispatches).toHaveLength(1);
    await expect(
      gateway.registerDispatch({
        ...command,
        trackingNumber: "TRACKING-CHANGED",
      }),
    ).rejects.toBeInstanceOf(IdempotencyConflictError);
  });
});
