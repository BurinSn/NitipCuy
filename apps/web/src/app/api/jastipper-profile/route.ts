import { randomUUID } from "node:crypto";

import { NextRequest, NextResponse } from "next/server";

import {
  readBoundedJson,
  requireAuthenticatedActor,
  requiredString,
  requireSameOriginMutation,
  routeFailure,
} from "@/server/http-security";
import { getRuntime } from "@/server/runtime";

export async function POST(request: NextRequest) {
  try {
    requireSameOriginMutation(request);
    const actor = await requireAuthenticatedActor(request);
    const input = await readBoundedJson(request);
    const profile = await getRuntime().createJastipperProfile.execute(
      actor,
      {
        deliverySummary: requiredString(input, "deliverySummary"),
        displayName: requiredString(input, "displayName"),
        rateSummary: requiredString(input, "rateSummary"),
        sellerLocationLabel: requiredString(input, "sellerLocationLabel"),
      },
      { correlationId: randomUUID() },
    );
    return NextResponse.json({ id: profile.id }, { status: 201 });
  } catch (error) {
    return routeFailure(error);
  }
}
