import type {
  DispatchRegistration,
  LogisticsGatewayPort,
  LogisticsQuote,
  LogisticsQuoteRequest,
  RegisterDispatchCommand,
} from "@nitipcuy/application";

export class MockLogisticsGateway implements LogisticsGatewayPort {
  readonly quoteRequests: LogisticsQuoteRequest[] = [];
  readonly dispatches: RegisterDispatchCommand[] = [];

  constructor(private readonly quotes: readonly LogisticsQuote[]) {}

  quote(request: LogisticsQuoteRequest): Promise<readonly LogisticsQuote[]> {
    this.quoteRequests.push(request);
    return Promise.resolve(this.quotes);
  }

  registerDispatch(
    command: RegisterDispatchCommand,
  ): Promise<DispatchRegistration> {
    this.dispatches.push(command);

    return Promise.resolve({
      dispatchReference: `mock-dispatch-${command.orderId}`,
      status: "REGISTERED",
    });
  }
}
