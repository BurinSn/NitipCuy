import { describe, expect, it } from "vitest";

import {
  DomainValidationError,
  createPublishedTrip,
  tripId,
  type PublishedTrip,
} from "./index";

function validTrip(overrides: Partial<PublishedTrip> = {}): PublishedTrip {
  return {
    id: tripId("trip-jakarta-001"),
    jastipperDisplayName: "Rani",
    originLabel: "Guangzhou",
    destinationLabel: "Jakarta",
    departureDate: "2026-08-20",
    departureAt: "2026-08-20T10:00:00+08:00",
    requestDeadline: "2026-08-18T18:00:00+08:00",
    estimatedArrivalAt: "2026-08-21T16:00:00+07:00",
    serviceModes: ["SHOP_FOR_ME", "CARRY_MY_ITEM"],
    remainingCapacityKg: 12,
    sellerLocationLabel: "Jakarta Selatan",
    deliverySummary: "Pickup or domestic courier after arrival",
    rateSummary: "Seller-defined rate shown before commitment",
    rating: { average: 4.9, count: 23 },
    publicQuestions: [],
    ...overrides,
  };
}

describe("createPublishedTrip", () => {
  it("keeps public questions in chronological order", () => {
    const trip = createPublishedTrip(
      validTrip({
        publicQuestions: [
          {
            id: "question-2",
            authorDisplayName: "Dina",
            message: "Can you visit a specific store?",
            createdAt: "2026-08-11T11:00:00+07:00",
          },
          {
            id: "question-1",
            authorDisplayName: "Bayu",
            message: "Is cosmetic packaging accepted?",
            createdAt: "2026-08-10T09:00:00+07:00",
          },
        ],
      }),
    );

    expect(trip.publicQuestions.map(({ id }) => id)).toEqual([
      "question-1",
      "question-2",
    ]);
  });

  it("rejects a request deadline on or after departure", () => {
    expect(() =>
      createPublishedTrip(
        validTrip({
          requestDeadline: "2026-08-20T02:00:00Z",
        }),
      ),
    ).toThrow(DomainValidationError);
  });

  it("rejects a local departure date that disagrees with its timestamp", () => {
    expect(() =>
      createPublishedTrip(
        validTrip({
          departureDate: "2026-08-21",
        }),
      ),
    ).toThrow(
      "Departure date must match the local date in the departure timestamp.",
    );
  });

  it("compares question and answer timestamps as instants across offsets", () => {
    expect(() =>
      createPublishedTrip(
        validTrip({
          publicQuestions: [
            {
              id: "question-timezone",
              authorDisplayName: "Dina",
              message: "Can you bring this?",
              createdAt: "2026-08-10T09:00:00+07:00",
              answer: {
                authorDisplayName: "Rani",
                message: "I will check it.",
                createdAt: "2026-08-10T09:30:00+08:00",
              },
            },
          ],
        }),
      ),
    ).toThrow("A public answer cannot predate its question.");
  });

  it("rejects identical origins and destinations", () => {
    expect(() =>
      createPublishedTrip(
        validTrip({
          originLabel: "Jakarta",
          destinationLabel: " jakarta ",
        }),
      ),
    ).toThrow("Trip origin and destination must be different.");
  });
});
