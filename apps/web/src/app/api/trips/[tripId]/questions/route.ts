import { randomUUID } from "node:crypto";

import { NextRequest, NextResponse } from "next/server";

import { tripId } from "@nitipcuy/domain";

import {
  readBoundedJson,
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
      "discussion.question",
      { actor, targetSubject: targetTripId },
      correlationId,
    );
    const input = await readBoundedJson(request);
    const question = await getRuntime().askPublicQuestion.execute(
      actor,
      {
        message: requiredString(input, "message"),
        tripId: targetTripId,
      },
      { correlationId },
    );
    return NextResponse.json({ id: question.id }, { status: 201 });
  } catch (error) {
    return routeFailure(error);
  }
}
