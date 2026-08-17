import { randomUUID } from "node:crypto";

import { NextRequest, NextResponse } from "next/server";

import { tripId } from "@nitipcuy/domain";

import {
  readBoundedJson,
  requireAbuseAllowance,
  requireAuthenticatedActor,
  requireSameOriginMutation,
  routeFailure,
} from "@/server/http-security";
import {
  parseOrderRequestTerms,
  safeOrderSubmissionProjection,
} from "@/server/order-submission-input";
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
      "order.submit",
      { actor, targetSubject: targetTripId },
      correlationId,
    );
    const input = await readBoundedJson(request);
    const submitted = await getRuntime().submitOrderRequest.execute(
      actor,
      { terms: parseOrderRequestTerms(input), tripId: targetTripId },
      {
        correlationId,
        idempotencyKey: request.headers.get("idempotency-key") ?? "",
      },
    );
    return NextResponse.json(
      {
        request: safeOrderSubmissionProjection(submitted),
      },
      { status: 201 },
    );
  } catch (error) {
    return routeFailure(error);
  }
}
