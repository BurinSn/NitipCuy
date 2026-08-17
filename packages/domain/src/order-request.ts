import type { AccountId, JastipperProfileId } from "./account";
import { DomainValidationError, type ServiceMode, type TripId } from "./trip";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

declare const orderRequestIdBrand: unique symbol;

export type OrderRequestId = string & {
  readonly [orderRequestIdBrand]: "OrderRequestId";
};

export type OrderRequestStatus = "SUBMITTED";

export interface ShopForMeRequestTerms {
  readonly serviceMode: "SHOP_FOR_ME";
  readonly itemDescription: string;
  readonly quantity: number;
  readonly maximumBudgetIdr: number;
  readonly requestedCapacityGrams: number;
  readonly allowSubstitution: boolean;
  readonly variation?: string;
}

export interface CarryMyItemRequestTerms {
  readonly serviceMode: "CARRY_MY_ITEM";
  readonly itemDescription: string;
  readonly declaredValueIdr: number;
  readonly declaredWeightGrams: number;
  readonly lengthMillimeters: number;
  readonly widthMillimeters: number;
  readonly heightMillimeters: number;
  readonly handlingInstructions?: string;
}

export type OrderRequestTerms = ShopForMeRequestTerms | CarryMyItemRequestTerms;

export interface SubmittedOrderRequest {
  readonly id: OrderRequestId;
  readonly tripId: TripId;
  readonly customerAccountId: AccountId;
  readonly sellerAccountId: AccountId;
  readonly jastipperProfileId: JastipperProfileId;
  readonly status: OrderRequestStatus;
  readonly serviceMode: ServiceMode;
  readonly sourceOfferVersion: number;
  readonly reservedCapacityGrams: number;
  readonly submittedAt: string;
  readonly originLabel: string;
  readonly destinationLabel: string;
  readonly orderOpenAt: string;
  readonly orderCloseAt: string;
  readonly transportDepartureAt: string;
  readonly estimatedArrivalAt: string;
  readonly terms: OrderRequestTerms;
}

export function orderRequestId(value: string): OrderRequestId {
  const normalized = value.trim().toLowerCase();
  if (!uuidPattern.test(normalized)) {
    throw new Error("Order request ID must be a UUID.");
  }
  return normalized as OrderRequestId;
}

export function normalizeOrderRequestTerms(
  input: OrderRequestTerms,
): OrderRequestTerms {
  const itemDescription = boundedText(
    input.itemDescription,
    "Item description",
    3,
    500,
  );

  if (input.serviceMode === "SHOP_FOR_ME") {
    const normalized: ShopForMeRequestTerms = {
      allowSubstitution: requireBoolean(
        input.allowSubstitution,
        "Substitution permission",
      ),
      itemDescription,
      maximumBudgetIdr: boundedInteger(
        input.maximumBudgetIdr,
        "Maximum item budget",
        1,
        2_000_000_000,
      ),
      quantity: boundedInteger(input.quantity, "Quantity", 1, 100),
      requestedCapacityGrams: capacityGrams(input.requestedCapacityGrams),
      serviceMode: "SHOP_FOR_ME",
      ...(input.variation === undefined
        ? {}
        : { variation: boundedText(input.variation, "Variation", 1, 200) }),
    };
    return Object.freeze(normalized);
  }

  const normalized: CarryMyItemRequestTerms = {
    declaredValueIdr: boundedInteger(
      input.declaredValueIdr,
      "Declared value",
      1,
      2_000_000_000,
    ),
    declaredWeightGrams: capacityGrams(input.declaredWeightGrams),
    heightMillimeters: boundedInteger(
      input.heightMillimeters,
      "Height",
      1,
      10_000,
    ),
    itemDescription,
    lengthMillimeters: boundedInteger(
      input.lengthMillimeters,
      "Length",
      1,
      10_000,
    ),
    serviceMode: "CARRY_MY_ITEM",
    widthMillimeters: boundedInteger(
      input.widthMillimeters,
      "Width",
      1,
      10_000,
    ),
    ...(input.handlingInstructions === undefined
      ? {}
      : {
          handlingInstructions: boundedText(
            input.handlingInstructions,
            "Handling instructions",
            1,
            500,
          ),
        }),
  };
  return Object.freeze(normalized);
}

export function requestedCapacityGrams(terms: OrderRequestTerms): number {
  return terms.serviceMode === "SHOP_FOR_ME"
    ? terms.requestedCapacityGrams
    : terms.declaredWeightGrams;
}

function capacityGrams(value: number): number {
  const normalized = boundedInteger(
    value,
    "Requested capacity",
    10,
    100_000_000,
  );
  if (normalized % 10 !== 0) {
    throw new DomainValidationError(
      "Requested capacity must use exact 10-gram increments.",
    );
  }
  return normalized;
}

function boundedInteger(
  value: number,
  field: string,
  minimum: number,
  maximum: number,
): number {
  if (!Number.isSafeInteger(value) || value < minimum || value > maximum) {
    throw new DomainValidationError(
      `${field} must be an integer from ${minimum} to ${maximum}.`,
    );
  }
  return value;
}

function requireBoolean(value: boolean, field: string): boolean {
  if (typeof value !== "boolean") {
    throw new DomainValidationError(`${field} must be a boolean.`);
  }
  return value;
}

function boundedText(
  value: string,
  field: string,
  minimum: number,
  maximum: number,
): string {
  if (typeof value !== "string") {
    throw new DomainValidationError(`${field} must be text.`);
  }
  const normalized = value.trim();
  if (
    normalized.length < minimum ||
    normalized.length > maximum ||
    /[\u0000-\u001f\u007f]/.test(normalized)
  ) {
    throw new DomainValidationError(
      `${field} must contain ${minimum} to ${maximum} characters.`,
    );
  }
  return normalized;
}
