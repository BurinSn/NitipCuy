# NitipCuy System Architecture

Status: Accepted direction; Stage 1 account-to-public-Q&A slice implemented

Last reviewed: 2026-08-07

Binding decisions:

- [ADR 0003: Web architecture and application foundation](../decisions/0003-web-architecture-and-application-foundation.md)
- [ADR 0004: Security, resilience, and scale baseline](../decisions/0004-security-resilience-and-scale-baseline.md)

## 1. Architectural objective

NitipCuy must make jastip discovery and transactions explicit, evidence-backed, and safer without turning BurinSN into the merchant, importer, customs broker, carrier, or seller for every item.

The architecture therefore protects seven properties:

1. domain rules remain independent of frameworks and providers;
2. public discovery never leaks private identity, address, order, or evidence data;
3. every protected mutation is authorized, idempotent, attributable, and auditable;
4. payment and logistics states are reconciled rather than trusted from redirects or callbacks;
5. production provider uncertainty does not block mock-backed platform development.
6. public and protected work is bounded, observable, recoverable, and safe to operate across multiple web instances;
7. security claims distinguish accepted design from implemented, runtime-tested, provider-verified, load-tested, and incident-tested controls.

## 2. Runtime shape

```text
Browser
  |
  v
Edge network / DDoS mitigation / WAF / bot controls
  |
  v
Next.js App Router on Node.js 24
  |-- public server-rendered discovery
  |-- protected route handlers and server actions
  |-- request validation and presentation
  |-- server-only composition root
  |
  v
Application use cases
  |
  +--> Domain
  |
  +--> Repository / transaction ports ------> PostgreSQL adapter
  +--> Identity port -----------------------> identity adapter
  +--> Evidence lifecycle port ------------> quarantine, scan, and private-object adapters
  +--> Payment port ------------------------> DOKU candidate adapter
  +--> Logistics port ----------------------> Biteship candidate adapter
  +--> Audit / outbox ports ----------------> PostgreSQL adapter
```

Only the web application is deployable in Stage 1. Domain, application, and adapters are packages, not network services.

The first production shape must be stateless and horizontally scalable. Cross-request session, idempotency, rate-limit, cache, transaction, and job state may not rely on one web process. Durable asynchronous work requires a transaction-bound outbox and retrying worker. The full runtime and extraction rules live in [Scalability and resilience](scalability-and-resilience.md).

## 3. Source layout and dependency rules

```text
apps/
  web/
    src/app/          Next.js delivery
    src/server/       composition and server-only fixtures

packages/
  domain/             entities, value objects, invariants
  application/        use cases and ports
  adapters/           in-memory and external implementations
```

Allowed imports:

| Source | May import |
|---|---|
| `packages/domain` | JavaScript and TypeScript language/runtime primitives only |
| `packages/application` | `packages/domain` |
| `packages/adapters` | `packages/application`, `packages/domain`, adapter SDKs |
| `apps/web` delivery | application contracts and domain presentation types |
| `apps/web` composition | application use cases and concrete adapters |

Forbidden imports:

- domain to application, adapters, React, Next.js, Prisma, environment variables, or provider SDKs;
- application to concrete adapters, React, Next.js, Prisma, or provider SDKs;
- client components to server composition, database, secrets, private storage, provider SDKs, or application mutation internals;
- provider callbacks directly to domain repositories or ledger tables.

Package manifests and `scripts/dependency-boundaries.mjs` now enforce the direction together. The gate parses governed TypeScript and JavaScript source with the pinned TypeScript compiler API and rejects:

- disallowed, unknown, undeclared, non-`workspace:` or deep workspace dependencies and imports;
- cross-project relative imports and relative or aliased source-root escapes;
- forbidden outward edges expressed through static imports, exports, `import type`, import-type expressions, triple-slash references, dynamic imports, `require`, `require.resolve`, or `module.require`;
- non-static dynamic or require specifiers that cannot be proven safe;
- external runtime dependencies or Node.js builtins in domain and application production source;
- concrete adapter imports outside web server composition;
- client imports of server aliases, Node.js builtins, `server-only`, or runtime application and adapter modules;
- symlinks inside governed source roots.

The gate also verifies all four package manifests, requires external imports in adapter and web source to be declared, and requires production runtime imports to use a runtime dependency section rather than `devDependencies`. Approved Vitest and Node.js test tooling is isolated to test files. `pnpm check:boundaries` scans the real tree, `pnpm test:boundaries` exercises adversarial fixtures, and `pnpm check` runs both through the existing hosted application-quality workflow.

