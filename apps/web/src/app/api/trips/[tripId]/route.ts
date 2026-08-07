import { NextRequest, NextResponse } from "next/server";

import { tripId } from "@nitipcuy/domain";

import { routeFailure } from "@/server/http-security";
import { getRuntime } from "@/server/runtime";

interface RouteContext {
  readonly params: Promise<{ readonly tripId: string }>;
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const params = await context.params;
    const trip = await getRuntime().getPublishedTrip.execute(
      tripId(params.tripId),
    );
    if (!trip) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }
    return NextResponse.json({ trip });
  } catch (error) {
    return routeFailure(error);
  }
}
