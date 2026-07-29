import type {
  InitiatePaymentCommand,
  InspectPaymentQuery,
  PaymentGatewayPort,
  PaymentInitiationReceipt,
  PaymentOperationReceipt,
  PaymentProviderSnapshot,
  RequestPaymentRefundCommand,
  RequestPaymentReleaseCommand,
} from "@nitipcuy/application";

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

  constructor(private readonly config: MockPaymentGatewayConfig = {}) {}

  initiatePayment(
    command: InitiatePaymentCommand,
  ): Promise<PaymentInitiationReceipt> {
    this.initiations.push(Object.freeze({ ...command }));
    return configuredInitiationResponse(
      this.config.initiationReceipt,
      "payment initiation",
    );
  }

  requestRelease(
    command: RequestPaymentReleaseCommand,
  ): Promise<PaymentOperationReceipt> {
    this.releaseRequests.push(Object.freeze({ ...command }));
    return configuredResponse(this.config.releaseReceipt, "payment release");
  }

  requestRefund(
    command: RequestPaymentRefundCommand,
  ): Promise<PaymentOperationReceipt> {
    this.refundRequests.push(Object.freeze({ ...command }));
    return configuredResponse(this.config.refundReceipt, "payment refund");
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