## 4. Bounded contexts

### Identity and trust

Owns:

- internal account identity;
- provider-subject mapping;
- contact verification;
- seller eligibility and verification status;
- capability grants, restrictions, and session invalidation;
- linked-account risk signals.

Does not own orders, reviews, or payment settlement.

### Marketplace discovery

Owns:

- jastipper profile presentation;
- trip drafts and publication;
- origin and destination IANA timezones;
- source-service start and end, ordering open and close, transport departure, estimated arrival, capacity, service modes, and delivery terms;
- product offers and open-request availability;
- public trip, listing, and request discussion.

Does not own private addresses, paid commitments, or settlement.

### Ordering

Owns:

- customer request;
- seller acceptance or rejection;
- accepted commercial snapshot;
- private delivery method and address reference;
- order lifecycle and cancellation intent.
- private jastipper and customer order-dashboard projections.

An order preserves the accepted terms. Later trip edits do not silently rewrite committed orders.

### Fulfilment and evidence

Owns:

- purchased-item photograph, collection photograph, weight, package, dispatch, pickup, delivery, and purpose-limited private receipt evidence;
- evidence requirements by mode and category;
- QR and OTP handover evidence;
- immutable evidence metadata and private-blob references.

File bytes live in private object storage. The database stores metadata, hashes, classification, ownership, and retention state.

For fixed-price Shop for me, an accepted actual-product photograph gates the `PURCHASED` transition while routine buyer-visible receipt disclosure is forbidden. A receipt may be private evidence only for an accepted actual-cost pricing formula or a proportionate dispute, fraud, or compliance purpose. For Carry my item, accepted collection photographs and measured weight gate `COLLECTED`; material variance requires customer approval.

### Payments and ledger

Owns:

- payment intent and held state;
- internal balanced ledger;
- platform fee;
- release, split, refund, chargeback, reserve, payout, and reconciliation state;
- provider event inbox and idempotency.

Provider success is evidence, not authoritative internal settlement.

### Logistics

Owns:

- declared delivery choice and cost basis;
- quote evidence;
- dispatch registration;
- tracking events;
- delivery evidence and exception state.

Logistics does not decide order settlement by itself.

### Moderation and disputes

Owns:

- content and transaction risk cases;
- warnings, restrictions, holds, suspensions, bans, and appeals;
- dispute evidence and resolution commands;
- lawful escalation and audit history.

Moderation commands may block payment release but cannot directly rewrite ledger rows.

### Reputation

Owns:

- transaction eligibility for review;
- dimension ratings;
- review moderation and challenge;
- aggregate reputation views.

Only completed protected orders can create verified reviews.

## 5. Authoritative trip offer and public projections

The future authoritative `TripOffer` aggregate owns:

- jastipper account and eligibility reference;
- draft, review, publication, pause, closure, cancellation, moderation, and archive state;
- origin and destination with IANA timezones;
- source-service, ordering, transport-departure, and estimated-arrival instants;
- service modes, capacity, product and request terms, delivery terms, and revision;
- the facts needed to decide whether a new request may be accepted.

Every new request or checkout evaluates the authoritative offer with the platform clock, current capacity, seller eligibility, and risk state. A scheduled job may update presentation state, but stale UI or projection state cannot authorize a commitment.

`PublishedTrip` is a rebuildable, read-only public projection. It contains only publishable route, time-window, capacity-summary, rate-summary, delivery-summary, rating, and moderated-discussion fields. It does not own capacity reservations, accepted commercial terms, customer identities, addresses, private evidence, orders, payments, moderation reasons, or settlement. It is never accepted as mutation or authorization input.

The public closed-trip history is another projection of the authoritative trip and eligible terminal orders. It may show completed-trip and completed-protected-order aggregates plus verified reviews, but not private order rows or evidence.

Jastipper and customer order dashboards are private projections built from authoritative order, evidence, logistics, payment, and dispute state. Dashboard labels may simplify internal states but cannot create or infer a transition.

## 6. Initial domain proof

Issue #3 implements one framework-free published-trip model with:

