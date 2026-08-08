# NitipCuy Development and Quality Gates

Status: Accepted foundation

Last reviewed: 2026-08-07

## 1. Supported toolchain

- Node.js `24.18.0` for reproducible local and CI evidence.
- Node.js deployment line `24.x`.
- pnpm `11.17.0` with exact package-manager integrity.

Use a Node version manager or another official Node installation method. Verify before installing:

```bash
node --version
pnpm --version
```

Expected:

```text
v24.18.0
11.17.0
```

Do not weaken `engine-strict` or edit the lockfile to accommodate an ambient unsupported runtime.

## 2. Install

```bash
pnpm install --frozen-lockfile
```

When intentionally changing dependencies:

```bash
pnpm install
pnpm peers check
pnpm audit:prod
```

Review both `package.json` and `pnpm-lock.yaml`. Do not accept peer warnings, ignored native build scripts, unreviewed overrides, or unexplained package-manager mutations.

Native dependency scripts are fail-closed. `pnpm-workspace.yaml` explicitly allows only reviewed packages required by the selected Next.js and Prisma stacks. The Prisma engine and CLI scripts are allowed; optional native scripts reached through disposable test-container support remain explicitly denied.

The workspace also applies exact security overrides for transitive `postcss`, `sharp`, and `nanoid` releases that the current Next.js graph resolves below patched versions. `nanoid` `3.3.17` is the first release that patches `GHSA-2v37-7h3g-55p8`; the 2026-08-08 production audit found `3.3.16` through Next.js -> PostCSS despite no direct manifest change. Treat an override as a temporary reviewed dependency decision: keep the full build and runtime evidence, audit it on every pull request, and remove it when the framework publishes a supported patched graph.

## 3. Local commands

```bash
pnpm dev
pnpm format
pnpm format:check
pnpm lint
pnpm check:boundaries
pnpm check:perimeter-runtime
pnpm typecheck
pnpm test
pnpm test:boundaries
pnpm test:review-governance
pnpm build
pnpm audit:prod
pnpm check
./scripts/check-lifecycle-docs.sh origin/main
```

`pnpm check` runs formatting, lint, the live dependency-boundary scan, strict type checking, boundary and unit tests, the production build, and the built request-perimeter runtime probe. The production dependency audit and lifecycle check remain explicit gates so their results cannot be hidden inside a generic command.

`pnpm check:perimeter-runtime` starts the already-built application twice with deterministic non-secret configuration: once in loopback-only direct mode and once behind a simulated trusted proxy. It verifies fresh CSP nonce propagation into rendered HTML, production CSP without `unsafe-inline` or `unsafe-eval`, browser headers, private- and denied-response `no-store`, exact unknown-trip `404`, hostile host/forwarding/prefetch denial, edge-proof enforcement, proof non-disclosure, and HSTS. The probe uses no real database, Google account, provider, preview deployment, or production secret and therefore proves only local runtime behavior.

## 4. Evidence requirements

Before requesting merge:

1. verify the exact Node and pnpm versions;
2. use a frozen install;
3. require a clean peer-dependency check;
4. run `pnpm check`;
5. run `pnpm audit:prod`;
6. run the lifecycle document check against `origin/main`;
7. run `git diff --check`;
8. inspect the complete base diff;
9. complete the DRY review on the immutable PR head and reconcile its verdict with the linked issue;
10. reconcile guarded Strix applicability and evidence under `docs/development/review-governance.md`;
11. inspect hosted checks on the immutable PR head;
12. record warnings, skipped checks, unavailable checks, and residual risks honestly.

For every security or scale control, record the highest evidence actually obtained:

1. designed;
2. implemented;
3. source-tested;
4. runtime-tested;
5. load-tested;
6. provider-verified;
7. incident-tested.

Do not collapse these levels into a generic “secure,” “scalable,” or “production-ready” result.

Do not translate:

- type checking into runtime evidence;
- build success into browser evidence;
- a mock into provider compatibility;
- a green integration status into independent review;
- an available merge button into product-owner approval.

## 5. Test boundaries

Unit tests:

- no network;
- no external service;
- no production credential;
- no database requirement;
- deterministic clock, ID, provider, and repository behavior;
- distinguish payment request acceptance from completion and cover accepted, rejected, unknown, pending, expired, cross-attempt, missing-reference, contradictory, amount-mismatched, paid-but-not-held, and status-versus-amount post-hold observations;
- require mock payment outcomes to be configured rather than defaulting to financial success;
- cover origin and destination timezone validity, source-service ordering, advance PO, inverted windows, late close, departure cutoff, and public-projection invariants.

Architecture tests:

