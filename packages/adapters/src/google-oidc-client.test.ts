import { afterEach, describe, expect, it, vi } from "vitest";
import type { CryptoKey as OpenIdCryptoKey } from "openid-client";

import {
  GoogleOidcClient,
  googleIdentityFromClaims,
} from "./google-oidc-client";
import { safeLocalReturnPath } from "./postgres-oauth-attempts";

describe("Google OIDC claim boundary", () => {
  it("maps only a verified Google identity without retaining provider tokens", () => {
    const identity = googleIdentityFromClaims(
      {
        aud: "fixture-client",
        email: "Dina@Example.com",
        email_verified: true,
        iss: "https://accounts.google.com",
        name: "Dina Setia",
        sub: "google-subject-001",
      },
      "2026-08-07T05:00:00.000Z",
    );

    expect(identity).toEqual({
      assurance: "BASE",
      authenticatedAt: "2026-08-07T05:00:00.000Z",
      displayName: "Dina Setia",
      email: "dina@example.com",
      emailVerified: true,
      issuer: "https://accounts.google.com",
      provider: "GOOGLE",
      subject: "google-subject-001",
    });
    expect(identity).not.toHaveProperty("accessToken");
    expect(identity).not.toHaveProperty("refreshToken");
  });

  it.each([
    [
      {
        iss: "https://evil.example",
        sub: "subject",
        email: "a@b.co",
        email_verified: true,
        name: "Valid Name",
      },
    ],
    [
      {
        iss: "https://accounts.google.com",
        sub: "subject",
        email: "a@b.co",
        email_verified: false,
        name: "Valid Name",
      },
    ],
    [
      {
        iss: "https://accounts.google.com",
        sub: "subject",
        email: "a@b.co",
        email_verified: true,
      },
    ],
  ])("rejects incomplete or untrusted claims", (claims) => {
    expect(() =>
      googleIdentityFromClaims(claims, "2026-08-07T05:00:00.000Z"),
    ).toThrow();
  });
});

describe("Google authorization-code protocol fixture", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("uses exact scopes, state, nonce, and S256 PKCE before accepting claims", async () => {
    const fixture = await oidcFixture();
    vi.stubGlobal("fetch", fixture.fetch);
    const client = await configuredClient();
    const attempt = oauthAttempt();
    const authorizationUrl = await client.authorizationUrl(attempt);

    expect(authorizationUrl.origin).toBe("https://accounts.google.com");
    expect(authorizationUrl.searchParams.get("scope")).toBe(
      "openid email profile",
    );
    expect(authorizationUrl.searchParams.get("state")).toBe(attempt.state);
    expect(authorizationUrl.searchParams.get("nonce")).toBe(attempt.nonce);
    expect(authorizationUrl.searchParams.get("code_challenge_method")).toBe(
      "S256",
    );
    expect(authorizationUrl.searchParams.get("code_challenge")).not.toBe(
      attempt.codeVerifier,
    );

    await expect(
      client.complete(
        callbackUrl(attempt.state),
        attempt.state,
        attempt,
        "2026-08-07T05:00:00.000Z",
      ),
    ).resolves.toMatchObject({
      email: "dina@example.com",
      subject: "google-subject-001",
    });
    expect(fixture.tokenRequests()).toBe(1);
  });

  it.each([
    ["wrong audience", { aud: "another-client" }, oauthAttempt()],
    [
      "expired token",
      { exp: Math.floor(Date.now() / 1_000) - 60 },
      oauthAttempt(),
    ],
    [
      "replayed nonce",
      { nonce: "different-nonce-value-that-is-long-enough-000" },
      oauthAttempt(),
    ],
  ])("rejects %s", async (_label, claims, attempt) => {
    const fixture = await oidcFixture(claims);
    vi.stubGlobal("fetch", fixture.fetch);
    const client = await configuredClient();

    await expect(
      client.complete(
        callbackUrl(attempt.state),
        attempt.state,
        attempt,
        "2026-08-07T05:00:00.000Z",
      ),
    ).rejects.toThrow();
  });

  it("rejects an invalid PKCE verifier", async () => {
    const validAttempt = oauthAttempt();
    const fixture = await oidcFixture({}, validAttempt.codeVerifier);
    vi.stubGlobal("fetch", fixture.fetch);
    const client = await configuredClient();

    await expect(
      client.complete(
        callbackUrl(validAttempt.state),
        validAttempt.state,
        { ...validAttempt, codeVerifier: "x".repeat(64) },
        "2026-08-07T05:00:00.000Z",
      ),
    ).rejects.toThrow();
  });
});

