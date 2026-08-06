export interface InitiatePaymentCommand {
  readonly idempotencyKey: string;
  readonly paymentAttemptId: string;
  readonly orderId: string;
  readonly amountMinor: bigint;
  readonly currency: "IDR";
}

export interface RequestPaymentReleaseCommand {
  readonly idempotencyKey: string;
  readonly orderId: string;
  readonly paymentReference: string;
  readonly sellerAmountMinor: bigint;
  readonly platformAmountMinor: bigint;
  readonly currency: "IDR";
}

export interface RequestPaymentRefundCommand {
  readonly idempotencyKey: string;
  readonly orderId: string;
  readonly paymentReference: string;
  readonly amountMinor: bigint;
  readonly currency: "IDR";
}

export interface InspectPaymentQuery {
  readonly orderId: string;
  readonly paymentAttemptId: string;
  readonly paymentReference: string | null;
}

export interface AcceptedPaymentSubmission {
  readonly submissionStatus: "ACCEPTED_FOR_PROCESSING";
  readonly operationReference: string;
}

export interface RejectedPaymentSubmission {
  readonly submissionStatus: "REJECTED";
  readonly reasonCode:
    "INVALID_REQUEST" | "UNSUPPORTED_OPERATION" | "PROVIDER_REJECTED";
}

export interface UnknownPaymentSubmission {
  readonly submissionStatus: "UNKNOWN";
  readonly reasonCode:
    "TIMEOUT" | "AMBIGUOUS_RESPONSE" | "UNMAPPED_PROVIDER_RESPONSE";
  readonly operationReference: string | null;
}

export type PaymentOperationReceipt =
  | AcceptedPaymentSubmission
  | RejectedPaymentSubmission
  | UnknownPaymentSubmission;

export type PaymentCustomerAction =
  | {
      readonly kind: "REDIRECT";
      readonly url: string;
    }
  | {
      readonly kind: "DISPLAY_QR";
      readonly payload: string;
    }
  | {
      readonly kind: "DISPLAY_VIRTUAL_ACCOUNT";
      readonly bankCode: string;
      readonly accountNumber: string;
    };

export type PaymentInitiationReceipt =
  | (AcceptedPaymentSubmission & {
      readonly paymentReference: string;
      readonly expiresAt: string;
      readonly customerAction: PaymentCustomerAction;
    })
  | RejectedPaymentSubmission
  | UnknownPaymentSubmission;

export type PaymentCollectionObservation =
  "PENDING" | "CONFIRMED" | "FAILED" | "EXPIRED" | "UNKNOWN";

export type PaymentHoldObservation =
  "NOT_CONFIRMED" | "PENDING" | "CONFIRMED" | "FAILED" | "UNKNOWN";

export type PaymentReleaseObservation =
  "NOT_REQUESTED" | "PENDING" | "CONFIRMED" | "FAILED" | "UNKNOWN";

export type PaymentRefundObservation =
  | "NOT_REQUESTED"
  | "PENDING"
  | "PARTIALLY_CONFIRMED"
  | "CONFIRMED"
  | "FAILED"
  | "UNKNOWN";

export type PaymentSettlementObservation =
  "NOT_STARTED" | "PENDING" | "CONFIRMED" | "FAILED" | "UNKNOWN";

export type PaymentChargebackObservation =
  | "NONE"
  | "OPEN"
  | "RESOLVED_FOR_CUSTOMER"
  | "RESOLVED_FOR_MARKETPLACE"
  | "UNKNOWN";

export interface PaymentProviderSnapshot {
  readonly paymentAttemptId: string;
  readonly paymentReference: string | null;
  readonly observedAt: string;
  readonly currency: "IDR";
  readonly collectionStatus: PaymentCollectionObservation;
  readonly holdStatus: PaymentHoldObservation;
  readonly releaseStatus: PaymentReleaseObservation;
  readonly refundStatus: PaymentRefundObservation;
  readonly settlementStatus: PaymentSettlementObservation;
  readonly chargebackStatus: PaymentChargebackObservation;
  readonly collectedAmountMinor: bigint | null;
  readonly heldAmountMinor: bigint | null;
  readonly refundedAmountMinor: bigint | null;
  readonly settledSellerAmountMinor: bigint | null;
  readonly settledPlatformAmountMinor: bigint | null;
}

export interface PaymentProviderSignal {
  readonly provider: string;
  readonly providerEventReference: string;
  readonly paymentAttemptId: string;
  readonly paymentReference: string | null;
  readonly kind:
    | "COLLECTION_STATUS_CHANGED"
    | "HOLD_STATUS_CHANGED"
    | "RELEASE_STATUS_CHANGED"
    | "REFUND_STATUS_CHANGED"
    | "SETTLEMENT_STATUS_CHANGED"
    | "CHARGEBACK_STATUS_CHANGED";
  readonly occurredAt: string;
}

export interface PaymentGatewayPort {
  initiatePayment(
    command: InitiatePaymentCommand,
  ): Promise<PaymentInitiationReceipt>;
  requestRelease(
    command: RequestPaymentReleaseCommand,
  ): Promise<PaymentOperationReceipt>;
  requestRefund(
    command: RequestPaymentRefundCommand,
  ): Promise<PaymentOperationReceipt>;
  inspectPayment(query: InspectPaymentQuery): Promise<PaymentProviderSnapshot>;
}
