import { describe, expect, it } from "vitest";

import {
  createPublishedTrip,
  tripId,
  type PublishedTrip,
} from "@nitipcuy/domain";

import {
  GetPublishedTrip,
  ListPublishedTrips,
  type TripDiscoveryRepository,
  type TripSearchCriteria,
} from "./index";

function trip(
  id: string,
  destination: string,
  departureDate: string,
): PublishedTrip {
  return createPublishedTrip({
    id: tripId(id),
    jastipperDisplayName: "Test Jastipper",
    originLabel: "Singapore",
    destinationLabel: destination,
    departureDate,
    departureAt: `${departureDate}T10:00:00+08:00`,
    requestDeadline: "2026-08-01T18:00:00+08:00",
    estimatedArrivalAt: `${departureDate}T18:00:00+07:00`,
    serviceModes: ["SHOP_FOR_ME"],
    remainingCapacityKg: 4,
    sellerLocationLabel: destination,
    deliverySummary: "Pickup",
    rateSummary: "Disclosed by seller",
    rating: { average: 5, count: 1 },
    publicQuestions: [],
  });
}

class RepositoryStub implements TripDiscoveryRepository {
  constructor(private readonly values: readonly PublishedTrip[]) {}

  searchPublished(
    criteria: TripSearchCriteria,
  ): Promise<readonly PublishedTrip[]> {
    return Promise.resolve(
      this.values.filter((value) => {
        const destinationMatches =
          !criteria.destination ||
          value.destinationLabel
            .toLocaleLowerCase()
            .includes(criteria.destination.toLocaleLowerCase());
        const fromMatches =
          !criteria.departureFrom ||
          value.departureDate >= criteria.departureFrom;
        const toMatches =
          !criteria.departureTo || value.departureDate <= criteria.departureTo;

        return destinationMatches && fromMatches && toMatches;
      }),
    );
  }

  findPublishedById(id: PublishedTrip["id"]): Promise<PublishedTrip | null> {
    return Promise.resolve(
      this.values.find((value) => value.id === id) ?? null,
    );
  }
}

describe("trip discovery use cases", () => {
  const repository = new RepositoryStub([
    trip("trip-jakarta", "Jakarta", "2026-08-15"),
    trip("trip-surabaya", "Surabaya", "2026-09-10"),
  ]);

  it("filters published trips by destination", async () => {
    const results = await new ListPublishedTrips(repository).execute({
      destination: "jAkAr",
    });

    expect(results.map(({ id }) => id)).toEqual(["trip-jakarta"]);
  });

  it("rejects an inverted departure range", () => {
    expect(() =>
      new ListPublishedTrips(repository).execute({
        departureFrom: "2026-10-01",
        departureTo: "2026-09-01",
      }),
    ).toThrow("Departure start date cannot be after the end date.");
  });

  it("returns a published trip by its domain ID", async () => {
    const result = await new GetPublishedTrip(repository).execute(
      tripId("trip-surabaya"),
    );

    expect(result?.destinationLabel).toBe("Surabaya");
  });
});