- a validated trip ID;
- different origin and destination;
- valid origin and destination IANA timezones;
- an exact source-service window;
- an exact ordering-open and ordering-close window that supports advance PO and closes no later than source availability;
- the current public `requestOpenAt` and `requestDeadline` fields are the projection's ordering-open and ordering-close instants; the future authoritative aggregate uses the explicit `orderOpenAt` and `orderCloseAt` terms;
- an origin-local departure date paired with an exact timezone-bearing departure timestamp;
- request deadline before the exact departure instant;
- estimated arrival no earlier than departure;
- at least one supported service mode;
- non-negative remaining capacity;
- seller-defined rate and delivery summaries;
- valid rating bounds;
- public question IDs unique within a trip;
- public questions sorted oldest to newest by their actual instants across timezone offsets.

Date-only and timezone-bearing timestamp values receive strict runtime calendar, clock, and timezone-offset validation. TypeScript unions do not replace runtime validation for delivery, persistence, or provider inputs.

The proof intentionally contains public simulated data only. Its `PublishedTrip` is the public projection described above, not the future authoritative aggregate. It does not contain an account, address, private chat, order, payment, capacity reservation, real seller, real review, or provider record.

## 7. Persistence direction

PostgreSQL is authoritative. Prisma lives only in the isolated database adapter; it does not enter the domain or application core.

Core rules:

- use database constraints for identities, uniqueness, non-nullability, amounts, and state references;
- use transactions for each consistency boundary;
- use optimistic or explicit locking where concurrent acceptance, capacity, payment, release, refund, or moderation can conflict;
- use an inbox table for provider event deduplication;
- use an outbox table for reliable post-commit work;
- use append-only audit and financial records;
- keep current projections separate from immutable history;
- never use destructive schema synchronization in production;
- migrations are reviewed source files and run separately from application startup;
- use expand-and-contract releases: additive schema and compatible code first, bounded backfill and observed cutover next, destructive cleanup only after the rollback and version-skew window closes;
- keep old and new web and worker versions compatible throughout rolling deployment, including queued outbox payloads and retries.

Issue #3 deliberately had no transaction implementation. The removed callback-only transaction port did not provide scoped repositories or append-only writers and therefore could not enforce commit, rollback, isolation, or shared connection use.

Issue #5 introduces the first database-backed transaction-scoped unit of work. Its account/profile/trip/public-discussion scope supplies repositories, audit, and outbox writers bound to the same PostgreSQL transaction. Later order slices must add ledger and inbox writers without combining scoped and independently constructed write adapters. Authoritative state, balanced financial entries when applicable, success audit, and required outbox records commit together or roll back together. Provider and object-storage network calls occur outside the transaction through explicit pending and reconciliation states.

Initial target:

- PostgreSQL 18 compatible schema;
- Neon managed PostgreSQL in Singapore;
- pooled runtime connection;
- direct migration connection;
- separate development, test, preview, and production databases or branches;
- a literal test-environment acknowledgement before any destructive test reset.

Production database creation is not authorized by this document.

Runtime database access must also use separate least-privilege application and migration identities, explicit connection budgets, statement and transaction timeouts, bounded queries, and reviewed indexes. Prisma-generated operations are the default. Unsafe raw-query APIs are forbidden in application source; exceptional raw SQL requires tagged parameterization, allowlisted dynamic identifiers, focused tests, and review.

## 8. Identity and authorization

### Identity

ADR 0005 implements the first narrow version of this boundary. The system stores:

- internal `AccountId`;
- provider name;
- immutable provider subject;
- verification and assurance metadata;
- contact references;
- session version or revocation state.

It does not store passwords. The MVP sign-in adapter is Google OIDC authorization code flow through `openid-client`; exact issuer plus immutable subject resolves an internal account. A verified email is required at authentication time but is neither persisted nor used for account linking. Real Google configuration remains unapproved and unverified.

NitipCuy persists only a digest of each opaque browser-session token. Protected use cases re-check the exact active session, account session version, assurance, expiry, account state, ownership, and applicable capability inside the authoritative transaction. The Google callback can mint only `BASE` assurance. No privileged-assurance minting or recovery adapter exists yet.

The application request perimeter owns canonical origin and proxy interpretation before any route executes. Explicit `LOCAL_DIRECT` mode accepts only an exact loopback host and scheme. Every non-local origin requires `TRUSTED_PROXY`, HTTPS, exact forwarded host/protocol/port values, and a timing-safe edge proof; ambiguous or missing evidence fails closed. Validated forwarding and proof headers are stripped before delivery code receives server-owned canonical-origin and nonce metadata. The Google callback is reconstructed from that canonical context rather than a request-controlled URL. This source and local-runtime contract does not prove that a hosting provider strips client headers, injects the proof, or blocks alternate origins.

