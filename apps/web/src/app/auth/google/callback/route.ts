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
import {
  canonicalExternalUrl,
  canonicalOriginHeader,
} from "@/server/request-perimeter-core";
import { requireAbuseAllowance, routeFailure } from "@/server/http-security";

export async function GET(request: NextRequest) {
  const state = request.nextUrl.searchParams.get("state") ?? "";
  const browserBinding =
    request.cookies.get(runtimeOAuthAttemptCookie.name)?.value ?? "";
  let attemptConsumed = false;

  try {
    await requireAbuseAllowance(
      request,
      "auth.callback",
      browserBinding ? { deviceSubject: browserBinding } : {},
      crypto.randomUUID(),
    );
    const runtime = getRuntime();
    const canonicalCallbackUrl = canonicalExternalUrl(
      runtime.appOrigin,
      request.headers.get(canonicalOriginHeader),
      request.nextUrl.pathname,
      request.nextUrl.search,
    );
    if (
      request.nextUrl.pathname !== "/auth/google/callback" ||
      !canonicalCallbackUrl
    ) {
      await recordFailure("OIDC_CALLBACK_URL_REJECTED", "DENIED");
      return clearOAuthAttemptCookie(authenticationFailure());
    }
    const attempt = await runtime.oauthAttempts.consume(state, browserBinding);
    if (!attempt) {
      await recordFailure("OAUTH_STATE_REJECTED", "DENIED");
      return clearOAuthAttemptCookie(authenticationFailure());
    }
    attemptConsumed = true;

    const identity = await (
      await getGoogleOidcClient()
    ).complete(canonicalCallbackUrl, state, attempt, new Date().toISOString());
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
  } catch (error) {
    const boundaryResponse = routeFailure(error);
    if (boundaryResponse.status === 429 || boundaryResponse.status === 503) {
      if (boundaryResponse.status === 503) {
        await recordFailure("AUTHENTICATION_DEPENDENCY_UNAVAILABLE", "FAILED");
      }
      return attemptConsumed
        ? clearOAuthAttemptCookie(boundaryResponse)
        : boundaryResponse;
    }
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
