import type {
  TripDiscoveryRepository,
  TripSearchCriteria,
} from "@nitipcuy/application";
import type { PublishedTrip, TripId } from "@nitipcuy/domain";

export class InMemoryTripDiscoveryRepository implements TripDiscoveryRepository {
  private readonly trips: readonly PublishedTrip[];

  constructor(trips: readonly PublishedTrip[]) {
    this.trips = Object.freeze([...trips]);
  }

  searchPublished(
    criteria: TripSearchCriteria,
  ): Promise<readonly PublishedTrip[]> {
    const destination = criteria.destination?.toLocaleLowerCase();
    const filtered = this.trips
      .filter((trip) => {
        const destinationMatches =
          !destination ||
          trip.destinationLabel.toLocaleLowerCase().includes(destination);
        const fromMatches =
          !criteria.departureFrom ||
          trip.departureDate >= criteria.departureFrom;
        const toMatches =
          !criteria.departureTo || trip.departureDate <= criteria.departureTo;

        return destinationMatches && fromMatches && toMatches;
      })
      .sort(
        (left, right) =>
          left.departureDate.localeCompare(right.departureDate) ||
          left.id.localeCompare(right.id),
      );
    const cursorIndex = criteria.cursor
      ? filtered.findIndex((trip) => trip.id === criteria.cursor)
      : -1;

    if (criteria.cursor && cursorIndex < 0) {
      return Promise.resolve([]);
    }

    const start = criteria.cursor ? cursorIndex + 1 : 0;
    return Promise.resolve(
      filtered.slice(start, start + (criteria.limit ?? 20)),
    );
  }

  findPublishedById(id: TripId): Promise<PublishedTrip | null> {
    return Promise.resolve(this.trips.find((trip) => trip.id === id) ?? null);
  }
}