Seller verification is not the same as login. It may include liveness, identity, bank ownership, provider KYB, and platform trust review.

Administrator, support, moderation, payment, payout, refund, bank-detail change, factor replacement, and account-recovery flows require an approved phishing-resistant MFA or high-assurance step-up contract. Identity-provider selection must satisfy that contract; unavailable capability is not a reason to downgrade it. Recovery must not be weaker than the assurance it replaces.

### Authorization

Every protected command evaluates:

1. authenticated internal account;
2. active session;
3. account and profile restrictions;
4. required capability;
5. resource ownership or transaction role;
6. current aggregate state;
7. risk or moderation hold;
8. idempotency and concurrency conditions.

Missing context denies. Client-side navigation, hidden controls, route names, or claimed role fields never authorize a command.

## 9. Public and private data boundaries

Public:

- display name;
- published trip route and dates;
- declared capacity and service modes;
- seller-defined public rate summary;
- public delivery summary;
- eligible rating aggregate;
- public questions and answers after moderation.

Private:

- legal identity and verification evidence;
- phone, email, device, bank, and risk signals;
- exact address and pickup details;
- private chat;
- receipts containing personal data;
- raw evidence;
- payment, payout, dispute, and moderation details;
- internal audit and enforcement reasons.

Private data is fetched only after authorization and is never embedded in public cache entries or static fixtures.

Provider encryption at rest and in transit is mandatory for private persistence and backups. Threat modelling selects high-impact identity, bank, contact, address, verification, payment-reference, and evidence fields for application-level envelope encryption through an outer managed-key adapter. The domain may carry key identifiers and format versions but never raw keys or provider cryptography.

## 10. Provider port rules

Every provider adapter must:

- validate signatures and timestamps;
- store the raw event in a restricted inbox before interpretation;
- deduplicate by provider and event identity;
- map provider state to an application command;
- execute state changes through the authoritative use case;
- record reconciliation and retry state;
- log identifiers and reason codes without sensitive content;
- fail closed on unknown or contradictory provider state.

The DOKU and Biteship candidates do not change these rules.

## 11. Background work

Do not start untracked promises after an HTTP response.

Stage 1 has no background worker. Before background work is required:

- write a transaction-bound outbox record;
- select a retrying worker or managed workflow mechanism;
- define idempotency, poison-message, alert, and replay behavior;
- keep one authoritative status in PostgreSQL;
- make operator recovery explicit.

Extract a worker deployment only when duration, throughput, or availability evidence requires it.

## 12. Security baseline

The binding detail is [Security architecture](../security/security-architecture.md). The complete production web application targets OWASP ASVS 5.0 Level 2, with additional risk-based controls for payment, settlement, moderation, support, administrator, identity-evidence, and recovery operations.

Required properties include:

- edge DDoS mitigation plus WAF, bot controls, shared multi-axis rate limits, request budgets, provider-spend ceilings, circuit breakers, and operator kill switches;
- an edge-only origin, explicit trusted-proxy chain, overwritten forwarding headers, canonical host/origin/absolute-URL policy, and tested direct-origin denial;
- explicit dependency-outage behavior: protected identity, transaction, evidence, moderation, support, and administrator actions fail closed when required security controls are unavailable;
- external reviewed authentication, secure opaque cookie sessions, rotation, expiry, revocation, mandatory privileged phishing-resistant MFA or approved high-assurance step-up, non-downgrading recovery, generic errors, and server-side deny-by-default authorization;
- layered runtime schemas, domain invariants, parameterized persistence, database constraints, least privilege, query timeouts, and bounded results;
- safe rendering, CSRF controls, content security policy, browser security headers, exact redirect and CORS allowlists, and SSRF-resistant outbound adapters;
- private direct-to-quarantine uploads with server-observed hash, actual-type and size checks, scanning, authorization-mediated access, and retention;
- callback signature, timestamp, replay, inbox, idempotency, and reconciliation controls;
- provider and application-level encryption where the threat model requires it, managed key lifecycle and compromise recovery, encrypted backup and verified deletion;
- public-only canonical caching with poisoning, deception, stampede, hot-key, and bounded-staleness controls;
- managed secrets, private-data-safe logs, append-only audit, dependency and workflow integrity, security monitoring, incident response, backup, and tested recovery.

