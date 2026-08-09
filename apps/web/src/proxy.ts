import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { demoTripIds } from "./server/demo-trip-ids";
import {
  RequestPerimeterConfigurationError,
  applyResponseHeaders,
  buildBrowserSecurityHeaders,
  buildConfigurationFailureHeaders,
  createCanonicalRequestHeaders,
  createRequestNonce,
  evaluateRequestPerimeter,
  readRequestPerimeterPolicy,
} from "./server/request-perimeter-core";

const knownTripIds = new Set<string>(demoTripIds);

export function proxy(request: NextRequest) {
  let policy;
  try {
    policy = readRequestPerimeterPolicy();
  } catch (error) {
    if (!(error instanceof RequestPerimeterConfigurationError)) {
      throw error;
    }
    const response = NextResponse.json(
      { error: "SERVICE_UNAVAILABLE" },
      { status: 503 },
    );
    applyResponseHeaders(response.headers, buildConfigurationFailureHeaders());
    return response;
  }

  const decision = evaluateRequestPerimeter(policy, {
    headers: request.headers,
    requestUrl: request.url,
  });
  const nonce = createRequestNonce();
  const securityHeaders = buildBrowserSecurityHeaders(
    policy,
    nonce,
    request.nextUrl.pathname,
    process.env.NODE_ENV,
    !decision.allowed,
  );

  if (!decision.allowed) {
    const response = NextResponse.json(
      { error: "REQUEST_DENIED" },
      { status: 421 },
    );
    applyResponseHeaders(response.headers, securityHeaders);
    return response;
  }

  const contentSecurityPolicy = securityHeaders["Content-Security-Policy"];
  const requestHeaders = createCanonicalRequestHeaders(
    request.headers,
    policy.appOrigin,
    nonce,
    contentSecurityPolicy,
  );
  const tripId = tripIdForDemoRoute(request.nextUrl.pathname);

  let response: NextResponse;
  if (!tripId || knownTripIds.has(tripId)) {
    response = NextResponse.next({ request: { headers: requestHeaders } });
  } else {
    const notFoundUrl = request.nextUrl.clone();
    notFoundUrl.pathname = "/_not-found";
    response = NextResponse.rewrite(notFoundUrl, {
      request: { headers: requestHeaders },
      status: 404,
    });
  }

  applyResponseHeaders(response.headers, securityHeaders);
  return response;
}

export const config = {
  matcher: [
    {
      source:
        "/((?!_next/static|_next/image|_not-found|favicon.ico|robots.txt|sitemap.xml).*)",
    },
  ],
};

function tripIdForDemoRoute(pathname: string): string | null {
  const match = /^\/trips\/([^/]+)$/.exec(pathname);
  return match?.[1] ?? null;
}
