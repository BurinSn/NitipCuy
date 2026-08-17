import { describe, expect, it } from "vitest";

import {
  DomainValidationError,
  normalizeOrderRequestTerms,
  orderRequestId,
  requestedCapacityGrams,
} from "./index";

describe("order request terms", () => {
  it("normalizes bounded Shop for me terms without floating capacity", () => {
    const terms = normalizeOrderRequestTerms({
      allowSubstitution: false,
      itemDescription: "  Matcha gift set  ",
      maximumBudgetIdr: 750_000,
      quantity: 2,
      requestedCapacityGrams: 1_250,
      serviceMode: "SHOP_FOR_ME",
      variation: " Green package ",
    });

    expect(terms).toEqual({
      allowSubstitution: false,
      itemDescription: "Matcha gift set",
      maximumBudgetIdr: 750_000,
      quantity: 2,
      requestedCapacityGrams: 1_250,
      serviceMode: "SHOP_FOR_ME",
      variation: "Green package",
    });
    expect(requestedCapacityGrams(terms)).toBe(1_250);
    expect(Object.isFrozen(terms)).toBe(true);
  });

  it("uses declared Carry my item weight as the reservation", () => {
    const terms = normalizeOrderRequestTerms({
      declaredValueIdr: 2_500_000,
      declaredWeightGrams: 3_750,
      handlingInstructions: " Keep upright ",
      heightMillimeters: 300,
      itemDescription: "Camera tripod",
      lengthMillimeters: 700,
      serviceMode: "CARRY_MY_ITEM",
      widthMillimeters: 200,
    });

    expect(requestedCapacityGrams(terms)).toBe(3_750);
    expect(terms).toMatchObject({
      handlingInstructions: "Keep upright",
      serviceMode: "CARRY_MY_ITEM",
    });
  });

  it.each([
    { field: "zero quantity", value: { quantity: 0 } },
    { field: "fractional quantity", value: { quantity: 1.5 } },
    {
      field: "fractional capacity unit",
      value: { requestedCapacityGrams: 1_255 },
    },
    { field: "negative budget", value: { maximumBudgetIdr: -1 } },
    {
      field: "control-character text",
      value: { itemDescription: "Matcha\ngift set" },
    },
  ])("rejects $field", ({ value }) => {
    expect(() =>
      normalizeOrderRequestTerms({
        allowSubstitution: true,
        itemDescription: "Matcha gift set",
        maximumBudgetIdr: 750_000,
        quantity: 2,
        requestedCapacityGrams: 1_250,
        serviceMode: "SHOP_FOR_ME",
        ...value,
      }),
    ).toThrow(DomainValidationError);
  });

  it("brands only UUID request identities", () => {
    expect(orderRequestId("00000000-0000-4000-8000-000000000001")).toBe(
      "00000000-0000-4000-8000-000000000001",
    );
    expect(() => orderRequestId("request-from-client")).toThrow(/UUID/);
  });
});
