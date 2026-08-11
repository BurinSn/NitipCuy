import { NextRequest, NextResponse } from "next/server";

import {
  cookieMaxAge,
  getGoogleOidcClient,
  getRuntime,
  runtimeCookieOptions,
  runtimeOAuthAttemptCookie,
  safeAuthenticationReturnPath,
} from "@/server/runtime";
import { requireAbuseAllowance, routeFailure } from "@/server/http-security";

export async function GET(request: NextRequest) {
  try {
    await requireAbuseAllowance(request, "auth.start", {}, crypto.randomUUID());
    const returnTo = safeAuthenticationReturnPath(
      request.nextUrl.searchParams.get("returnTo") ?? "/",
    );
    const attempt = await getRuntime().oauthAttempts.create(returnTo);
    const authorizationUrl = await (
      await getGoogleOidcClient()
    ).authorizationUrl(attempt);
    const response = NextResponse.redirect(authorizationUrl);
    response.cookies.set(
      runtimeOAuthAttemptCookie.name,
      attempt.browserBinding,
      runtimeCookieOptions(
        runtimeOAuthAttemptCookie,
        cookieMaxAge(attempt.expiresAt),
      ),
    );
    return response;
  } catch (error) {
    const response = routeFailure(error);
    if (response.status === 500) {
      return NextResponse.json(
        { error: "AUTHENTICATION_UNAVAILABLE" },
        { status: 503 },
      );
    }
    return response;
  }
}
