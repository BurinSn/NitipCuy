import {
  DomainValidationError,
  tripId,
  type PublishedTrip,
  type TripId,
} from "@nitipcuy/domain";

const dateOnlyPattern = /^\d{4}-\d{2}-\d{2}$/;

export interface TripSearchCriteria {
  readonly destination?: string;
  readonly departureFrom?: string;
  readonly departureTo?: string;
  readonly cursor?: TripId;
  readonly limit?: number;
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
  const cursor = criteria.cursor ? tripId(criteria.cursor) : undefined;
  const limit = criteria.limit ?? 20;

  if (destination && destination.length > 160) {
    throw new DomainValidationError("Destination filter is too long.");
  }

  if (!Number.isInteger(limit) || limit < 1 || limit > 50) {
    throw new DomainValidationError("Trip page size must be between 1 and 50.");
  }

  if (
    departureFrom &&
    departureTo &&
    departureFrom.localeCompare(departureTo) > 0
  ) {
    throw new DomainValidationError(
      "Departure start date cannot be after the end date.",
    );
  }

  return {
    ...(destination ? { destination } : {}),
    ...(departureFrom ? { departureFrom } : {}),
    ...(departureTo ? { departureTo } : {}),
    ...(cursor ? { cursor } : {}),
    limit,
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
    throw new DomainValidationError("Departure filters must use ISO dates.");
  }

  return value;
}
