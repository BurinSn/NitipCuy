import type {
  IdempotencyStorePort,
  InitiatePaymentCommand,
  InspectPaymentQuery,
  PaymentGatewayPort,
  PaymentInitiationReceipt,
  PaymentOperationReceipt,
  PaymentProviderSnapshot,
  RequestPaymentRefundCommand,
  RequestPaymentReleaseCommand,
} from "@nitipcuy/application";
import { executeIdempotently } from "@nitipcuy/application";

import {
  commandFingerprint,
  InMemoryIdempotencyStore,
} from "./idempotency-support";

const PAYMENT_IDEMPOTENCY_RETENTION_SECONDS = 90 * 24 * 60 * 60;

export interface MockPaymentGatewayConfig {
  readonly initiationReceipt?: PaymentInitiationReceipt;
  readonly releaseReceipt?: PaymentOperationReceipt;
  readonly refundReceipt?: PaymentOperationReceipt;
  readonly snapshot?: PaymentProviderSnapshot;
}

export class MockPaymentGateway implements PaymentGatewayPort {
  readonly initiations: InitiatePaymentCommand[] = [];
  readonly releaseRequests: RequestPaymentReleaseCommand[] = [];
  readonly refundRequests: RequestPaymentRefundCommand[] = [];
  readonly inspections: InspectPaymentQuery[] = [];

  constructor(
    private readonly config: MockPaymentGatewayConfig = {},
    private readonly idempotencyStore: IdempotencyStorePort = new InMemoryIdempotencyStore(),
  ) {}

  initiatePayment(
    command: InitiatePaymentCommand,
  ): Promise<PaymentInitiationReceipt> {
    if (!this.config.initiationReceipt) {
      return configuredInitiationResponse(undefined, "payment initiation");
    }

    return executeIdempotently(
      this.idempotencyStore,
      {
        scope: `order:${command.orderId}`,
        operation: "payment.initiate",
        key: command.idempotencyKey,
        fingerprint: commandFingerprint({
          paymentAttemptId: command.paymentAttemptId,
          orderId: command.orderId,
          amountMinor: command.amountMinor,
          currency: command.currency,
        }),
        retentionSeconds: PAYMENT_IDEMPOTENCY_RETENTION_SECONDS,
      },
      () => {
        this.initiations.push(Object.freeze({ ...command }));
        return configuredInitiationResponse(
          this.config.initiationReceipt,
          "payment initiation",
        );
      },
    );
  }

  requestRelease(
    command: RequestPaymentReleaseCommand,
  ): Promise<PaymentOperationReceipt> {
    if (!this.config.releaseReceipt) {
      return configuredResponse<PaymentOperationReceipt>(
        undefined,
        "payment release",
      );
    }

    return executeIdempotently(
      this.idempotencyStore,
      {
        scope: `order:${command.orderId}`,
        operation: "payment.release",
        key: command.idempotencyKey,
        fingerprint: commandFingerprint({
          orderId: command.orderId,
          paymentReference: command.paymentReference,
          sellerAmountMinor: command.sellerAmountMinor,
          platformAmountMinor: command.platformAmountMinor,
          currency: command.currency,
        }),
        retentionSeconds: PAYMENT_IDEMPOTENCY_RETENTION_SECONDS,
      },
      () => {
        this.releaseRequests.push(Object.freeze({ ...command }));
        return configuredResponse(
          this.config.releaseReceipt,
          "payment release",
        );
      },
    );
  }

  requestRefund(
    command: RequestPaymentRefundCommand,
  ): Promise<PaymentOperationReceipt> {
    if (!this.config.refundReceipt) {
      return configuredResponse<PaymentOperationReceipt>(
        undefined,
        "payment refund",
      );
    }

    return executeIdempotently(
      this.idempotencyStore,
      {
        scope: `order:${command.orderId}`,
        operation: "payment.refund",
        key: command.idempotencyKey,
        fingerprint: commandFingerprint({
          orderId: command.orderId,
          paymentReference: command.paymentReference,
          amountMinor: command.amountMinor,
          currency: command.currency,
        }),
        retentionSeconds: PAYMENT_IDEMPOTENCY_RETENTION_SECONDS,
      },
      () => {
        this.refundRequests.push(Object.freeze({ ...command }));
        return configuredResponse(this.config.refundReceipt, "payment refund");
      },
    );
  }

  inspectPayment(query: InspectPaymentQuery): Promise<PaymentProviderSnapshot> {
    this.inspections.push(Object.freeze({ ...query }));
    return configuredResponse(this.config.snapshot, "payment inspection");
  }
}

function configuredResponse<Response extends object>(
  response: Response | undefined,
  operation: string,
): Promise<Response> {
  if (!response) {
    return Promise.reject(
      new Error(`Mock ${operation} response must be configured.`),
    );
  }

  return Promise.resolve(Object.freeze({ ...response }));
}

function configuredInitiationResponse(
  response: PaymentInitiationReceipt | undefined,
  operation: string,
): Promise<PaymentInitiationReceipt> {
  if (!response) {
    return Promise.reject(
      new Error(`Mock ${operation} response must be configured.`),
    );
  }

  if (response.submissionStatus !== "ACCEPTED_FOR_PROCESSING") {
    return Promise.resolve(Object.freeze({ ...response }));
  }

  return Promise.resolve(
    Object.freeze({
      ...response,
      customerAction: Object.freeze({ ...response.customerAction }),
    }),
  );
}