describe("OAuth local return paths", () => {
  it("accepts a bounded path on the local origin", () => {
    expect(safeLocalReturnPath("/trips?from=google")).toBe(
      "/trips?from=google",
    );
  });

  it.each([
    "https://evil.example/steal",
    "//evil.example/steal",
    "/%2f%2fevil.example",
    "/trips\\evil",
    "/trips#fragment",
    "/trips%0d%0aSet-Cookie=bad",
  ])("rejects unsafe redirect input %s", (value) => {
    expect(() => safeLocalReturnPath(value)).toThrow(
      "OAuth return path must be a safe local path.",
    );
  });
});

const fixtureClientId = "fixture-google-client-id";
const fixtureClientSecret = "fixture-google-client-secret";

function configuredClient(): Promise<GoogleOidcClient> {
  return GoogleOidcClient.discover({
    clientId: fixtureClientId,
    clientSecret: fixtureClientSecret,
    redirectUri: "http://localhost:3000/auth/google/callback",
    timeoutSeconds: 2,
  });
}

function oauthAttempt() {
  return {
    codeVerifier: "v".repeat(64),
    expiresAt: "2026-08-07T05:10:00.000Z",
    nonce: "n".repeat(43),
    returnTo: "/",
    state: "s".repeat(43),
  } as const;
}

function callbackUrl(state: string): string {
  return `http://localhost:3000/auth/google/callback?code=fixture-code&state=${state}`;
}

async function oidcFixture(
  claimOverrides: Readonly<Record<string, unknown>> = {},
  expectedVerifier = oauthAttempt().codeVerifier,
) {
  const keys = await crypto.subtle.generateKey(
    {
      hash: "SHA-256",
      modulusLength: 2048,
      name: "RSASSA-PKCS1-v1_5",
      publicExponent: new Uint8Array([1, 0, 1]),
    },
    true,
    ["sign", "verify"],
  );
  const publicJwk = await crypto.subtle.exportKey("jwk", keys.publicKey);
  let tokenRequestCount = 0;

  const fixtureFetch = async (
    input: string | URL | Request,
    init?: RequestInit,
  ): Promise<Response> => {
    const url = new URL(
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.href
          : input.url,
    );

    if (url.pathname === "/.well-known/openid-configuration") {
      return jsonResponse({
        authorization_endpoint: "https://accounts.google.com/o/oauth2/v2/auth",
        code_challenge_methods_supported: ["S256"],
        id_token_signing_alg_values_supported: ["RS256"],
        issuer: "https://accounts.google.com",
        jwks_uri: "https://accounts.google.com/oauth2/v3/certs",
        response_types_supported: ["code"],
        subject_types_supported: ["public"],
        token_endpoint: "https://accounts.google.com/token",
        token_endpoint_auth_methods_supported: ["client_secret_post"],
      });
    }

    if (url.pathname === "/token") {
      tokenRequestCount += 1;
      const body = new URLSearchParams(String(init?.body ?? ""));
      if (
        body.get("code_verifier") !== expectedVerifier ||
        body.get("client_secret") !== fixtureClientSecret
      ) {
        return jsonResponse(
          { error: "invalid_grant", error_description: "fixture rejection" },
          400,
        );
      }

      const now = Math.floor(Date.now() / 1_000);
      return jsonResponse({
        access_token: "fixture-access-token",
        expires_in: 300,
        id_token: await signedJwt(keys.privateKey, {
          aud: fixtureClientId,
          email: "dina@example.com",
          email_verified: true,
          exp: now + 300,
          iat: now,
          iss: "https://accounts.google.com",
          name: "Dina Setia",
          nonce: oauthAttempt().nonce,
          sub: "google-subject-001",
          ...claimOverrides,
        }),
        token_type: "Bearer",
      });
    }

    if (url.pathname === "/oauth2/v3/certs") {
      return jsonResponse({
        keys: [{ ...publicJwk, alg: "RS256", kid: "fixture-key", use: "sig" }],
      });
    }

    return new Response(null, { status: 404 });
  };

  return {
    fetch: fixtureFetch,
    tokenRequests: () => tokenRequestCount,
  };
}

async function signedJwt(
  privateKey: OpenIdCryptoKey,
  claims: Readonly<Record<string, unknown>>,
): Promise<string> {
  const header = base64urlJson({
    alg: "RS256",
    kid: "fixture-key",
    typ: "JWT",
  });
  const payload = base64urlJson(claims);
  const signingInput = `${header}.${payload}`;
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    privateKey,
    new TextEncoder().encode(signingInput),
  );
  return `${signingInput}.${Buffer.from(signature).toString("base64url")}`;
}

function base64urlJson(value: Readonly<Record<string, unknown>>): string {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function jsonResponse(value: unknown, status = 200): Response {
  return new Response(JSON.stringify(value), {
    headers: { "content-type": "application/json" },
    status,
  });
}
