import { NextRequest, NextResponse } from "next/server";

import {
  cookieMaxAge,
  getGoogleOidcClient,
  getRuntime,
  recordAuthenticationOutcome,
  runtimeOAuthAttemptCookie,
  runtimeCookieOptions,
  runtimeSessionCookie,
} from "@/server/runtime";

export async function GET(request: NextRequest) {
  const state = request.nextUrl.searchParams.get("state") ?? "";

  try {
    const runtime = getRuntime();
    if (
      request.nextUrl.origin !== runtime.appOrigin ||
      request.nextUrl.pathname !== "/auth/google/callback"
    ) {
      await recordFailure("OIDC_CALLBACK_URL_REJECTED", "DENIED");
      return clearOAuthAttemptCookie(authenticationFailure());
    }
    const browserBinding =
      request.cookies.get(runtimeOAuthAttemptCookie.name)?.value ?? "";
    const attempt = await runtime.oauthAttempts.consume(state, browserBinding);
    if (!attempt) {
      await recordFailure("OAUTH_STATE_REJECTED", "DENIED");
      return clearOAuthAttemptCookie(authenticationFailure());
    }

    const identity = await (
      await getGoogleOidcClient()
    ).complete(request.url, state, attempt, new Date().toISOString());
    const resolved = await runtime.resolveGoogleAccount.execute(identity, {
      correlationId: crypto.randomUUID(),
    });
    const session = await runtime.sessions.create(resolved.account.id);
    if (!session) {
      await recordFailure("SESSION_CREATION_REJECTED", "DENIED");
      return clearOAuthAttemptCookie(authenticationFailure());
    }

    const response = NextResponse.redirect(
      new URL(attempt.returnTo, runtime.appOrigin),
    );
    response.cookies.set(
      runtimeSessionCookie.name,
      session.token,
      runtimeCookieOptions(
        runtimeSessionCookie,
        cookieMaxAge(session.absoluteExpiresAt),
      ),
    );
    return clearOAuthAttemptCookie(response);
  } catch {
    await recordFailure("OIDC_CALLBACK_FAILED", "FAILED");
    return clearOAuthAttemptCookie(authenticationFailure());
  }
}

function clearOAuthAttemptCookie(response: NextResponse): NextResponse {
  response.cookies.set(
    runtimeOAuthAttemptCookie.name,
    "",
    runtimeCookieOptions(runtimeOAuthAttemptCookie, 0),
  );
  return response;
}

function authenticationFailure(): NextResponse {
  return NextResponse.json({ error: "AUTHENTICATION_FAILED" }, { status: 400 });
}

async function recordFailure(
  reasonCode: string,
  outcome: "DENIED" | "FAILED",
): Promise<void> {
  try {
    await recordAuthenticationOutcome(reasonCode, outcome);
  } catch {
    // Authentication remains denied when its audit dependency is unavailable.
  }
}
