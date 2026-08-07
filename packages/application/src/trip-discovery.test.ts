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
    originTimeZone: "Asia/Singapore",
    destinationLabel: destination,
    destinationTimeZone: "Asia/Jakarta",
    serviceWindowStartAt: "2026-07-25T09:00:00+08:00",
    serviceWindowEndAt: "2026-08-10T18:00:00+08:00",
    departureDate,
    departureAt: `${departureDate}T10:00:00+08:00`,
    requestOpenAt: "2026-07-20T09:00:00+07:00",
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
    const filtered = this.values.filter((value) => {
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
    });
    const cursorIndex = criteria.cursor
      ? filtered.findIndex((value) => value.id === criteria.cursor)
      : -1;
    const start = criteria.cursor ? cursorIndex + 1 : 0;
    return Promise.resolve(
      filtered.slice(start, start + (criteria.limit ?? 20)),
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

  it("normalizes a bounded cursor page", async () => {
    const results = await new ListPublishedTrips(repository).execute({
      cursor: tripId("trip-jakarta"),
      limit: 1,
    });

    expect(results.map(({ id }) => id)).toEqual(["trip-surabaya"]);
  });

  it("rejects unbounded page sizes", () => {
    expect(() =>
      new ListPublishedTrips(repository).execute({ limit: 51 }),
    ).toThrow("Trip page size must be between 1 and 50.");
  });
});
