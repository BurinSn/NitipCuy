import { randomUUID } from "node:crypto";

import { NextRequest, NextResponse } from "next/server";

import { tripId } from "@nitipcuy/domain";

import {
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
    requireSameOriginMutation(request);
    const actor = await requireAuthenticatedActor(request);
    const params = await context.params;
    const offer = await getRuntime().submitTripForModeration.execute(
      actor,
      tripId(params.tripId),
      { correlationId: randomUUID() },
    );
    return NextResponse.json({ id: offer.id, status: offer.status });
  } catch (error) {
    return routeFailure(error);
  }
}