The trust-and-safety behavior remains governed by [the moderation model](../trust-safety/moderation-model.md).

No provider, ORM, framework, checklist, or passed build makes NitipCuy attack-proof. Controls may be described only at their highest evidenced level: designed, implemented, source-tested, runtime-tested, load-tested, provider-verified, or incident-tested.

## 13. Quality and test boundaries

Plain unit tests must exercise:

- domain invariants;
- timezone-explicit source-service and ordering-window invariants, including advance PO and closed-window denial;
- use cases with test repositories;
- provider-neutral port behavior;
- adapter mapping and idempotency;
- authorization denials;
- state-transition conflicts.

The domain invariant tests satisfy the published-trip validation and cross-offset chronology portion. The dependency gate has source-tested manifest, relative, aliased, type-only, dynamic, require, non-static, composition, client/server, and symlink denial coverage. The provider-neutral idempotency contract and deterministic adapters source-test scoped exact replay, payload conflict, active concurrency, recovery-required ambiguous failure, expiry, invalid input, unavailable-authority denial, cross-scope isolation, and payment, logistics, and evidence behavior. This is not a shared or durable production implementation.

Integration tests now exercise the issue #5 account/profile/trip/public-discussion boundary for:

- the additive initial migration and constraints on disposable PostgreSQL 18;
- repository mapping and the serializable transaction-scoped unit of work;
- rollback after a duplicate authoritative write, bounded concurrent issuer-subject resolution, stale-version conflict, and state-to-audit and state-to-outbox atomicity;
- exact profile-owner foreign keys, session revocation, rotation-family reuse, account-version invalidation, OAuth browser-binding, attempt replay and expiry, bounded cursor reads, and private-field projection exclusion;

Later persisted-order slices must still exercise:

- interrupted backfills, mixed old/new application versions, rollback or forward-fix;
- fault injection at every new consistency-critical boundary;
- atomic last-capacity contention, balanced ledger constraints, provider inbox, and worker/outbox processing;
- bounded transaction and lock timeouts, with no provider network call while a database transaction is open;
- provider signature and event inbox handling;
- private object-storage authorization;
- outbox processing.

Browser tests later exercise:

- public discovery;
- scheduled, open, closed, and archived trip-offer presentation;
- protected mutation and denial;
- public versus private information;
- jastipper and customer order projections plus evidence-gated progress;
- accessibility;
- responsive behavior;
- evidence and recovery workflows.

Build success is not runtime, browser, security, legal, payment, provider, or visual approval.

## 14. Current implementation state

Implemented in issue #3:

- exact workspace toolchain;
- package dependency direction with automated manifest and TypeScript-AST enforcement;
- public trip domain invariants;
- trip discovery use cases;
- in-memory trip repository;
- provider-neutral payment, logistics, identity verification, evidence lifecycle, clock, identifier, audit, and outbox ports;
- provider-neutral asynchronous payment submissions and observations, stable payment-attempt correlation, and a fail-closed pure assessment for initial exact collected-and-held amount confirmation;
- deterministic in-memory and mock adapters for those boundaries;
- server-only composition;
- destination and date search;
- trip detail;
- source-service and ordering-window presentation with origin and destination timezones;
- chronological public questions and answers;
- correct HTTP `404` behavior for unknown simulated trip paths;
- PR quality workflow.

Implemented by issue #5, merged through pull request #6, and locally verified before merge:

- additive PostgreSQL 18 account, external-identity, capability, browser-session, OAuth-attempt, jastipper-profile, authoritative-trip, moderation, public-discussion, audit, and outbox schema;
- isolated Prisma 7 database adapter with bounded pool, statement, transaction, and cursor-page budgets;
- exact Google OIDC code-flow adapter with state, a separate digest-only browser-binding cookie, nonce, S256 PKCE, issuer, audience, lifetime, signature, callback, and minimum-scope enforcement through `openid-client`;
- email-minimized immutable issuer-subject account mapping with no password model or email linking;
- digest-only opaque sessions, base-assurance minting, idle and absolute expiry, rotation-family reuse revocation, per-session logout, listing, and account-wide invalidation;
- transactional session revalidation, deny-by-default profile/trip/discussion ownership, persisted capability checks, phishing-resistant moderation gate, bounded serializable conflict retries, optimistic concurrency, success audit, and outbox writes;
- protected JSON routes with exact-origin and Fetch-Metadata checks plus bounded request bodies; anonymous persisted search/detail routes use bounded cursor reads;
- disposable PostgreSQL integration and deterministic Google protocol fixtures.