- scan package manifests and parsed source rather than relying on path naming or regular-expression-only checks;
- cover cross-package relative, workspace alias, deep, type-only, import-type, triple-slash, dynamic import, `require`, composition, and client/server boundaries;
- reject non-static module specifiers and source-root symlinks rather than silently skipping unverifiable edges;
- verify that allowed workspace imports are declared through the workspace protocol, production runtime imports use runtime dependency sections, and domain and application cannot declare external runtime dependencies;
- run synthetic disposable fixtures only; the live tree is scanned separately by `pnpm check:boundaries`.

Review-governance tests:

- exercise both justified Strix non-applicability and required guarded-review completion;
- reject unfinished or stale-revision DRY evidence;
- reject inconsistent issue and pull-request statuses;
- reject missing guarded authorization evidence, invalid target/environment combinations, and required Strix work that has not reached triage;
- use synthetic Markdown only and never invoke Strix or the GitHub API.

Integration tests:

- disposable test resources only;
- explicit test-target acknowledgement before destructive reset;
- migrations applied from a clean state;
- expand-and-contract changes exercised across supported old and new web and worker versions;
- interrupted backfill plus rollback or forward-fix behavior exercised before destructive contraction;
- server-side new-order denial outside the authoritative ordering window, at exhausted capacity, or for an ineligible seller or offer;
- atomic last-capacity reservation and accepted-order commercial snapshot behavior;
- one database-backed transaction scope for every repository, ledger, success-audit, inbox, and outbox write in a consistency-critical command;
- rollback after injected failure at every write boundary, including proof that no success audit or outbox message survives without its authoritative state;
- order-capacity or ledger lock-conflict behavior, balanced ledger constraints, a database-level lock timeout, and transaction-level proof that no provider network call occurs while the transaction is open; issue #5 already tests stale trip versions and enforces application query/transaction timeouts;
- purchased and collected transitions denied until required evidence and customer-approved variance state exist;
- cleanup verified;
- no fallback to a development or production database.

The issue #5 integration suite starts a disposable `postgres:18-alpine` container, applies the committed migration from a clean database, and stops the container after the suite. It covers repeated and concurrent issuer-subject mapping, email non-persistence, sessions, browser-bound OAuth attempts, ownership constraints, authoritative trip lifecycle, moderation assurance and capability, moderation-safe public Q&A, rollback, optimistic concurrency, cursor reads, and public projection privacy. This is local disposable-database runtime evidence, not managed-provider or production evidence.

Browser tests:

- use isolated test identities and data;
- assert public versus private boundaries;
- show scheduled, open, closed, and archived offers without enabling a stale checkout;
- cover jastipper work queues and customer progress timelines without treating dashboard labels as authority;
- keep fixed-price acquisition cost and private receipts out of customer and public surfaces;
- cover denial and recovery, not only happy paths;
- record browser-visible evidence separately from source and build evidence.

Security tests:

- derive applicable requirements from OWASP ASVS 5.0 Level 2 and the project threat model;
- test denial, cross-account access, malformed and oversized input, injection attempts, session rotation and revocation, privileged MFA and recovery, CSRF, XSS, redirect, SSRF, upload, callback replay, idempotency, and privilege boundaries as the corresponding flows are introduced;
- test direct-origin rejection, canonical host/origin behavior, forwarded-header spoofing, redirect and callback URL generation, and trusted-proxy configuration;
- test each shared security-dependency outage, proving protected actions fail closed and any public-read degradation remains bounded and public;
- test encryption formats, managed-key authorization, rotation, re-wrapping, key unavailability, backup restore, retention expiry, verified deletion, and log redaction for applicable private data;
- test that logs and telemetry exclude secrets and private content;
- use synthetic test identities and disposable non-production data;
- never run active testing against an external or production target without separate exact-target authorization.

Load and resilience tests:

- run only against isolated approved resources;
- use an approved capacity contract rather than an arbitrary concurrent-user number;
- cover ramp, mixed protected work, callback burst, upload, spike, soak, abuse, cache hot keys and concurrent misses, provider failure, mixed-version deployment, migration interruption, restart, and recovery as applicable;
- record environment, dataset, request mix, duration, latency percentiles, errors, saturation, provider usage, cost, and recovery;
- never infer production capacity from a local build, unit benchmark, provider limit, or one happy-path request.

## 6. Hosted pull-request gates

Three GitHub workflows run on pull requests:

- `Lifecycle documentation` requires all four lifecycle documents.
- `Application quality` installs the exact Node/pnpm toolchain, performs a frozen install, runs `pnpm check`, and audits production dependencies.
- `Review governance` tests the dependency-free evidence validator, retrieves the one linked issue using read-only permissions, requires matching issue/PR states, pins the DRY verdict to the exact PR head, and exposes DRY plus Strix progress in the step summary. It never invokes Strix.

Both workflows:

- use read-only repository permission;
- pin actions to verified immutable commits;
- run no production deployment;
- receive no production secrets.

GitHub branch protection is unavailable for the current private repository plan. Missing, skipped, warned, or failed required evidence remains a manual project-policy blocker.

