import { describe, expect, it } from "vitest";

import { assessPaymentProtection, type PaymentProviderSnapshot } from "./index";

function snapshot(
  overrides: Partial<PaymentProviderSnapshot> = {},
): PaymentProviderSnapshot {
  return {
    paymentAttemptId: "payment-attempt-001",
    paymentReference: "payment-001",
    observedAt: "2026-09-20T08:00:00+07:00",
    currency: "IDR",
    collectionStatus: "PENDING",
    holdStatus: "NOT_CONFIRMED",
    releaseStatus: "NOT_REQUESTED",
    refundStatus: "NOT_REQUESTED",
    settlementStatus: "NOT_STARTED",
    chargebackStatus: "NONE",
    collectedAmountMinor: null,
    heldAmountMinor: null,
    refundedAmountMinor: null,
    settledSellerAmountMinor: null,
    settledPlatformAmountMinor: null,
    ...overrides,
  };
}

function expectation(amountMinor = 250_000n) {
  return {
    paymentAttemptId: "payment-attempt-001",
    amountMinor,
  };
}

describe("payment protection reconciliation", () => {
  it("confirms protection only after exact collection and hold reconciliation", () => {
    const result = assessPaymentProtection(
      snapshot({
        collectionStatus: "CONFIRMED",
        holdStatus: "CONFIRMED",
        collectedAmountMinor: 250_000n,
        heldAmountMinor: 250_000n,
      }),
      expectation(),
    );

    expect(result).toEqual({
      status: "HELD_CONFIRMED",
      reasonCode: "COLLECTION_AND_HOLD_RECONCILED",
    });
  });

  it("keeps an accepted customer payment pending while hold is unconfirmed", () => {
    const result = assessPaymentProtection(
      snapshot({
        collectionStatus: "CONFIRMED",
        holdStatus: "PENDING",
        collectedAmountMinor: 250_000n,
      }),
      expectation(),
    );

    expect(result).toEqual({
      status: "AWAITING_CONFIRMATION",
      reasonCode: "HOLD_CONFIRMATION_PENDING",
    });
  });

  it("requires reconciliation when collection and hold contradict", () => {
    const result = assessPaymentProtection(
      snapshot({
        collectionStatus: "PENDING",
        holdStatus: "CONFIRMED",
      }),
      expectation(),
    );

    expect(result).toEqual({
      status: "RECONCILIATION_REQUIRED",
      reasonCode: "CONTRADICTORY_PROVIDER_STATE",
    });
  });

  it("requires reconciliation when the collected amount differs", () => {
    const result = assessPaymentProtection(
      snapshot({
        collectionStatus: "CONFIRMED",
        holdStatus: "CONFIRMED",
        collectedAmountMinor: 249_999n,
      }),
      expectation(),
    );

    expect(result).toEqual({
      status: "RECONCILIATION_REQUIRED",
      reasonCode: "COLLECTED_AMOUNT_MISMATCH",
    });
  });

  it("requires reconciliation when the confirmed held amount differs", () => {
    const result = assessPaymentProtection(
      snapshot({
        collectionStatus: "CONFIRMED",
        holdStatus: "CONFIRMED",
        collectedAmountMinor: 250_000n,
        heldAmountMinor: 200_000n,
      }),
      expectation(),
    );

    expect(result).toEqual({
      status: "RECONCILIATION_REQUIRED",
      reasonCode: "HELD_AMOUNT_MISMATCH",
    });
  });

  it("requires reconciliation when a confirmed hold has no amount evidence", () => {
    const result = assessPaymentProtection(
      snapshot({
        collectionStatus: "CONFIRMED",
        holdStatus: "CONFIRMED",
        collectedAmountMinor: 250_000n,
      }),
      expectation(),
    );

    expect(result).toEqual({
      status: "RECONCILIATION_REQUIRED",
      reasonCode: "HELD_AMOUNT_MISSING",
    });
  });

  it("requires reconciliation when collection succeeds but the hold fails", () => {
    const result = assessPaymentProtection(
      snapshot({
        collectionStatus: "CONFIRMED",
        holdStatus: "FAILED",
        collectedAmountMinor: 250_000n,
      }),
      expectation(),
    );

    expect(result).toEqual({
      status: "RECONCILIATION_REQUIRED",
      reasonCode: "HOLD_FAILED_AFTER_COLLECTION",
    });
  });

  it("requires reconciliation when confirmed money has no provider reference", () => {
    const result = assessPaymentProtection(
      snapshot({
        paymentReference: null,
        collectionStatus: "CONFIRMED",
        holdStatus: "CONFIRMED",
        collectedAmountMinor: 250_000n,
        heldAmountMinor: 250_000n,
      }),
      expectation(),
    );

    expect(result).toEqual({
      status: "RECONCILIATION_REQUIRED",
      reasonCode: "PAYMENT_REFERENCE_MISSING",
    });
  });

  it("requires reconciliation when a terminal collection still reports money", () => {
    const result = assessPaymentProtection(
      snapshot({
        collectionStatus: "FAILED",
        collectedAmountMinor: 250_000n,
      }),
      expectation(),
    );

    expect(result).toEqual({
      status: "RECONCILIATION_REQUIRED",
      reasonCode: "CONTRADICTORY_PROVIDER_STATE",
    });
  });

  it("requires reconciliation for unknown provider state", () => {
    const result = assessPaymentProtection(
      snapshot({
        collectionStatus: "UNKNOWN",
      }),
      expectation(),
    );

    expect(result).toEqual({
      status: "RECONCILIATION_REQUIRED",
      reasonCode: "UNKNOWN_PROVIDER_STATE",
    });
  });

  it("records an expired collection as failed without implying a hold", () => {
    const result = assessPaymentProtection(
      snapshot({
        collectionStatus: "EXPIRED",
      }),
      expectation(),
    );

    expect(result).toEqual({
      status: "FAILED",
      reasonCode: "COLLECTION_EXPIRED",
    });
  });

  it("does not regress a payment after release, refund, or chargeback activity", () => {
    const result = assessPaymentProtection(
      snapshot({
        collectionStatus: "CONFIRMED",
        holdStatus: "CONFIRMED",
        releaseStatus: "PENDING",
        collectedAmountMinor: 250_000n,
        heldAmountMinor: 250_000n,
      }),
      expectation(),
    );

    expect(result).toEqual({
      status: "RECONCILIATION_REQUIRED",
      reasonCode: "POST_HOLD_ACTIVITY_OBSERVED",
    });
  });

  it("detects post-hold money evidence even when its status was not updated", () => {
    const result = assessPaymentProtection(
      snapshot({
        collectionStatus: "CONFIRMED",
        holdStatus: "CONFIRMED",
        collectedAmountMinor: 250_000n,
        heldAmountMinor: 250_000n,
        refundedAmountMinor: 25_000n,
      }),
      expectation(),
    );

    expect(result).toEqual({
      status: "RECONCILIATION_REQUIRED",
      reasonCode: "POST_HOLD_ACTIVITY_OBSERVED",
    });
  });

  it("rejects an invalid expected amount", () => {
    expect(() => assessPaymentProtection(snapshot(), expectation(0n))).toThrow(
      "Expected payment amount must be positive.",
    );
  });

  it("requires reconciliation when the observation belongs to another attempt", () => {
    const result = assessPaymentProtection(
      snapshot({
        collectionStatus: "CONFIRMED",
        holdStatus: "CONFIRMED",
        collectedAmountMinor: 250_000n,
        heldAmountMinor: 250_000n,
      }),
      {
        paymentAttemptId: "payment-attempt-other",
        amountMinor: 250_000n,
      },
    );

    expect(result).toEqual({
      status: "RECONCILIATION_REQUIRED",
      reasonCode: "PAYMENT_ATTEMPT_MISMATCH",
    });
  });
});
