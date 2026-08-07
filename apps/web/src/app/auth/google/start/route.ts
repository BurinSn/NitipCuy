import { NextRequest, NextResponse } from "next/server";

import {
  cookieMaxAge,
  getGoogleOidcClient,
  getRuntime,
  runtimeCookieOptions,
  runtimeOAuthAttemptCookie,
  safeAuthenticationReturnPath,
} from "@/server/runtime";

export async function GET(request: NextRequest) {
  try {
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
  } catch {
    return NextResponse.json(
      { error: "AUTHENTICATION_UNAVAILABLE" },
      { status: 503 },
    );
  }
}
