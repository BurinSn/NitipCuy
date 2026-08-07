import { randomUUID } from "node:crypto";

import { NextRequest, NextResponse } from "next/server";

import { tripId } from "@nitipcuy/domain";

import {
  readBoundedJson,
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
    const params = await context.params;
    const question = await getRuntime().askPublicQuestion.execute(
      actor,
      {
        message: requiredString(input, "message"),
        tripId: tripId(params.tripId),
      },
      { correlationId: randomUUID() },
    );
    return NextResponse.json({ id: question.id }, { status: 201 });
  } catch (error) {
    return routeFailure(error);
  }
}
