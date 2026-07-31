# NitipCuy Development and Quality Gates

Status: Accepted foundation

Last reviewed: 2026-07-29

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

Native dependency scripts are fail-closed. `pnpm-workspace.yaml` explicitly allows only the packages required by the selected Next.js and lint stack.

The workspace also applies exact security overrides for transitive `postcss` and `sharp` releases that the current Next.js graph resolves below patched versions. Treat an override as a temporary reviewed dependency decision: keep the full build and runtime evidence, audit it on every pull request, and remove it when the framework publishes a supported patched graph.

## 3. Local commands

```bash
pnpm dev
pnpm format
pnpm format:check
pnpm lint
pnpm check:boundaries
pnpm typecheck
pnpm test
pnpm test:boundaries
pnpm build
pnpm audit:prod
pnpm check
./scripts/check-lifecycle-docs.sh origin/main
```

`pnpm check` runs formatting, lint, the live dependency-boundary scan, strict type checking, boundary and unit tests, and the production build. The production dependency audit and lifecycle check remain explicit gates so their results cannot be hidden inside a generic command.

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
9. inspect hosted checks on the immutable PR head;
10. record warnings, skipped checks, unavailable checks, and residual risks honestly.

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
- stale-version or lock-conflict behavior, balanced ledger constraints, bounded transaction and lock timeouts, and no provider network call while the transaction is open;
- purchased and collected transitions denied until required evidence and customer-approved variance state exist;
- cleanup verified;
- no fallback to a development or production database.

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

Two GitHub workflows run on pull requests:

- `Lifecycle documentation` requires all four lifecycle documents.
- `Application quality` installs the exact Node/pnpm toolchain, performs a frozen install, runs `pnpm check`, and audits production dependencies.

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
- The DDoS, WAF, bot, trusted-proxy, canonical-host, shared rate-limit, session, privileged-MFA, SQL-safety, encryption/key-management, cache-safety, CSRF, XSS, SSRF, private-upload, monitoring, incident, backup, deployment-compatibility, and recovery requirements are designed but not production-implemented or runtime-verified.
- No capacity contract, service-level objective, provider quota review, load or abuse test, backup restore, or incident exercise exists.
- No transaction abstraction or implementation exists. The callback-only transaction port and passthrough mock were removed because they could not enforce a shared atomic scope.
- The payment submission and initial-protection assessment contracts are source-tested. The provider-neutral idempotency contract and payment, dispatch, and evidence mocks source-test scoped replay, payload conflict, concurrency denial, recovery-required ambiguous failure, expiry, malformed input, authority outage, and cross-scope isolation.
- The idempotency store is deliberately process-local and test-only. No shared durable production authority, authenticated idempotency lookup, database constraint, provider-native verification, callback authentication, durable inbox, worker, ledger, order mutation, or complete release/refund/settlement reconciliation exists.
- Evidence, audit, and outbox mocks remain provisional until their evidence-integrity, asynchronous-state, and future transaction-scoping findings are resolved.
- No PostgreSQL adapter or integration test exists yet.
- No authoritative trip-offer lifecycle, new-order guard, capacity reservation, archival history, evidence-gated order transition, or private seller/customer dashboard exists yet.
- No browser automation exists yet.
- No identity, provider, payment, logistics, or storage integration exists.
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

Strix is not a routine build command. It may be used only through the guarded project process after explicit authorization for the exact target, a reviewed dry-run plan, and a fixed budget. Production execution requires a second approval. Its findings and proposed fixes remain untrusted until independently reviewed and verified.
