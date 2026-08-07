import { describe, expect, it } from "vitest";

import {
  accountId,
  approveTripOffer,
  createTripOffer,
  jastipperProfileId,
  normalizeDiscussionMessage,
  rejectTripOffer,
  submitTripOffer,
  toPublishedTrip,
  tripId,
} from "./index";

const publicTerms = {
  deliverySummary: "Pickup in central Bandung",
  displayName: "Sari",
  rateSummary: "Rp275.000/kg, minimum 1 kg",
  sellerLocationLabel: "Bandung",
} as const;

function draftInput() {
  return {
    departureAt: "2026-09-20T10:00:00+09:00",
    departureDate: "2026-09-20",
    destinationLabel: "Bandung",
    destinationTimeZone: "Asia/Jakarta",
    estimatedArrivalAt: "2026-09-21T14:00:00+07:00",
    id: tripId("tokyo-bandung-october"),
    jastipperProfileId: jastipperProfileId(
      "22222222-2222-4222-8222-222222222222",
    ),
    originLabel: "Tokyo",
    originTimeZone: "Asia/Tokyo",
    ownerAccountId: accountId("11111111-1111-4111-8111-111111111111"),
    remainingCapacityKg: 4,
    requestDeadline: "2026-09-18T18:00:00+09:00",
    requestOpenAt: "2026-08-25T09:00:00+07:00",
    serviceModes: ["SHOP_FOR_ME", "CARRY_MY_ITEM"] as const,
    serviceWindowEndAt: "2026-09-19T18:00:00+09:00",
    serviceWindowStartAt: "2026-09-10T09:00:00+09:00",
  };
}

describe("persisted marketplace domain", () => {
  it("moves a valid owned trip through submission and publication", () => {
    const draft = createTripOffer(draftInput(), publicTerms);
    const submitted = submitTripOffer(draft);
    const published = approveTripOffer(submitted, "2026-08-30T10:00:00+07:00");
    const projection = toPublishedTrip(published, publicTerms, []);

    expect(draft.status).toBe("DRAFT");
    expect(submitted).toMatchObject({
      status: "PENDING_MODERATION",
      version: 2,
    });
    expect(published).toMatchObject({ status: "PUBLISHED", version: 3 });
    expect(projection).toMatchObject({
      id: tripId("tokyo-bandung-october"),
      jastipperDisplayName: "Sari",
      rateSummary: "Rp275.000/kg, minimum 1 kg",
    });
  });

  it("rejects invalid transitions and preserves the moderation reason", () => {
    const draft = createTripOffer(draftInput(), publicTerms);

    expect(() => approveTripOffer(draft, "2026-08-30T10:00:00+07:00")).toThrow(
      "Cannot approve a trip in DRAFT state.",
    );

    const rejected = rejectTripOffer(
      submitTripOffer(draft),
      "PROHIBITED_ROUTE",
    );

    expect(rejected).toMatchObject({
      moderationReason: "PROHIBITED_ROUTE",
      status: "REJECTED",
      version: 3,
    });
  });

  it("bounds public discussion content", () => {
    expect(normalizeDiscussionMessage("  Apakah bisa beli ukuran XL?  ")).toBe(
      "Apakah bisa beli ukuran XL?",
    );
    expect(() => normalizeDiscussionMessage("no")).toThrow(
      "Public discussion message must contain 5 to 500 characters.",
    );
  });
});
