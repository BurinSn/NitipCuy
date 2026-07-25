import type {
  CreateHeldPaymentCommand,
  HeldPayment,
  PaymentGatewayPort,
  RefundPaymentCommand,
  ReleasePaymentCommand,
} from "@nitipcuy/application";

export class MockPaymentGateway implements PaymentGatewayPort {
  readonly heldPayments: CreateHeldPaymentCommand[] = [];
  readonly releases: ReleasePaymentCommand[] = [];
  readonly refunds: RefundPaymentCommand[] = [];

  createHeldPayment(command: CreateHeldPaymentCommand): Promise<HeldPayment> {
    this.heldPayments.push(command);

    return Promise.resolve({
      paymentReference: `mock-payment-${command.orderId}`,
      status: "HELD",
    });
  }

  releasePayment(command: ReleasePaymentCommand): Promise<void> {
    this.releases.push(command);
    return Promise.resolve();
  }

  refundPayment(command: RefundPaymentCommand): Promise<void> {
    this.refunds.push(command);
    return Promise.resolve();
  }
}
