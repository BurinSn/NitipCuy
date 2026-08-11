import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  accountId,
  jastipperProfileId,
  orderRequestId,
  tripId,
} from "@nitipcuy/domain";

import {
  parseOrderRequestTerms,
  safeOrderSubmissionProjection,
} from "./order-submission-input";

describe("order submission HTTP contract", () => {
  it("parses only the exact Shop for me field set", () => {
    expect(
      parseOrderRequestTerms({
        allowSubstitution: false,
        itemDescription: "Matcha gift set",
        maximumBudgetIdr: 750_000,
        quantity: 2,
        requestedCapacityGrams: 1_250,
        serviceMode: "SHOP_FOR_ME",
        variation: "Green package",
      }),
    ).toEqual({
      allowSubstitution: false,
      itemDescription: "Matcha gift set",
      maximumBudgetIdr: 750_000,
      quantity: 2,
      requestedCapacityGrams: 1_250,
      serviceMode: "SHOP_FOR_ME",
      variation: "Green package",
    });
  });

  it("parses only the exact Carry my item field set", () => {
    expect(
      parseOrderRequestTerms({
        declaredValueIdr: 2_500_000,
        declaredWeightGrams: 2_500,
        handlingInstructions: "Keep upright",
        heightMillimeters: 300,
        itemDescription: "Camera tripod",
        lengthMillimeters: 700,
        serviceMode: "CARRY_MY_ITEM",
        widthMillimeters: 200,
      }),
    ).toMatchObject({
      declaredWeightGrams: 2_500,
      serviceMode: "CARRY_MY_ITEM",
    });
  });

  it.each([
    {
      label: "unknown field",
      value: {
        allowSubstitution: false,
        clientClaimedCapacity: 999,
        itemDescription: "Matcha gift set",
        maximumBudgetIdr: 750_000,
        quantity: 2,
        requestedCapacityGrams: 1_250,
        serviceMode: "SHOP_FOR_ME",
      },
    },
    {
      label: "cross-mode field",
      value: {
        declaredValueIdr: 2_500_000,
        itemDescription: "Matcha gift set",
        maximumBudgetIdr: 750_000,
        quantity: 2,
        requestedCapacityGrams: 1_250,
        serviceMode: "SHOP_FOR_ME",
      },
    },
    {
      label: "fractional integer",
      value: {
        allowSubstitution: false,
        itemDescription: "Matcha gift set",
        maximumBudgetIdr: 750_000,
        quantity: 1.5,
        requestedCapacityGrams: 1_250,
        serviceMode: "SHOP_FOR_ME",
      },
    },
    { label: "unknown service mode", value: { serviceMode: "DELIVER" } },
  ])("rejects $label", ({ value }) => {
    expect(() => parseOrderRequestTerms(value)).toThrow("REQUEST_INVALID");
  });

  it("returns a safe projection without private request or party fields", () => {
    const projection = safeOrderSubmissionProjection({
      customerAccountId: accountId("00000000-0000-4000-8000-000000000001"),
      destinationLabel: "Bandung",
      estimatedArrivalAt: "2026-09-21T07:00:00.000Z",
      id: orderRequestId("00000000-0000-4000-8000-000000000002"),
      jastipperProfileId: jastipperProfileId(
        "00000000-0000-4000-8000-000000000003",
      ),
      orderCloseAt: "2026-09-18T09:00:00.000Z",
      orderOpenAt: "2026-08-25T00:00:00.000Z",
      originLabel: "Tokyo",
      reservedCapacityGrams: 1_250,
      sellerAccountId: accountId("00000000-0000-4000-8000-000000000004"),
      serviceMode: "SHOP_FOR_ME",
      sourceOfferVersion: 3,
      status: "SUBMITTED",
      submittedAt: "2026-09-01T00:00:00.000Z",
      terms: {
        allowSubstitution: false,
        itemDescription: "Private item description",
        maximumBudgetIdr: 750_000,
        quantity: 2,
        requestedCapacityGrams: 1_250,
        serviceMode: "SHOP_FOR_ME",
      },
      transportDepartureAt: "2026-09-20T01:00:00.000Z",
      tripId: tripId("trip-order-http"),
    });
    const serialized = JSON.stringify(projection);

    expect(projection).toMatchObject({
      reservedCapacityGrams: 1_250,
      status: "SUBMITTED",
    });
    expect(serialized).not.toContain("Private item description");
    expect(serialized).not.toContain("customerAccountId");
    expect(serialized).not.toContain("sellerAccountId");
    expect(serialized).not.toContain("maximumBudgetIdr");
  });
});
