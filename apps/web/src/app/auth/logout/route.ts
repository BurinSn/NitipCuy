import { NextRequest, NextResponse } from "next/server";

import {
  requireSameOriginMutation,
  routeFailure,
} from "@/server/http-security";
import {
  getRuntime,
  runtimeCookieOptions,
  runtimeSessionCookie,
} from "@/server/runtime";

export async function POST(request: NextRequest) {
  try {
    requireSameOriginMutation(request);
    const token = request.cookies.get(runtimeSessionCookie.name)?.value;
    if (token) {
      await getRuntime().sessions.revoke(token);
    }
    const response = new NextResponse(null, { status: 204 });
    response.cookies.set(
      runtimeSessionCookie.name,
      "",
      runtimeCookieOptions(runtimeSessionCookie, 0),
    );
    return response;
  } catch (error) {
    return routeFailure(error);
  }
}