Implemented in the issue #9 working tree and source/local-runtime-tested before pull-request creation:

- one canonical request-perimeter authority shared by the proxy, runtime origin, mutation checks, and Google callback reconstruction;
- explicit loopback-only direct mode and HTTPS trusted-proxy mode with bounded edge proof, exact forwarded host/protocol/port checks, timing-safe comparison, and downstream metadata stripping;
- fresh nonce CSP, forced dynamic rendering, anti-framing, content-type, referrer, permissions, cross-origin, HSTS, and private auth/API cache headers;
- generic non-cacheable `503` for missing configuration and non-cacheable, non-redirecting `421` for hostile request authority;
- an automated post-build local runtime gate for nonce propagation/freshness, unsafe CSP keywords, no-store, hostile host/forwarding/prefetch denial, exact unknown-trip `404`, trusted-edge proof, proof non-disclosure, and HSTS.

Issue #3 removed its callback-only transaction interface rather than misrepresent it as atomic infrastructure. Issue #5 now implements and disposable-database-tests a connection-bound serializable unit of work for the persisted marketplace slice; this does not yet cover order capacity, ledger, payment, provider callback, worker, or outbox-delivery transactions.

The payment port now separates initiation, release, and refund submission receipts from provider observations. It models collection, hold, release, refund, settlement, and chargeback independently; provider signals request inspection instead of declaring success. The configured mock never invents a successful outcome, and the pure initial-protection assessment fails closed for unknown, contradictory, mismatched, or post-hold evidence.

Payment initiation, release, refund, logistics dispatch registration, and evidence lifecycle mutations use a framework-independent idempotency port plus deterministic adapter. The scope is the order aggregate for payment and logistics and the owner account for evidence. SHA-256 fingerprints cover each operation's semantic application command; exact completed duplicates replay, changed payloads conflict, concurrent duplicates fail closed, unavailable authority blocks execution, and unclassified execution errors require reconciliation instead of releasing the key. Payment results retain 90-day mock replay records and logistics/evidence lifecycle results retain 30-day mock replay records.

This is source-tested contract behavior only. The default store is process-local and test-only. No shared persistent idempotency authority, authenticated use case, rate-limit integration, database constraint, provider-native verification, callback authentication, durable inbox, worker, ledger, order mutation, real money movement, or full release/refund/settlement reconciliation exists.

The evidence application port no longer accepts raw bytes, file names, client MIME, caller byte length, caller digest, object path, or scan status. It creates a short-lived opaque upload intent, inspects server-observed quarantine metadata and scanner state, promotes only a clean scan whose digest matches the observed bytes, returns a server-generated private reference, and deletes accepted fixture content only after retention expiry. The test-only in-memory adapter source-tests wrong client claims, immutable upload, file bounds and type detection, expiry, scan pending/outage/rejection/digest mismatch, cross-owner and object-reference denial, exact replay, terminal upload denial, retention, and deletion.

That proof is limited to framework-free contracts and deterministic process-local fixtures. No authenticated upload endpoint, signed URL, object-storage policy, durable metadata, scanner provider, dimension decoder, safe re-encoding, duplicate-image decision, order transition, authorization use case, cleanup worker, backup behavior, or provider/runtime verification exists. Audit and outbox mocks remain provisional until asynchronous-state and future transaction-scoping contracts are corrected.

Not implemented:

- real Google configuration or provider-verified authentication;
- privileged step-up or recovery, so production moderation remains fail-closed;
- provider-verified edge header overwrite and direct-origin restriction, shared rate-limit, risk, idempotency, browser automation, or real-browser completion for protected preview;
- private data;
- real providers;
- order, payment, evidence, logistics, item moderation, dispute, or review workflows;
- new-order eligibility, capacity reservation, archival history, or private seller and customer order dashboards;
- shared WAF, rate-limit, bot, session, idempotency, cache, worker, observability, backup, or recovery infrastructure;
- trusted-proxy/canonical-host configuration, privileged MFA, managed-key encryption lifecycle, cache-safety controls, or mixed-version deployment evidence;
- runtime security configuration, load and abuse tests, provider configuration review, incident exercises, or penetration testing;
- production deployment;
- visual approval.
