# NitipCuy Security Architecture

Status: Accepted design baseline; controls are not yet production-implemented or verified

Last reviewed: 2026-08-08

Binding decision: [ADR 0004](../decisions/0004-security-resilience-and-scale-baseline.md)

## 1. Authority and claim discipline

This document governs application-security, abuse-resistance, data-protection, and security-verification requirements. The moderation model governs marketplace content and conduct. The system architecture governs package and provider boundaries. The quality gates govern required evidence. The review-governance document owns per-issue and per-PR DRY and guarded-Strix progress states.

NitipCuy does not claim to be DDoS-proof, injection-proof, session-hijack-proof, brute-force-proof, or secure against every future attack. The required outcome is a layered system that reduces likelihood and impact, detects abuse, fails safely, preserves evidence, and can recover.

Each control must be labelled with its actual evidence level:

| Level | Meaning |
|---|---|
| Designed | Accepted requirement only |
| Implemented | Source or configuration exists |
| Source-tested | Automated unit, integration, or browser tests cover it |
| Runtime-tested | Deployed non-production behavior was exercised |
| Load-tested | Approved capacity and abuse profiles passed |
| Provider-verified | Live edge, identity, storage, database, or provider configuration was inspected |
| Incident-tested | Detection, containment, revocation, recovery, and evidence preservation were rehearsed |

The current architecture foundation is **designed** only unless a narrower claim is explicitly supported by recorded evidence.

## 2. Verification target

