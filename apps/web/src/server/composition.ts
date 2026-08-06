import "server-only";

import { InMemoryTripDiscoveryRepository } from "@nitipcuy/adapters";
import { GetPublishedTrip, ListPublishedTrips } from "@nitipcuy/application";

import { demoTrips } from "./demo-trips";

const tripRepository = new InMemoryTripDiscoveryRepository(demoTrips);

export const application = Object.freeze({
  getPublishedTrip: new GetPublishedTrip(tripRepository),
  listPublishedTrips: new ListPublishedTrips(tripRepository),
});
