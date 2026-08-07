import { randomUUID } from "node:crypto";

import { NextRequest, NextResponse } from "next/server";

import { tripId } from "@nitipcuy/domain";

import {
  readBoundedJson,
  rejectInvalidRequest,
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
    requireSameOriginMutation(request);
    const actor = await requireAuthenticatedActor(request);
    const input = await readBoundedJson(request);
    const decision = requiredString(input, "decision");
    if (decision !== "APPROVED" && decision !== "REJECTED") {
      rejectInvalidRequest();
    }
    const params = await context.params;
    const offer = await getRuntime().moderateTrip.execute(
      actor,
      {
        decision,
        reasonCode: requiredString(input, "reasonCode"),
        tripId: tripId(params.tripId),
      },
      { correlationId: randomUUID() },
    );
    return NextResponse.json({ id: offer.id, status: offer.status });
  } catch (error) {
    return routeFailure(error);
  }
}
