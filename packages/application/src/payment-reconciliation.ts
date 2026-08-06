import type { PaymentProviderSnapshot } from "./ports/payment-gateway";

export interface PaymentProtectionExpectation {
  readonly paymentAttemptId: string;
  readonly amountMinor: bigint;
}

export type PaymentProtectionAssessment =
  | {
      readonly status: "AWAITING_CONFIRMATION";
      readonly reasonCode: "COLLECTION_PENDING" | "HOLD_CONFIRMATION_PENDING";
    }
  | {
      readonly status: "HELD_CONFIRMED";
      readonly reasonCode: "COLLECTION_AND_HOLD_RECONCILED";
    }
  | {
      readonly status: "FAILED";
      readonly reasonCode: "COLLECTION_FAILED" | "COLLECTION_EXPIRED";
    }
  | {
      readonly status: "RECONCILIATION_REQUIRED";
      readonly reasonCode:
        | "UNKNOWN_PROVIDER_STATE"
        | "PAYMENT_ATTEMPT_MISMATCH"
        | "PAYMENT_REFERENCE_MISSING"
        | "CONTRADICTORY_PROVIDER_STATE"
        | "COLLECTED_AMOUNT_MISSING"
        | "COLLECTED_AMOUNT_MISMATCH"
        | "HELD_AMOUNT_MISSING"
        | "HELD_AMOUNT_MISMATCH"
        | "HOLD_FAILED_AFTER_COLLECTION"
        | "POST_HOLD_ACTIVITY_OBSERVED";
    };

export function assessPaymentProtection(
  snapshot: PaymentProviderSnapshot,
  expectation: PaymentProtectionExpectation,
): PaymentProtectionAssessment {
  if (expectation.paymentAttemptId.trim().length === 0) {
    throw new Error("Expected payment attempt id must be non-empty.");
  }

  if (expectation.amountMinor <= 0n) {
    throw new Error("Expected payment amount must be positive.");
  }

  if (snapshot.paymentAttemptId !== expectation.paymentAttemptId) {
    return reconciliationRequired("PAYMENT_ATTEMPT_MISMATCH");
  }

  if (
    snapshot.collectionStatus === "UNKNOWN" ||
    snapshot.holdStatus === "UNKNOWN" ||
    snapshot.releaseStatus === "UNKNOWN" ||
    snapshot.refundStatus === "UNKNOWN" ||
    snapshot.settlementStatus === "UNKNOWN" ||
    snapshot.chargebackStatus === "UNKNOWN"
  ) {
    return reconciliationRequired("UNKNOWN_PROVIDER_STATE");
  }

  if (
    snapshot.releaseStatus !== "NOT_REQUESTED" ||
    snapshot.refundStatus !== "NOT_REQUESTED" ||
    snapshot.settlementStatus !== "NOT_STARTED" ||
    snapshot.chargebackStatus !== "NONE" ||
    snapshot.refundedAmountMinor !== null ||
    snapshot.settledSellerAmountMinor !== null ||
    snapshot.settledPlatformAmountMinor !== null
  ) {
    return reconciliationRequired("POST_HOLD_ACTIVITY_OBSERVED");
  }

  if (
    snapshot.holdStatus === "CONFIRMED" &&
    snapshot.collectionStatus !== "CONFIRMED"
  ) {
    return reconciliationRequired("CONTRADICTORY_PROVIDER_STATE");
  }

  if (snapshot.collectionStatus === "FAILED") {
    if (
      snapshot.collectedAmountMinor !== null ||
      snapshot.heldAmountMinor !== null
    ) {
      return reconciliationRequired("CONTRADICTORY_PROVIDER_STATE");
    }

    return {
      status: "FAILED",
      reasonCode: "COLLECTION_FAILED",
    };
  }

  if (snapshot.collectionStatus === "EXPIRED") {
    if (
      snapshot.collectedAmountMinor !== null ||
      snapshot.heldAmountMinor !== null
    ) {
      return reconciliationRequired("CONTRADICTORY_PROVIDER_STATE");
    }

    return {
      status: "FAILED",
      reasonCode: "COLLECTION_EXPIRED",
    };
  }

  if (snapshot.holdStatus === "FAILED") {
    if (snapshot.collectionStatus !== "CONFIRMED") {
      return reconciliationRequired("CONTRADICTORY_PROVIDER_STATE");
    }
  }

  if (snapshot.collectionStatus === "PENDING") {
    return {
      status: "AWAITING_CONFIRMATION",
      reasonCode: "COLLECTION_PENDING",
    };
  }

  if (
    snapshot.paymentReference === null ||
    snapshot.paymentReference.trim().length === 0
  ) {
    return reconciliationRequired("PAYMENT_REFERENCE_MISSING");
  }

  if (snapshot.collectedAmountMinor === null) {
    return reconciliationRequired("COLLECTED_AMOUNT_MISSING");
  }

  if (snapshot.collectedAmountMinor !== expectation.amountMinor) {
    return reconciliationRequired("COLLECTED_AMOUNT_MISMATCH");
  }

  if (snapshot.holdStatus === "FAILED") {
    return reconciliationRequired("HOLD_FAILED_AFTER_COLLECTION");
  }

  if (
    snapshot.holdStatus === "PENDING" ||
    snapshot.holdStatus === "NOT_CONFIRMED"
  ) {
    return {
      status: "AWAITING_CONFIRMATION",
      reasonCode: "HOLD_CONFIRMATION_PENDING",
    };
  }

  if (snapshot.heldAmountMinor === null) {
    return reconciliationRequired("HELD_AMOUNT_MISSING");
  }

  if (snapshot.heldAmountMinor !== expectation.amountMinor) {
    return reconciliationRequired("HELD_AMOUNT_MISMATCH");
  }

  return {
    status: "HELD_CONFIRMED",
    reasonCode: "COLLECTION_AND_HOLD_RECONCILED",
  };
}

function reconciliationRequired(
  reasonCode: Extract<
    PaymentProtectionAssessment,
    { status: "RECONCILIATION_REQUIRED" }
  >["reasonCode"],
): PaymentProtectionAssessment {
  return {
    status: "RECONCILIATION_REQUIRED",
    reasonCode,
  };
}
