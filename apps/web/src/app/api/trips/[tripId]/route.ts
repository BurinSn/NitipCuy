import { NextRequest, NextResponse } from "next/server";

import { tripId } from "@nitipcuy/domain";

import { requireAbuseAllowance, routeFailure } from "@/server/http-security";
import { getRuntime } from "@/server/runtime";

interface RouteContext {
  readonly params: Promise<{ readonly tripId: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const params = await context.params;
    const targetTripId = tripId(params.tripId);
    await requireAbuseAllowance(
      request,
      "public.trip-detail",
      { targetSubject: targetTripId },
      crypto.randomUUID(),
    );
    const trip = await getRuntime().getPublishedTrip.execute(targetTripId);
    if (!trip) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }
    return NextResponse.json({ trip });
  } catch (error) {
    return routeFailure(error);
  }
}