The complete production web application targets [OWASP ASVS 5.0](https://owasp.org/www-project-application-security-verification-standard/) Level 2. High-impact payment, settlement, moderation, administrator, support, identity-evidence, and account-recovery operations receive risk-based additional controls and independent review.

ASVS is a verification baseline, not a certificate and not a substitute for threat modelling, provider configuration review, load testing, or incident exercises.

## 3. Protected assets

Highest-impact assets include:

- authentication sessions, recovery channels, and provider-subject mappings;
- legal identity, verification, device, bank-ownership, and risk evidence;
- addresses, private communication, receipts, handover codes, and raw evidence;
- orders, commercial snapshots, disputes, and moderation cases;
- payment intents, internal ledger entries, releases, refunds, payouts, reserves, and provider references;
- administrator and support capabilities;
- provider callback secrets, signing keys, application secrets, and database credentials;
- append-only audit, event inbox, outbox, and reconciliation records;
- system availability and infrastructure or provider-spend budgets.

Public marketplace content is still integrity-sensitive. Attackers must not be able to forge ownership, eligibility, ratings, capacity, dates, rates, answers, or moderation state.

## 4. Trust boundaries

```text
untrusted browser and automated clients
  -> edge network, DDoS mitigation, WAF, and bot controls
  -> Next.js delivery validation
  -> authenticated internal account and session
  -> application authorization and domain invariants
  -> least-privilege adapters
  -> PostgreSQL / private object storage / reviewed providers

untrusted provider callback
  -> signature, timestamp, replay, and size checks
  -> restricted immutable inbox
  -> mapping and reconciliation
  -> authorized idempotent application command
```

The browser, URL, headers, cookies, hidden fields, client role, file name, MIME type, redirect, provider status, callback, and external response are all untrusted.

## 5. Threat and control matrix

| Threat | Required primary controls | Required evidence before affected production flow |
|---|---|---|
| DDoS and resource exhaustion | Provider DDoS layer, WAF, shared rate limits, request and cost budgets, cache, circuit breakers | Runtime provider configuration, load and abuse tests, alert and kill-switch exercise |
| Proxy, host, or forwarding-header spoofing | Edge-only origin, trusted proxy allowlist, stripped and overwritten forwarding headers, canonical host and origin | Direct-origin denial, forged-header, host-confusion, redirect, and callback-URL tests |
| SQL injection | ORM by default, parameterized exceptional SQL, allowlisted identifiers, least-privilege DB roles | Static ban, unit/integration negative tests, focused raw-query review |
| Broken object or function authorization | Central server-side authorization, ownership and capability checks, deny by default | Unit and integration denial matrix; browser cross-account tests |
| Session hijacking or fixation | HTTPS/HSTS, opaque cookie session, Secure/HttpOnly/host scope, rotation, expiry, revocation, step-up | Cookie/config review, runtime rotation and revocation tests |
| Brute force, stuffing, spraying, OTP abuse | Independent shared rate-limit buckets, progressive challenge, generic errors, MFA/passkey or step-up, anomaly signals | Multi-axis abuse tests and alert verification |
| XSS and CSRF | Safe rendering, sanitization exception process, CSP, origin and Fetch Metadata validation, CSRF tokens where needed, no state change by GET | Static review and browser exploit regression tests |
| Malicious upload | Direct quarantine upload, verified type/size/hash, scanning, re-encoding where suitable, private authorization | Integration tests for rejection, scan failure, promotion, and access |
| SSRF | Outbound allowlist, safe resolution, private-range block, timeout, redirect and response-size limits | Unit and integration destination-bypass tests |
| Forged or replayed webhook | Signature, timestamp, inbox dedupe, idempotency, reconciliation | Provider fixture and replay tests; provider sandbox verification |
| Secrets or private-data leakage | Managed secrets, least privilege, redacted logs, DTOs, private storage, retention | Secret scan, logging tests, access review, deletion exercise |
| Encryption-key loss or compromise | Managed KMS/HSM, envelope encryption, separated keys and data, versioned rotation, revocation, recovery | Configuration review, key rotation and restore test, compromise and deletion exercise |
| Cache poisoning, deception, or stampede | Canonical bounded keys, public-only policy, response classification, coalescing, stale limits, hot-key budgets | Poisoning/deception negative tests, concurrent-miss and hot-key load tests |
| Supply-chain compromise | Frozen lockfile, minimum release age, immutable workflow actions, audit, provenance review | CI evidence and reviewed dependency diff |
| Privileged or support abuse | Least privilege, step-up, reason codes, dual-control where warranted, append-only audit | Capability matrix tests and audit review |

## 6. Edge, DDoS, bots, and cost abuse

The initial Vercel direction may use the provider's network DDoS protection, firewall, WAF, bot controls, and challenge mode. These are shared-responsibility controls and must be inspected on the actual selected plan before launch. Provider availability does not prove that application-specific or spend-exhaustion attacks are controlled.

Required layers:

1. Put every public origin behind the approved edge; do not expose an alternate unprotected application origin.
2. Restrict origin ingress to the approved edge path. Trust forwarding information only from an explicit proxy chain that strips and overwrites client-supplied `Forwarded`, `X-Forwarded-*`, and equivalent platform headers.
3. Derive client IP, scheme, host, origin, redirect targets, callback URLs, and absolute URLs from one canonical server-owned policy. Reject unknown hosts, conflicting proxy metadata, and direct-origin traffic; never let a user-supplied host select a security boundary or generated URL.
4. Apply managed WAF rules and narrowly reviewed custom rules.
5. Use separate rate-limit policies for:
   - public discovery and search;
   - account creation and identity callbacks;
   - login, OTP request, OTP submission, recovery, and resend;
   - trip, listing, request, and discussion publication;
   - checkout, payment initiation, refund, and payout changes;
   - evidence upload and download;
   - reports, disputes, moderation, support, and administrator actions.
6. Combine relevant keys such as network or IP reputation, account, session or device, action, and target resource. A single IP-plus-username bucket is insufficient.
7. Store authoritative counters in a shared system or enforce them at the edge. Process-local counters are test-only.
8. Use progressive delay, challenge, temporary deny, and risk review. Avoid permanent account lockout as the only response because attackers can use it to deny service to victims.
9. Bound request bodies, field sizes, array counts, page sizes, upload counts, provider calls, database time, and execution time.
10. Apply global circuit breakers, provider-spend thresholds, alerts, and operator kill switches to expensive or dangerous operations.
11. Preserve essential read access where safe while disabling nonessential writes or provider calls during an incident.

Security-dependency outages use this minimum failure policy:

| Route or action class | Required behavior when a security dependency is unavailable |
|---|---|
| Public cacheable discovery | Serve an approved bounded stale public projection or fall back to bounded authoritative reads; never expose private data |
| Public publication or discussion write | Reject or pause when required shared rate-limit, risk, moderation, authorization, audit, or idempotency controls are unavailable |
| Login, OTP, recovery, session change | Fail closed when identity, rate-limit, risk, session, notification, or audit guarantees required by the action cannot be established |
| Checkout, refund, payout, bank change, protected evidence | Fail closed and preserve a recoverable pending state; never infer success from a timeout or queue acceptance |
| Administrator, support, or moderation action | Fail closed when assurance, authorization, reason, audit, or dual-control requirements cannot be recorded |

Every dependency receives an owner, timeout, circuit breaker, alert, safe external error, recovery path, and explicit decision whether read-only degradation is permitted. “Allow on error” is forbidden unless this document names the exact public read case.

The baseline follows the multi-layer availability approach in the [OWASP denial-of-service guidance](https://cheatsheetseries.owasp.org/cheatsheets/Denial_of_Service_Cheat_Sheet.html) and the resource-budget controls in [OWASP API4:2023](https://owasp.org/API-Security/editions/2023/en/0xa4-unrestricted-resource-consumption/).

## 7. Authentication and session security

NitipCuy uses a reviewed authentication provider or library rather than implementing password authentication.

Required session properties:

- opaque, high-entropy identifiers with no personal or business meaning;
- cookies use `Secure`, `HttpOnly`, a host-only `__Host-` name where compatible, an appropriate `SameSite` policy, path `/`, and no broad domain scope;
- authentication tokens and session identifiers never appear in URLs, client-readable local storage, analytics, or logs;
- HTTPS is mandatory and HSTS is enabled after domain and subdomain readiness;
- session identifiers rotate after authentication, recovery, privilege change, step-up, and suspicious account events;
- idle and absolute expiration are explicit;
- logout and account restriction revoke server-side state;
- account-level session versioning can invalidate all sessions;
- users can review and revoke active sessions or devices;
- high-impact operations require recent authentication or step-up;
- protected commands perform a database-backed authorization check close to the data, not only a page or middleware check;
- external error messages do not reveal whether an account, provider subject, phone, email, or recovery target exists.

The system treats a session identifier as untrusted input even after signature or storage validation. Requirements follow the [OWASP session-management guidance](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html) and the [Next.js authentication guidance](https://nextjs.org/docs/app/guides/authentication).

The merged issue #5 slice implements the narrow source and local-integration boundary in ADR 0005: Google-only OIDC code flow through `openid-client`, exact issuer and audience, state plus a distinct digest-only browser-binding cookie, nonce, S256 PKCE, safe local return paths, one-use encrypted OAuth attempts, digest-only opaque PostgreSQL sessions, the `__Host-` cookie contracts, rotation-family reuse revocation, idle and absolute expiry, account-version invalidation, and exact-session revalidation inside protected transactions. A callback prepared in another browser fails closed, and Google login mints only `BASE` assurance. No production step-up, recovery, shared abuse control, managed-key custody, provider configuration, or browser verification exists.

## 8. Credential, OTP, and automation attacks

Brute force, credential stuffing, password spraying, account enumeration, OTP flooding, and recovery abuse require independent controls:

- independent network, account, session or device, action, and destination buckets;
- attempt ceilings, progressive backoff, temporary holds, challenges, and anomaly review;
- OTPs are single-use, short-lived, purpose-bound, attempt-limited, and invalidated on success;
- resend cooldowns and per-destination spending limits;
- recovery cannot silently bypass stronger authentication;
- administrator, support, moderation, payment, payout, refund, bank-detail change, factor replacement, and recovery flows require phishing-resistant MFA such as passkeys where feasible, or a separately approved high-assurance factor plus recent step-up;
- provider selection must satisfy that assurance contract; missing provider capability cannot be treated as an acceptable downgrade;
- factor enrollment, replacement, and recovery require reauthentication, risk checks, user notification, session revocation where warranted, append-only audit, and a recovery path no weaker than the protected account's approved assurance;
- login and recovery responses remain generic while internal audit preserves reason codes;
- alerts cover distributed low-and-slow attempts, not only single-IP spikes.

MFA or phishing-resistant authentication is the strongest general defense against reused credentials, but it does not remove the need for automation controls. See [OWASP multi-factor authentication](https://cheatsheetseries.owasp.org/cheatsheets/Multifactor_Authentication_Cheat_Sheet.html), [credential-stuffing prevention](https://cheatsheetseries.owasp.org/cheatsheets/Credential_Stuffing_Prevention_Cheat_Sheet.html), and [bot-management guidance](https://cheatsheetseries.owasp.org/cheatsheets/Bot_Management_and_Anti-Automation_Cheat_Sheet.html).

## 9. Authorization

Every protected command verifies:

1. provider identity resolved to an active internal account;
2. active, non-revoked session and required assurance;
3. required capability;
4. resource ownership or transaction role;
5. current aggregate state;
6. account, seller, moderation, payment, and risk restrictions;
7. idempotency and concurrency conditions.

Missing context denies. Resource IDs from the client never imply ownership. List and detail queries apply the same authorization rules as mutations. Data-access functions return minimal DTOs rather than persistence records. Administrator and support routes require explicit capabilities, step-up, reason codes, and audit.

Tests must cover same-role cross-account access, guessed identifiers, stale sessions, revoked capabilities, hidden resources, state conflicts, and administrator boundaries.

## 10. SQL injection and database safety

Application persistence uses generated Prisma operations by default. The following are forbidden in ordinary application source:

- string-concatenated or interpolated SQL;
- `$queryRawUnsafe`;
- `$executeRawUnsafe`;
- untrusted values passed through `Prisma.raw`;
- user-selected table, column, sort, or operator text without an allowlist.

Exceptional raw SQL must use tagged parameterization, allowlisted identifiers, a focused review, negative tests, and a documented reason.

Additional controls:

- separate least-privilege runtime and migration identities;
- no application permission to create roles, databases, or unrestricted schemas;
- database constraints repeat critical identity, uniqueness, amount, and state rules;
- statement, transaction, and lock timeouts;
- cursor pagination and bounded result sets;
- slow-query monitoring and reviewed indexes;
- generic external database errors;
- no production credentials in preview, tests, source, or logs.

These controls follow the [OWASP SQL injection prevention guidance](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html). Prisma parameterization helps only when its safe APIs are used correctly; see [Prisma raw-query safety](https://www.prisma.io/docs/orm/prisma-client/using-raw-sql/raw-queries).

## 11. XSS, CSRF, redirects, and browser policy

- React escaping is the default rendering path.
- `dangerouslySetInnerHTML`, raw HTML from users, and unsanitized rich text are forbidden unless a focused threat review selects and tests an allowlist sanitizer.
- A strict content security policy is rolled out in report-only mode, violations are reviewed, and enforcement is enabled before protected production flows.
- Required headers include HSTS when ready, `X-Content-Type-Options: nosniff`, clickjacking protection through CSP `frame-ancestors`, a restrictive referrer policy, and a minimal Permissions Policy.
- State-changing operations never use `GET`.
- Cookie-authenticated state changes validate origin and Fetch Metadata and use the framework's CSRF mechanism or a server-bound CSRF token where necessary.
- `SameSite` is defense in depth, not the only CSRF control.
- Redirect destinations and CORS origins use exact allowlists.
- Server Actions retain Next.js origin checks, but sensitive commands still use the application authorization and CSRF design.

See the [OWASP CSRF guidance](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html), [OWASP CSP guidance](https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html), and [Next.js CSP guidance](https://nextjs.org/docs/app/guides/content-security-policy).

## 12. Evidence and file security

Raw evidence never becomes public merely because a public trip or review exists.

Required lifecycle:

```text
authorized upload intent
  -> short-lived narrowly scoped signed upload
  -> private quarantine
  -> server-observed size and cryptographic hash
  -> actual-type, dimension, count, and malware checks
  -> optional safe re-encoding or content disarm
  -> accepted private evidence or rejected quarantine object
  -> retention expiry and verified deletion
```

The platform never trusts the client file name, extension, MIME type, claimed hash, path, or scan status. Object keys are server-generated. Access is ownership- and case-authorized through short-lived downloads. Scanners failing or timing out fail closed. Logs contain references and reason codes, not raw content or signed URLs.

Issue #3 now implements and source-tests only the provider-neutral application seam and a process-local fixture for this lifecycle. Raw fixture bytes and false MIME or digest claims never cross the application port; the adapter computes the digest, observes length, detects a bounded image signature, denies replacement and post-acceptance reuse, requires a clean scan bound to the same digest, and exercises retention deletion. This does not implement authenticated ownership or case authorization, real signed uploads, object-store controls, robust image decoding or dimensions, malware scanning, re-encoding, duplicate-image review, durable retention jobs, backups, logging integration, or production deletion verification.

For fixed-price Shop for me orders, the buyer-visible evidence requirement is an accepted photograph of the actual purchased item, not routine disclosure of the seller's receipt or acquisition cost. Any receipt collected for an explicitly actual-cost contract or a proportionate dispute, fraud, or compliance purpose is private, purpose-limited, retention-bounded, redacted where possible, and never placed in a public projection.

The server-observed cryptographic hash binds evidence metadata to exact accepted bytes. It does not prove that the item is authentic, that a stated price was paid, that payment succeeded, that contents are lawful, or that the image belongs to the claimed event without the other order, upload-intent, classification, timing, duplicate-detection, scan, and review controls.

Evidence-gated transitions fail closed. An order cannot become `PURCHASED` until its actual-product photograph is accepted, and cannot become `COLLECTED` until its collection photographs and measured weight are accepted. A material Carry my item variance requires customer approval before continued fulfilment.

See the [OWASP file-upload guidance](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html).

## 13. SSRF and external-provider boundaries

Outbound server requests:

- use provider-specific destination allowlists and HTTPS;
- resolve and validate destinations against private, loopback, link-local, multicast, and metadata ranges;
- revalidate after redirects and limit or disable redirects;
- set connection, response, and total timeouts;
- bound response size and content type;
- never accept a general user-provided URL for server retrieval;
- isolate credentials by provider and purpose.

Provider callbacks:

- have strict body-size and content-type limits;
- validate the provider signature and timestamp before interpretation;
- reject stale or replayed messages;
- preserve a restricted immutable inbox record;
- deduplicate by provider and event identity;
- map to an authorized, transaction-bound, idempotent command;
- reconcile against provider truth rather than trusting a browser redirect.

See the [OWASP SSRF prevention guidance](https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html).

## 14. Secrets, privacy, logs, and dependencies

- Minimize collection and retention before relying on encryption. Classify each private field and record its purpose, authority, retention, deletion, and backup behavior.
- Require provider encryption in transit and at rest for PostgreSQL, private object storage, queues, managed control state, and backups.
- Use threat modelling to select high-impact identity, bank, contact, address, verification, payment-reference, and evidence fields for application-level envelope encryption.
- Keep cryptography in outer infrastructure adapters behind provider-independent ports. Use approved authenticated encryption and managed KMS, HSM, or key-vault wrapping; domain records retain key identifiers and versions, never raw keys.
- Separate data-encryption keys, key-encryption keys, application secrets, encrypted data, and backups by purpose, access, and environment. Do not store plaintext keys beside the protected data.
- Document and rehearse generation, distribution, use, rotation, re-wrapping, revocation, suspected-compromise recovery, key backup, encrypted-data restore, retention expiry, verified deletion, and cryptographic erasure.
- Keep retained encrypted backups recoverable for their approved lifetime, while ensuring deletion workflows address live rows, objects, replicas, indexes, caches, derived projections, logs, and backup-expiry schedules.
- Do not invent cryptographic algorithms or silently change encryption formats. Version formats and retain backward decryption only for the approved migration window.
- Secrets live in an approved managed secret store and are separated by environment and provider purpose.
- Access follows least privilege and rotation; revocation is tested before launch.
- Preview and test environments receive no production credentials or private production data.
- Logs are structured, access-controlled, retention-bounded, and redact tokens, cookies, addresses, identity documents, chat, evidence content, payment details, signed URLs, and raw callbacks.
- Audit records preserve actor, capability, action, target, reason, time, request correlation, result, and approved before/after references without becoming a second private-data dump.
- Dependencies use a frozen lockfile, minimum-release-age policy, reviewed overrides, production audit, and explicit provenance review.
- CI actions use immutable reviewed commits and least privilege.
- Secret scanning, static analysis, and dependency review become pull-request gates before protected functionality is introduced.

The data and key lifecycle follows the [OWASP Cryptographic Storage](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html), [Key Management](https://cheatsheetseries.owasp.org/cheatsheets/Key_Management_Cheat_Sheet.html), and [Secrets Management](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html) guidance. Provider encryption claims remain unverified until the selected live configuration, identities, key policy, rotation, restore, and deletion behavior are inspected.

## 15. Monitoring, incident response, and recovery

Security telemetry must expose:

- authentication and recovery outcomes by reason category;
- rate-limit, challenge, WAF, and bot decisions;
- authorization denials and privileged actions;
- upload rejections and scan failures;
- callback signature, replay, and reconciliation failures;
- unusual payment, refund, payout, report, and moderation activity;
- application error, latency, saturation, database, queue, provider, and spend signals.

Alerts require an owner, threshold, severity, response action, and tested route. Incident procedures must cover traffic restriction, feature and provider kill switches, session and credential revocation, evidence preservation, customer and authority notification assessment, clean recovery, and retrospective fixes.

Backups are not accepted until restore is tested. RPO and RTO require BurinSN approval before real transactions.

## 16. Required verification gates

Before protected preview:

- threat model and data inventory reviewed;
- trusted-proxy, direct-origin denial, canonical host, forwarded-header, redirect, and absolute-URL tests;
- central authorization denial tests;
- safe-query static rule and tests;
- session, privileged MFA, factor-recovery, CSRF, XSS, redirect, SSRF, callback, and upload negative tests appropriate to implemented flows;
- closed-order-window, capacity, seller-eligibility, evidence-gated transition, reused-image, private-receipt, and Carry my item variance denial tests as those flows are introduced;
- dependency-outage tests proving each protected action fails closed and each allowed public-read degradation stays public and bounded;
- encryption-format, KMS authorization, rotation, re-wrapping, key-unavailability, log-redaction, retention, and deletion tests appropriate to stored private data;
- secret, dependency, static, and workflow scans;
- logging-redaction tests.
- every material issue classifies guarded Strix applicability; a required runnable-target assessment reaches independent finding triage or verified remediation before merge, while a non-required classification records a concrete rationale and hostile source-review evidence.

Before closed pilot:

- complete applicable ASVS traceability;
- runtime cookie, header, WAF, rate-limit, identity, database, storage, and provider configuration review;
- runtime privileged-assurance, trusted-proxy, canonical-host, managed-key, backup-encryption, rotation, restore, and deletion configuration review;
- cross-account browser tests;
- isolated ramp, spike, soak, recovery, and abuse tests;
- backup restore, session revocation, provider kill switch, and incident exercise;
- independent security review of high-impact flows;
- no unresolved critical or high finding without explicit documented risk acceptance.

Security testing against an external or production target requires separate explicit authorization. Strix may be used only through the guarded project process with an exact target, dry-run review, budget, separate execution instruction, and additional production approval. The review-governance workflow validates only declared progress and never launches a scanner. Generated findings and fixes remain untrusted until independently reviewed and verified.

## 17. Current status

Designed:

- this baseline;
- deny-by-default authorization direction;
- trusted edge, canonical request interpretation, and explicit security-dependency failure policy;
- mandatory privileged assurance and non-downgrading recovery;
- private-data encryption, managed-key lifecycle, backup, restore, and deletion requirements;
- public-cache poisoning, deception, stampede, and hot-key controls;
- private evidence and provider callback boundaries;
- dependency and workflow supply-chain controls;
- pooled PostgreSQL and modular-monolith direction.

Implemented and source-tested for issue #3, merged issue #5, and the issue #9 working tree:

- strict public-trip runtime invariants;
- Google OIDC protocol fixtures covering exact scopes, issuer, audience, signature, expiry, state, nonce, and PKCE denial without real provider credentials;
- no password persistence, no email persistence or linking, and no provider-token persistence;
- encrypted one-use OAuth attempts, separate digest-only browser binding, and safe local redirect validation;
- opaque digest-only sessions with base-only minting, rotation, expiry, revocation, account versioning, and rotated-token family invalidation;
- exact persisted-session, assurance, account, capability, and ownership revalidation inside protected PostgreSQL transactions;
- exact-origin, same-origin Fetch-Metadata, JSON-content-type, and body-size checks on protected HTTP mutations;
- parameterized Prisma persistence, database ownership constraints, bounded queries, and generic external route errors;
- disposable PostgreSQL tests for cross-account denial, forged assurance denial, revoked-session denial, rollback, concurrency, projection privacy, and OAuth/session failure paths;
- no production secrets or real provider calls;
- frozen dependency graph, production audit, and immutable workflow action references.
- versioned issue/PR review evidence, exact-head DRY gating, guarded-Strix state consistency, and adversarial validator fixtures merged through issue #7 and pull request #8;
- one canonical request-perimeter authority with explicit loopback-only direct mode and HTTPS trusted-proxy mode, exact forwarded metadata, timing-safe bounded edge proof, generic fail-closed errors, and downstream stripping of proof and forwarding headers;
- server-owned Google callback reconstruction, fresh per-request nonce CSP without production `unsafe-inline` or `unsafe-eval`, forced dynamic rendering, defensive browser headers, HSTS output for HTTPS policy, and private auth/API plus hostile-denial `no-store`;
- source-tested hostile host, forwarding, ambiguity, proof, callback, internal-header, CSP, cache, and matcher cases plus a built local runtime gate in direct and simulated trusted-proxy modes.

Not implemented or verified:

- real Google configuration, provider compatibility, production identity, production cookies, or managed runtime keys;
- privileged MFA, privileged-session minting, factor enrollment, or recovery controls;
- provider-verified trusted-proxy header overwrite, ingress restriction, alternate-origin denial, shared rate-limiting, WAF, bot, public-cache safety, or DDoS configuration;
- production database identity, least-privilege grants, migration runner, backup, or independent safe-query static scan;
- application-level encryption, managed keys, key rotation, encrypted-backup restore, or verified deletion;
- private upload quarantine or scanner;
- complete protected-command authorization matrix beyond profile, trip publication, and public discussion;
- provider callbacks, payment, logistics, ledger, reconciliation, or worker;
- security monitoring, incident response, backup restore, load tests, browser automation, real-browser testing, AI-driven dynamic assessment, or penetration testing. Issue #9 is explicitly Strix `NOT REQUIRED` / `NOT APPLICABLE` under BurinSN's zero-external-Strix-AI decision: no hosted Strix model is approved to receive project context, no verified local Strix model is configured, no Strix target or run exists, and Strix sent no code or runtime context to an external LLM provider. The pre-existing CodeRabbit GitHub integration separately processed the PR diff for summaries and release notes; it produced no independent review object or security finding. The issue's highest evidence remains hostile source review plus local built-runtime testing; real preview, provider edge, Google browser flow, private-data, payment, upload, or materially expanded attack-surface work must classify Strix afresh.
