# NitipCuy Development and Quality Gates

Status: Accepted foundation

Last reviewed: 2026-07-27

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
pnpm typecheck
pnpm test
pnpm build
pnpm audit:prod
pnpm check
./scripts/check-lifecycle-docs.sh origin/main
```

`pnpm check` runs formatting, lint, strict type checking, unit tests, and the production build. The production dependency audit and lifecycle check remain explicit gates so their results cannot be hidden inside a generic command.

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
- deterministic clock, ID, provider, and repository behavior.

Integration tests:

- disposable test resources only;
- explicit test-target acknowledgement before destructive reset;
- migrations applied from a clean state;
- cleanup verified;
- no fallback to a development or production database.

Browser tests:

- use isolated test identities and data;
- assert public versus private boundaries;
- cover denial and recovery, not only happy paths;
- record browser-visible evidence separately from source and build evidence.

Security tests:

- derive applicable requirements from OWASP ASVS 5.0 Level 2 and the project threat model;
- test denial, cross-account access, malformed and oversized input, injection attempts, session rotation and revocation, CSRF, XSS, redirect, SSRF, upload, callback replay, idempotency, and privilege boundaries as the corresponding flows are introduced;
- test that logs and telemetry exclude secrets and private content;
- use synthetic test identities and disposable non-production data;
- never run active testing against an external or production target without separate exact-target authorization.

Load and resilience tests:

- run only against isolated approved resources;
- use an approved capacity contract rather than an arbitrary concurrent-user number;
- cover ramp, mixed protected work, callback burst, upload, spike, soak, abuse, provider failure, restart, and recovery as applicable;
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
- Published-trip runtime validation now rejects unsupported service modes, impossible calendar and clock values, invalid timezone offsets, and duplicate question IDs; cross-offset public questions are sorted by instant.
- Package dependency direction is still verified by review and manual scans; an automated boundary gate remains required.
- OWASP ASVS 5.0 Level 2 is the accepted production verification target, but no traceability matrix or complete ASVS verification exists.
- The DDoS, WAF, bot, shared rate-limit, session, SQL-safety, CSRF, XSS, SSRF, private-upload, monitoring, incident, backup, and recovery requirements are designed but not production-implemented or runtime-verified.
- No capacity contract, service-level objective, provider quota review, load or abuse test, backup restore, or incident exercise exists.
- Transaction, payment, logistics, evidence, audit, and outbox mocks remain provisional until their transaction, asynchronous-state, idempotency, and evidence-integrity findings are resolved.
- No PostgreSQL adapter or integration test exists yet.
- No browser automation exists yet.
- No identity, provider, payment, logistics, or storage integration exists.
- No production or preview environment exists.
- The current shell has not received visual approval.

These limitations are explicit scope, not hidden green claims.

## 8. Protected-preview and pilot gates

Before the first protected preview:

- threat model and private-data inventory reviewed;
- authorization denial matrix automated;
- safe-query rule and database negative tests active when persistence exists;
- applicable session, CSRF, XSS, redirect, SSRF, callback, upload, and log-redaction tests active;
- secret, dependency, static, and workflow scans passing;
- runtime behavior verified separately from source checks.

Before a real-money closed pilot:

- applicable OWASP ASVS requirements traced to evidence;
- live non-production identity, cookie, header, edge, WAF, rate-limit, bot, database, storage, and provider configurations reviewed;
- cross-account browser tests passed;
- approved capacity and cost contract passed through ramp, spike, soak, abuse, provider-failure, and recovery testing;
- backup restore, session revocation, provider kill switch, and incident response rehearsed;
- high-impact flows independently security-reviewed;
- no unresolved critical or high security finding without explicit documented BurinSN risk acceptance;
- legal, privacy, support, moderation, reconciliation, and operational gates in the roadmap passed.

Strix is not a routine build command. It may be used only through the guarded project process after explicit authorization for the exact target, a reviewed dry-run plan, and a fixed budget. Production execution requires a second approval. Its findings and proposed fixes remain untrusted until independently reviewed and verified.
