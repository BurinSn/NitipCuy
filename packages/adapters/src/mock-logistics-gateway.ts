import type {
  DispatchRegistration,
  IdempotencyStorePort,
  LogisticsGatewayPort,
  LogisticsQuote,
  LogisticsQuoteRequest,
  RegisterDispatchCommand,
} from "@nitipcuy/application";
import { executeIdempotently } from "@nitipcuy/application";

import {
  commandFingerprint,
  InMemoryIdempotencyStore,
} from "./idempotency-support";

const LOGISTICS_IDEMPOTENCY_RETENTION_SECONDS = 30 * 24 * 60 * 60;

export class MockLogisticsGateway implements LogisticsGatewayPort {
  readonly quoteRequests: LogisticsQuoteRequest[] = [];
  readonly dispatches: RegisterDispatchCommand[] = [];

  constructor(
    private readonly quotes: readonly LogisticsQuote[],
    private readonly idempotencyStore: IdempotencyStorePort = new InMemoryIdempotencyStore(),
  ) {}

  quote(request: LogisticsQuoteRequest): Promise<readonly LogisticsQuote[]> {
    this.quoteRequests.push(request);
    return Promise.resolve(this.quotes);
  }

  registerDispatch(
    command: RegisterDispatchCommand,
  ): Promise<DispatchRegistration> {
    return executeIdempotently(
      this.idempotencyStore,
      {
        scope: `order:${command.orderId}`,
        operation: "logistics.register-dispatch",
        key: command.idempotencyKey,
        fingerprint: commandFingerprint({
          orderId: command.orderId,
          quoteReference: command.quoteReference,
          trackingNumber: command.trackingNumber,
        }),
        retentionSeconds: LOGISTICS_IDEMPOTENCY_RETENTION_SECONDS,
      },
      () => {
        this.dispatches.push(Object.freeze({ ...command }));

        return Promise.resolve(
          Object.freeze({
            dispatchReference: `mock-dispatch-${command.orderId}`,
            status: "REGISTERED" as const,
          }),
        );
      },
    );
  }
}
