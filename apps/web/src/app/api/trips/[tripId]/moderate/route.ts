import { randomUUID } from "node:crypto";

import { NextRequest, NextResponse } from "next/server";

import { tripId } from "@nitipcuy/domain";

import {
  readBoundedJson,
  rejectInvalidRequest,
  requireAbuseAllowance,
  requireAuthenticatedActor,
  requiredString,
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
      "moderation.trip",
      { actor, targetSubject: targetTripId },
      correlationId,
    );
    const input = await readBoundedJson(request);
    const decision = requiredString(input, "decision");
    if (decision !== "APPROVED" && decision !== "REJECTED") {
      rejectInvalidRequest();
    }
    const offer = await getRuntime().moderateTrip.execute(
      actor,
      {
        decision,
        reasonCode: requiredString(input, "reasonCode"),
        tripId: targetTripId,
      },
      { correlationId },
    );
    return NextResponse.json({ id: offer.id, status: offer.status });
  } catch (error) {
    return routeFailure(error);
  }
}
