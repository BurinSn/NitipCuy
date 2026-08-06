import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { demoTripIds } from "@/server/demo-trip-ids";

const knownTripIds = new Set<string>(demoTripIds);

export function proxy(request: NextRequest) {
  const tripId = request.nextUrl.pathname.split("/").at(-1);

  if (!tripId || knownTripIds.has(tripId)) {
    return NextResponse.next();
  }

  const notFoundUrl = request.nextUrl.clone();
  notFoundUrl.pathname = "/_not-found";

  return NextResponse.rewrite(notFoundUrl, { status: 404 });
}

export const config = {
  matcher: "/trips/:tripId",
};
