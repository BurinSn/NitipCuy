import type {
  OrderRequestTerms,
  SubmittedOrderRequest,
} from "@nitipcuy/domain";

import {
  optionalString,
  rejectInvalidRequest,
  requireExactFields,
  requiredBoolean,
  requiredInteger,
  requiredString,
} from "./http-security";

const shopFields = new Set([
  "allowSubstitution",
  "itemDescription",
  "maximumBudgetIdr",
  "quantity",
  "requestedCapacityGrams",
  "serviceMode",
  "variation",
]);

const carryFields = new Set([
  "declaredValueIdr",
  "declaredWeightGrams",
  "handlingInstructions",
  "heightMillimeters",
  "itemDescription",
  "lengthMillimeters",
  "serviceMode",
  "widthMillimeters",
]);

export function parseOrderRequestTerms(
  input: Readonly<Record<string, unknown>>,
): OrderRequestTerms {
  const serviceMode = requiredString(input, "serviceMode");
  if (serviceMode === "SHOP_FOR_ME") {
    requireExactFields(input, shopFields);
    const variation = optionalString(input, "variation");
    return {
      allowSubstitution: requiredBoolean(input, "allowSubstitution"),
      itemDescription: requiredString(input, "itemDescription"),
      maximumBudgetIdr: requiredInteger(input, "maximumBudgetIdr"),
      quantity: requiredInteger(input, "quantity"),
      requestedCapacityGrams: requiredInteger(input, "requestedCapacityGrams"),
      serviceMode,
      ...(variation === undefined ? {} : { variation }),
    };
  }
  if (serviceMode === "CARRY_MY_ITEM") {
    requireExactFields(input, carryFields);
    const handlingInstructions = optionalString(input, "handlingInstructions");
    return {
      declaredValueIdr: requiredInteger(input, "declaredValueIdr"),
      declaredWeightGrams: requiredInteger(input, "declaredWeightGrams"),
      heightMillimeters: requiredInteger(input, "heightMillimeters"),
      itemDescription: requiredString(input, "itemDescription"),
      lengthMillimeters: requiredInteger(input, "lengthMillimeters"),
      serviceMode,
      widthMillimeters: requiredInteger(input, "widthMillimeters"),
      ...(handlingInstructions === undefined ? {} : { handlingInstructions }),
    };
  }
  return rejectInvalidRequest();
}

export function safeOrderSubmissionProjection(
  submitted: SubmittedOrderRequest,
) {
  return Object.freeze({
    id: submitted.id,
    reservedCapacityGrams: submitted.reservedCapacityGrams,
    serviceMode: submitted.serviceMode,
    sourceOfferVersion: submitted.sourceOfferVersion,
    status: submitted.status,
    submittedAt: submitted.submittedAt,
    tripId: submitted.tripId,
  });
}
