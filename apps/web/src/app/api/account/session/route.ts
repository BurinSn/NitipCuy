import { NextRequest, NextResponse } from "next/server";

import {
  requireAuthenticatedActor,
  routeFailure,
} from "@/server/http-security";

export async function GET(request: NextRequest) {
  try {
    const actor = await requireAuthenticatedActor(request);
    return NextResponse.json({
      accountId: actor.accountId,
      assurance: actor.assurance,
      capabilities: [...actor.capabilities].sort(),
      sessionId: actor.sessionId,
    });
  } catch (error) {
    return routeFailure(error);
  }
}
