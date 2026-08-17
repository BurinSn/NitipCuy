import "server-only";

import { DomainValidationError, tripId } from "@nitipcuy/domain";

import { application } from "./composition";

export async function findPublishedTrip(rawTripId: string) {
  try {
    return await application.getPublishedTrip.execute(tripId(rawTripId));
  } catch (error) {
    if (error instanceof DomainValidationError) {
      return null;
    }

    throw error;
  }
}
