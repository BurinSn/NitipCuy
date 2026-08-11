import { randomUUID } from "node:crypto";

import { NextRequest, NextResponse } from "next/server";

import {
  readBoundedJson,
  requireAbuseAllowance,
  requireAuthenticatedActor,
  requiredString,
  requireSameOriginMutation,
  routeFailure,
} from "@/server/http-security";
import { getRuntime } from "@/server/runtime";

export async function POST(request: NextRequest) {
  try {
    const correlationId = randomUUID();
    requireSameOriginMutation(request);
    const actor = await requireAuthenticatedActor(request);
    await requireAbuseAllowance(
      request,
      "profile.create",
      { actor },
      correlationId,
    );
    const input = await readBoundedJson(request);
    const profile = await getRuntime().createJastipperProfile.execute(
      actor,
      {
        deliverySummary: requiredString(input, "deliverySummary"),
        displayName: requiredString(input, "displayName"),
        rateSummary: requiredString(input, "rateSummary"),
        sellerLocationLabel: requiredString(input, "sellerLocationLabel"),
      },
      { correlationId },
    );
    return NextResponse.json({ id: profile.id }, { status: 201 });
  } catch (error) {
    return routeFailure(error);
  }
}