## 7. Current limitations

- The architecture probe has source, unit, production-build, and local HTTP runtime evidence.
- Published-trip runtime validation rejects unsupported service modes, impossible calendar and clock values, invalid offsets and IANA timezones, inverted source-service and ordering windows, ordering after source availability, service after departure, and duplicate question IDs; it supports advance PO and sorts cross-offset public questions by instant.
- Package dependency direction is implemented and source-tested through the manifest plus TypeScript-AST boundary gate. It does not replace complete-diff review, runtime authorization, or provider and data-flow security verification.
- OWASP ASVS 5.0 Level 2 is the accepted production verification target, but no traceability matrix or complete ASVS verification exists.
- The merged issue #5 slice has source-tested OIDC, session, authorization, CSRF-origin, bounded-input, Prisma, and disposable-PostgreSQL controls. DDoS, WAF, bot, trusted-proxy, canonical-host, shared rate-limit, privileged-MFA minting and recovery, managed encryption/key custody, cache safety, XSS/SSRF coverage, private upload, monitoring, incident, backup, deployment compatibility, and recovery remain unimplemented or unverified.
- No capacity contract, service-level objective, provider quota review, load or abuse test, backup restore, or incident exercise exists.
- The issue #5 marketplace unit of work uses a Prisma serializable transaction and one transaction client for state, success audit, and required outbox records. This does not implement order, ledger, inbox, worker, payment, or provider transaction boundaries.
- The payment submission and initial-protection assessment contracts are source-tested. The provider-neutral idempotency contract and payment, dispatch, and evidence-lifecycle mocks source-test scoped replay, payload conflict, concurrency denial, recovery-required ambiguous failure, expiry, malformed input, authority outage, and cross-scope isolation.
- The idempotency store is deliberately process-local and test-only. No shared durable production authority, authenticated idempotency lookup, database constraint, provider-native verification, callback authentication, durable inbox, worker, ledger, order mutation, or complete release/refund/settlement reconciliation exists.
- The evidence lifecycle application seam and deterministic fixture are source-tested for server-observed digest, byte length, bounded image signatures, immutable quarantine upload, expiry, scan pending/outage/rejection/digest mismatch, acceptance, cross-owner and reference denial, retention, and deletion. No authenticated upload, signed URL, production object storage, robust image decoder, scanner, durable metadata, order transition, cleanup worker, or provider/runtime evidence exists.
- Durable success audit and outbox rows now share the issue #5 marketplace transaction; publication to a worker and asynchronous retry remain unimplemented.
- The first PostgreSQL adapter and disposable-database integration suite exist; managed PostgreSQL, migration-role separation, backup, restore, and mixed-version deployment do not.
- An authoritative moderated trip-offer lifecycle exists. New-order guard, capacity reservation, archival history, evidence-gated order transition, and private seller/customer dashboards do not.
- No browser automation exists yet.
- Google OIDC is implemented against deterministic protocol fixtures only. No real identity, payment, logistics, or storage provider is configured or verified.
- No production or preview environment exists.
- The current shell has not received visual approval.

These limitations are explicit scope, not hidden green claims.

## 8. Protected-preview and pilot gates

Before the first protected preview:

- threat model and private-data inventory reviewed;
- authorization denial matrix automated;
- trusted-proxy, canonical-host, forwarding-header, direct-origin, and protected dependency-outage tests active;
- privileged-assurance and non-downgrading recovery tests active;
- applicable encryption, managed-key, rotation, backup-restore, retention, and deletion tests active;
- safe-query rule and database negative tests active when persistence exists;
- applicable session, CSRF, XSS, redirect, SSRF, callback, upload, and log-redaction tests active;
- secret, dependency, static, and workflow scans passing;
- runtime behavior verified separately from source checks.

Before a real-money closed pilot:

- applicable OWASP ASVS requirements traced to evidence;
- live non-production identity, cookie, header, edge, WAF, rate-limit, bot, database, storage, and provider configurations reviewed;
- cross-account browser tests passed;
- approved capacity and cost contract passed through ramp, spike, soak, abuse, cache-stampede/hot-key, provider-failure, mixed-version deployment, migration-interruption, and recovery testing;
- backup restore, session revocation, provider kill switch, and incident response rehearsed;
- high-impact flows independently security-reviewed;
- no unresolved critical or high security finding without explicit documented BurinSN risk acceptance;
- legal, privacy, support, moderation, reconciliation, and operational gates in the roadmap passed.

Strix is not a routine build command. Each material issue must classify its applicability under `docs/development/review-governance.md`. When required, it may be used only through the guarded project process after explicit authorization for the exact target, a reviewed dry-run plan, and a fixed budget. Production execution requires a second approval. Its findings and proposed fixes remain untrusted until independently reviewed and verified.
