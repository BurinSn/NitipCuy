export interface CreateHeldPaymentCommand {
  readonly idempotencyKey: string;
  readonly orderId: string;
  readonly amountMinor: bigint;
  readonly currency: "IDR";
}

export interface HeldPayment {
  readonly paymentReference: string;
  readonly status: "HELD";
}

export interface ReleasePaymentCommand {
  readonly idempotencyKey: string;
  readonly orderId: string;
  readonly paymentReference: string;
  readonly sellerAmountMinor: bigint;
  readonly platformAmountMinor: bigint;
  readonly currency: "IDR";
}

export interface RefundPaymentCommand {
  readonly idempotencyKey: string;
  readonly orderId: string;
  readonly paymentReference: string;
  readonly amountMinor: bigint;
  readonly currency: "IDR";
}

export interface PaymentGatewayPort {
  createHeldPayment(command: CreateHeldPaymentCommand): Promise<HeldPayment>;
  releasePayment(command: ReleasePaymentCommand): Promise<void>;
  refundPayment(command: RefundPaymentCommand): Promise<void>;
}
