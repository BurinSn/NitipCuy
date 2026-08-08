# ADR 0005: Google OIDC, Internal Accounts, and Server Sessions

Status: Accepted for the Stage 1 source and local-integration slice

Date: 2026-08-07

Amended: 2026-08-08 by [issue #9](https://github.com/BurinSn/NitipCuy/issues/9)

Issue: [#5 Stage 1: persist the Google account-to-public-Q&A slice](https://github.com/BurinSn/NitipCuy/issues/5)

## Context

NitipCuy needs accountable protected marketplace actions before it can safely persist profiles, trips, moderation, and public discussion. BurinSN requires a business-standard Google sign-in experience and explicitly does not want NitipCuy to store or operate username/password credentials.

Authentication cannot become business authorization. A Google email, profile claim, or successful redirect cannot grant ownership, seller eligibility, moderation capability, or privileged assurance. Browser sessions must remain revocable by NitipCuy, and the first persistence slice must be testable without real Google credentials or a production database.

## Decision

### 1. Google is the only MVP sign-in adapter

- Use OpenID Connect authorization code flow with `openid-client` `6.8.4`.
- Request only `openid email profile`.
- Require exact issuer `https://accounts.google.com`, the configured client audience, a verified ID-token signature and lifetime, exact callback URI, state, nonce, and S256 PKCE.
- Store the exact issuer and immutable provider subject as the external identity key.
- Require the Google email claim to be verified at authentication time, but do not persist the email in this slice and never use it to link accounts.
- Do not implement username/password, email-password, magic-link, SMS-OTP, or another fallback.
- Do not store provider access tokens, refresh tokens, authorization codes, raw state, nonce, or PKCE verifier.

### 2. NitipCuy owns the internal account and authorization model

- A provider identity resolves to an opaque internal `AccountId`.
- Account status, profile ownership, trip ownership, capabilities, moderation state, and transaction roles are PostgreSQL-authoritative.
- Repeated authentication with the same issuer and subject resolves the same account. The same email under a different subject does not link or merge an account.
- Protected use cases re-check the exact persisted session, account status, account session version, session assurance, expiry, ownership, and required capabilities inside their transaction.
- Database foreign keys repeat the account-to-profile-to-trip ownership boundary.

### 3. NitipCuy owns revocable browser sessions

- Mint 256-bit opaque session tokens and persist only an HMAC-SHA-256 digest.
- Use the host-only `__Host-nitipcuy-session` cookie with `Secure`, `HttpOnly`, `SameSite=Lax`, and path `/`.
- Apply explicit idle and absolute expiry, server-side logout, per-session revocation, account-wide session-version invalidation, and session listing without token disclosure.
- Rotate the token after authentication-sensitive transitions. Reuse of a rotated token revokes the active session family.
- Google login can mint only `BASE` assurance. The session adapter cannot accept caller-selected higher assurance.

### 4. Privileged assurance remains a separate gate

- Moderation requires both the persisted `MODERATE_TRIPS` capability and a persisted `PHISHING_RESISTANT` session.
- Google sign-in is not assumed to satisfy phishing-resistant step-up.
- No production step-up, passkey, factor enrollment, factor recovery, or privileged-session minting route is implemented by this slice. Therefore the production moderation HTTP route fails closed until a separately approved assurance adapter exists.
- Recovery may not be weaker than the assurance it replaces.

### 5. OAuth attempts and callbacks fail closed

- Persist only SHA-256 digests of random state and a separate 256-bit browser-binding value; keep the raw binding only in a short-lived host-only `Secure`, `HttpOnly`, `SameSite=Lax` cookie.
- Encrypt nonce and PKCE verifier using versioned AES-256-GCM ciphertext supplied with a runtime key; consume an attempt once within a serializable transaction.
- Require the callback state and browser-binding cookie to match the same pending attempt, preventing a callback prepared in one browser from signing another browser into the attacker's account.
- Reject absent or mismatched browser binding, expired, replayed, malformed, corrupted, wrong-origin, wrong-path, and unsafe-return attempts with generic external errors and bounded reason-code audit.
- Keep return destinations local and allowlisted by syntax; never place a session token in a URL or browser storage.

### 6. PostgreSQL and Prisma remain isolated adapters

- Use Prisma `7.9.1`, `@prisma/adapter-pg` `7.9.1`, and `pg` `8.22.0` only inside `packages/adapters`.
- Use one serializable transaction budget for authoritative state, success audit, and required outbox records.
- Use bounded pool, connection, query, statement, transaction, page-size, and request-body limits.
- Commit and SQL-review an additive initial migration; test it against disposable PostgreSQL 18.

### 7. The application owns one canonical request perimeter

- `NITIPCUY_APP_ORIGIN` is parsed once by the request-perimeter authority and reused by proxy validation, protected mutation checks, Google client configuration, callback reconstruction, and safe local redirects.
- `LOCAL_DIRECT` mode is explicit and valid only for an exact loopback origin. It validates the direct host and scheme and rejects contradictory forwarding metadata.
- Any non-local origin requires `TRUSTED_PROXY`, HTTPS, exact canonical forwarded host/protocol/port metadata, and a bounded edge proof supplied through `NITIPCUY_EDGE_REQUEST_SECRET`. Missing, duplicated, forged, contradictory, or ambiguous values fail closed without redirecting.
- Validated edge and forwarding headers are removed before routes execute. Downstream code receives only server-owned canonical-origin and nonce headers.
- The Google callback is reconstructed from the server-owned canonical origin, path, and query. It never supplies `request.url`, `Host`, or forwarded metadata directly to `openid-client` as callback authority.
- Relevant responses receive a fresh nonce CSP, anti-framing and content-type protections, restrictive browser permissions, referrer and cross-origin policies, and HSTS for the HTTPS policy. Authentication/API paths and all hostile-authority denials are explicitly private and `no-store`.
- Nonce-based CSP requires dynamic rendering in the current Next.js runtime. Public cache reintroduction needs a separately reviewed policy that preserves per-response nonce integrity or uses another approved CSP mechanism.

## Consequences

- NitipCuy has one internal account and session authority without becoming a password operator.
- Email minimization prevents an unnecessary private contact copy and removes email-based account takeover or merging logic from this slice.
- A database or session-authority outage blocks protected writes; anonymous published-trip reads remain a distinct bounded query.
- Privileged moderation is source- and database-integration-testable with a synthetic persisted step-up session, but no live user can obtain that assurance through Google login alone.
- Real Google client creation, provider-console configuration, provider verification, production keys, deployment, shared abuse controls, managed key custody, browser automation, and production security remain separate approvals and evidence gates.
- Incorrect or absent perimeter configuration returns a generic unavailable response; hostile host, proxy, and forwarding requests return a non-redirecting denial. This favors safe unavailability over guessed request authority.

## Alternatives not selected

- Local password authentication was rejected by explicit product direction and because it would add credential storage, reset, recovery, and abuse obligations.
- Email-based account linking was rejected because email is mutable and does not replace the immutable issuer-subject identity key.
- A library-owned opaque user/session schema was not selected because NitipCuy requires its internal account, digest-only session storage, account versioning, and capability checks to remain authoritative and transaction-visible.
- Hand-written provider token or signature validation was rejected. `openid-client` owns protocol and cryptographic verification; NitipCuy validates the resulting minimal claim contract again at the application boundary.

## Evidence and non-claims

The account/session evidence remains source-tested and disposable-PostgreSQL-integration-tested. Issue #9 additionally source-tests request-perimeter decisions and locally runtime-tests the built application in direct-loopback and simulated trusted-proxy modes. The runtime gate verifies nonce matching and freshness, production CSP without unsafe inline/eval, private- and denied-response `no-store`, hostile host/forwarding denial, exact `404`, trusted edge proof, and HSTS output. No real Google account, provider console, preview deployment, production cookie, live edge, managed key, external target, real browser flow, load profile, incident exercise, or provider compatibility has been verified.
