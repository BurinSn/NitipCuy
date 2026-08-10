import { randomUUID } from "node:crypto";

import { NextRequest, NextResponse } from "next/server";

import { tripId, type ServiceMode } from "@nitipcuy/domain";

import {
  readBoundedJson,
  rejectInvalidRequest,
  requireAbuseAllowance,
  requireAuthenticatedActor,
  requiredNumber,
  requiredString,
  requiredStringArray,
  requireSameOriginMutation,
  routeFailure,
} from "@/server/http-security";
import { getRuntime } from "@/server/runtime";

export async function GET(request: NextRequest) {
  try {
    await requireAbuseAllowance(request, "public.trip-list", {}, randomUUID());
    const cursor = request.nextUrl.searchParams.get("cursor");
    const limitValue = request.nextUrl.searchParams.get("limit");
    const limit = limitValue ? Number(limitValue) : undefined;
    const trips = await getRuntime().listPublishedTrips.execute({
      ...(request.nextUrl.searchParams.get("destination")
        ? { destination: request.nextUrl.searchParams.get("destination")! }
        : {}),
      ...(request.nextUrl.searchParams.get("from")
        ? { departureFrom: request.nextUrl.searchParams.get("from")! }
        : {}),
      ...(request.nextUrl.searchParams.get("to")
        ? { departureTo: request.nextUrl.searchParams.get("to")! }
        : {}),
      ...(cursor ? { cursor: tripId(cursor) } : {}),
      ...(limit === undefined ? {} : { limit }),
    });
    return NextResponse.json({
      nextCursor:
        trips.length === (limit ?? 20) ? (trips.at(-1)?.id ?? null) : null,
      trips,
    });
  } catch (error) {
    return routeFailure(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const correlationId = randomUUID();
    requireSameOriginMutation(request);
    const actor = await requireAuthenticatedActor(request);
    await requireAbuseAllowance(
      request,
      "trip.create",
      { actor },
      correlationId,
    );
    const input = await readBoundedJson(request);
    const serviceModes = requiredStringArray(input, "serviceModes");
    if (
      !serviceModes.every(
        (mode): mode is ServiceMode =>
          mode === "SHOP_FOR_ME" || mode === "CARRY_MY_ITEM",
      )
    ) {
      rejectInvalidRequest();
    }

    const offer = await getRuntime().createTripDraft.execute(
      actor,
      {
        departureAt: requiredString(input, "departureAt"),
        departureDate: requiredString(input, "departureDate"),
        destinationLabel: requiredString(input, "destinationLabel"),
        destinationTimeZone: requiredString(input, "destinationTimeZone"),
        estimatedArrivalAt: requiredString(input, "estimatedArrivalAt"),
        id: tripId(requiredString(input, "id")),
        originLabel: requiredString(input, "originLabel"),
        originTimeZone: requiredString(input, "originTimeZone"),
        remainingCapacityKg: requiredNumber(input, "remainingCapacityKg"),
        requestDeadline: requiredString(input, "requestDeadline"),
        requestOpenAt: requiredString(input, "requestOpenAt"),
        serviceModes,
        serviceWindowEndAt: requiredString(input, "serviceWindowEndAt"),
        serviceWindowStartAt: requiredString(input, "serviceWindowStartAt"),
      },
      { correlationId },
    );
    return NextResponse.json(
      { id: offer.id, status: offer.status },
      { status: 201 },
    );
  } catch (error) {
    return routeFailure(error);
  }
}
