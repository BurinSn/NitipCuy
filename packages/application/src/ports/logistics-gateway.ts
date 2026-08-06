export interface LogisticsQuoteRequest {
  readonly originPostalCode: string;
  readonly destinationPostalCode: string;
  readonly weightGrams: number;
}

export interface LogisticsQuote {
  readonly quoteReference: string;
  readonly serviceCode: string;
  readonly serviceName: string;
  readonly amountMinor: bigint;
  readonly currency: "IDR";
  readonly expiresAt: string;
}

export interface RegisterDispatchCommand {
  readonly idempotencyKey: string;
  readonly orderId: string;
  readonly quoteReference: string;
  readonly trackingNumber: string;
}

export interface DispatchRegistration {
  readonly dispatchReference: string;
  readonly status: "REGISTERED";
}

export interface LogisticsGatewayPort {
  quote(request: LogisticsQuoteRequest): Promise<readonly LogisticsQuote[]>;
  registerDispatch(
    command: RegisterDispatchCommand,
  ): Promise<DispatchRegistration>;
}
