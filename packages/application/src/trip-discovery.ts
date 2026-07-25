import type { PublishedTrip, TripId } from "@nitipcuy/domain";

const dateOnlyPattern = /^\d{4}-\d{2}-\d{2}$/;

export interface TripSearchCriteria {
  readonly destination?: string;
  readonly departureFrom?: string;
  readonly departureTo?: string;
}

export interface TripDiscoveryRepository {
  searchPublished(
    criteria: TripSearchCriteria,
  ): Promise<readonly PublishedTrip[]>;
  findPublishedById(id: TripId): Promise<PublishedTrip | null>;
}

export class ListPublishedTrips {
  constructor(private readonly trips: TripDiscoveryRepository) {}

  execute(
    criteria: TripSearchCriteria = {},
  ): Promise<readonly PublishedTrip[]> {
    return this.trips.searchPublished(normalizeTripSearchCriteria(criteria));
  }
}

export class GetPublishedTrip {
  constructor(private readonly trips: TripDiscoveryRepository) {}

  execute(id: TripId): Promise<PublishedTrip | null> {
    return this.trips.findPublishedById(id);
  }
}

export function normalizeTripSearchCriteria(
  criteria: TripSearchCriteria,
): TripSearchCriteria {
  const destination = criteria.destination?.trim();
  const departureFrom = normalizeDate(criteria.departureFrom);
  const departureTo = normalizeDate(criteria.departureTo);

  if (
    departureFrom &&
    departureTo &&
    departureFrom.localeCompare(departureTo) > 0
  ) {
    throw new Error("Departure start date cannot be after the end date.");
  }

  return {
    ...(destination ? { destination } : {}),
    ...(departureFrom ? { departureFrom } : {}),
    ...(departureTo ? { departureTo } : {}),
  };
}

function normalizeDate(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }

  if (
    !dateOnlyPattern.test(value) ||
    Number.isNaN(Date.parse(`${value}T00:00:00Z`))
  ) {
    throw new Error("Departure filters must use ISO dates.");
  }

  return value;
}
