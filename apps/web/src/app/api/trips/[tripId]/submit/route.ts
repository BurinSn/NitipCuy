import { randomUUID } from "node:crypto";

import { NextRequest, NextResponse } from "next/server";

import { tripId } from "@nitipcuy/domain";

import {
  requireAbuseAllowance,
  requireAuthenticatedActor,
  requireSameOriginMutation,
  routeFailure,
} from "@/server/http-security";
import { getRuntime } from "@/server/runtime";

interface RouteContext {
  readonly params: Promise<{ readonly tripId: string }>;
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const correlationId = randomUUID();
    requireSameOriginMutation(request);
    const actor = await requireAuthenticatedActor(request);
    const params = await context.params;
    const targetTripId = tripId(params.tripId);
    await requireAbuseAllowance(
      request,
      "trip.submit",
      { actor, targetSubject: targetTripId },
      correlationId,
    );
    const offer = await getRuntime().submitTripForModeration.execute(
      actor,
      targetTripId,
      { correlationId },
    );
    return NextResponse.json({ id: offer.id, status: offer.status });
  } catch (error) {
    return routeFailure(error);
  }
}
