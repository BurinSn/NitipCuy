import {
  ClientSecretPost,
  authorizationCodeGrant,
  buildAuthorizationUrl,
  calculatePKCECodeChallenge,
  discovery,
  type Configuration,
} from "openid-client";

import type { VerifiedExternalIdentity } from "@nitipcuy/application";
import { googleIssuer } from "@nitipcuy/domain";

import type {
  ConsumedOAuthAttempt,
  OAuthAttemptStart,
} from "./postgres-oauth-attempts";

export interface GoogleOidcConfiguration {
  readonly clientId: string;
  readonly clientSecret: string;
  readonly redirectUri: string;
  readonly timeoutSeconds?: number;
}

interface GoogleOidcRuntimeConfiguration {
  readonly client: Configuration;
  readonly redirectUri: string;
}

export class GoogleOidcClient {
  private constructor(
    private readonly configuration: GoogleOidcRuntimeConfiguration,
  ) {}

  static async discover(
    input: GoogleOidcConfiguration,
  ): Promise<GoogleOidcClient> {
    const clientId = requireBoundedSecretReference(
      input.clientId,
      "Google client ID",
    );
    const clientSecret = requireBoundedSecretReference(
      input.clientSecret,
      "Google client secret",
    );
    const redirectUri = exactRedirectUri(input.redirectUri);
    const timeout = input.timeoutSeconds ?? 10;
    if (!Number.isInteger(timeout) || timeout < 2 || timeout > 30) {
      throw new Error("Google OIDC timeout must be between 2 and 30 seconds.");
    }

    const client = await discovery(
      new URL(googleIssuer),
      clientId,
      {
        redirect_uris: [redirectUri],
        response_types: ["code"],
      },
      ClientSecretPost(clientSecret),
      { timeout },
    );

    if (client.serverMetadata().issuer !== googleIssuer) {
      throw new Error("Google OIDC discovery returned an unexpected issuer.");
    }

    return new GoogleOidcClient({ client, redirectUri });
  }

  async authorizationUrl(
    attempt: Pick<OAuthAttemptStart, "codeVerifier" | "nonce" | "state">,
  ): Promise<URL> {
    const codeChallenge = await calculatePKCECodeChallenge(
      attempt.codeVerifier,
    );
    return buildAuthorizationUrl(this.configuration.client, {
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
      nonce: attempt.nonce,
      redirect_uri: this.configuration.redirectUri,
      response_type: "code",
      scope: "openid email profile",
      state: attempt.state,
    });
  }

  async complete(
    currentUrlInput: string | URL,
    state: string,
    attempt: ConsumedOAuthAttempt,
    authenticatedAt: string,
  ): Promise<VerifiedExternalIdentity> {
    const currentUrl = new URL(currentUrlInput);
    const expectedRedirect = new URL(this.configuration.redirectUri);
    if (
      currentUrl.origin !== expectedRedirect.origin ||
      currentUrl.pathname !== expectedRedirect.pathname ||
      currentUrl.hash
    ) {
      throw new Error(
        "Google OIDC callback URL does not match the configured redirect.",
      );
    }

    const tokens = await authorizationCodeGrant(
      this.configuration.client,
      currentUrl,
      {
        expectedNonce: attempt.nonce,
        expectedState: state,
        idTokenExpected: true,
        pkceCodeVerifier: attempt.codeVerifier,
      },
    );
    const claims = tokens.claims();
    if (!claims) {
      throw new Error(
        "Google OIDC response did not contain a verified ID token.",
      );
    }

    return googleIdentityFromClaims(claims, authenticatedAt);
  }
}

export function googleIdentityFromClaims(
  claims: Readonly<Record<string, unknown>>,
  authenticatedAtInput: string,
): VerifiedExternalIdentity {
  const authenticatedAt = requireInstant(authenticatedAtInput);
  if (claims.iss !== googleIssuer) {
    throw new Error("Google identity issuer is invalid.");
  }
  const subject = requireClaim(claims.sub, "subject", 1, 255);
  const email = requireClaim(claims.email, "email", 3, 320).toLowerCase();
  if (claims.email_verified !== true) {
    throw new Error("Google identity email is not verified.");
  }
  const displayName = requireClaim(claims.name, "display name", 2, 120);

  return Object.freeze({
    assurance: "BASE",
    authenticatedAt,
    displayName,
    email,
    emailVerified: true,
    issuer: googleIssuer,
    provider: "GOOGLE",
    subject,
  });
}

function exactRedirectUri(value: string): string {
  const parsed = new URL(value);
  const localDevelopment =
    parsed.protocol === "http:" &&
    (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1");
  if (
    (parsed.protocol !== "https:" && !localDevelopment) ||
    parsed.username ||
    parsed.password ||
    parsed.search ||
    parsed.hash
  ) {
    throw new Error("Google redirect URI must be an exact HTTPS callback URL.");
  }
  return parsed.toString();
}

function requireBoundedSecretReference(value: string, field: string): string {
  const normalized = value.trim();
  if (normalized.length < 8 || normalized.length > 512) {
    throw new Error(`${field} is missing or invalid.`);
  }
  return normalized;
}

function requireClaim(
  value: unknown,
  field: string,
  minimum: number,
  maximum: number,
): string {
  if (typeof value !== "string") {
    throw new Error(`Google identity ${field} is missing.`);
  }
  const normalized = value.trim();
  if (normalized.length < minimum || normalized.length > maximum) {
    throw new Error(`Google identity ${field} is invalid.`);
  }
  return normalized;
}

function requireInstant(value: string): string {
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) {
    throw new Error("Authentication instant is invalid.");
  }
  return new Date(parsed).toISOString();
}
