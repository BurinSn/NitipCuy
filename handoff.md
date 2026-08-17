# NitipCuy Handoff

Updated: 2026-08-17 11:13 WIB

## 1. Resume order

1. Read `AGENTS.md`, `docs/roadmap.md`, this handoff, the latest `docs/changes.md` entry, and the latest `docs/learning.md` entry.
2. Read issue [#13](https://github.com/BurinSn/NitipCuy/issues/13), the order lifecycle, master specification, system architecture, resilience, security, quality, review-governance, and Git workflow authorities.
3. Verify branch, worktree, local head, `origin/main`, issue #13, open pull requests, and hosted checks. Volatile live state outranks this file.
4. Preserve unexpected work. Never inspect `.env*`, credentials, keys, browser sessions, private identity data, customer data, or production secrets.

Useful read-only commands:

```bash
git status --short --branch
git rev-parse HEAD
git rev-parse origin/main
gh issue view 13 --repo BurinSn/NitipCuy
gh pr list --repo BurinSn/NitipCuy --state open
```

## 2. Verified repository and GitHub state

| Item | Verified state |
|---|---|
| Canonical repository | `https://github.com/BurinSn/NitipCuy` |
| Default branch | `main` |
| Current merged base | `ea4b629466df1e1e1381f62ae5ca26722edbe4bf` |
| Local branch | `feat/13-order-submission-capacity` |
| Local `HEAD` | hosted-verified dependency-repair head `b76d701520def6a07824e5138d4cc6b5c2a392c5`; the commit containing this final hosted-evidence record will be its four-lifecycle-file successor and must be live-resolved |
| Worktree | clean before this final hosted-evidence record; live-verify before acting |
| Active issue | #13, open |
| Open pull requests | #14, open and not draft at `b76d701520def6a07824e5138d4cc6b5c2a392c5`; application run `31993491119`, lifecycle run `31993491134`, and stable review-governance replacement `31993632434` passed; GitHub reports `CLEAN` / `MERGEABLE` |
| Issue #11 / PR #12 | merged/closed as `ea4b629466df1e1e1381f62ae5ca26722edbe4bf`; feature branches removed |
| Strix | issue #13 is `NOT REQUIRED` / `NOT APPLICABLE` / `NO TARGET`; no authorization, plan, budget, execution, report, or external Strix model action exists |

Do not commit on `main`, force-push, reset, clean, deploy, activate a provider, or merge without the governed workflow and fresh BurinSN approval.

## 3. Current objective and approved boundary

Issue #13 adds the first authoritative order-entry command:

```text
authenticated non-owner customer
  -> exact Shop for me or Carry my item declaration
  -> database-time offer and seller eligibility
  -> exact capacity reservation
  -> private SUBMITTED request
  -> atomic audit, outbox, and completed replay result
```

Included:

- both service modes;
- integer-IDR request values;
- integer grams at domain/HTTP boundaries and exact two-decimal kilograms in PostgreSQL;
- published/current offer, supported mode, ordering window, self-order, active seller-account/profile, and capacity checks;
- account-bound key-digest-only durable replay with canonical payload fingerprint;
- one serializable transaction across capacity, request, success audit, outbox, and completed idempotency result;
- a protected bounded JSON route and `order.submit.v1` shared abuse policy;
- source and disposable-PostgreSQL denial, concurrency, and rollback tests.

Excluded:

- seller acceptance/rejection, expiry/cancellation, and capacity release;
- accepted commercial price, payment, DOKU, ledger, refund, settlement, or payout;
- private address/chat, evidence upload, fulfilment, Biteship, tracking, pickup, dispatch, or delivery;
- checkout UI, visual approval, browser automation, real Google, managed database, provider, deployment, staging, production, real user data, load, incident, or launch;
- Strix execution or penetration-test claims.

The reservation lifecycle must not serve real users until safe seller response, expiry/cancellation, and capacity release exist.

## 4. Implementation state

Committed, pushed, and opened in pull request #14 at `9c145515367f81571e7583495f88eca53b8d9abe`:

- `packages/domain/src/order-request.ts`: bounded mode-specific declarations, request identity/status, immutable submitted shape, and exact capacity-unit rules;
- `packages/application/src/marketplace-foundation.ts`: database-authoritative submission use case, eligibility, self-order and mode denial, canonical fingerprinting, atomic orchestration, and generic error codes;
- `packages/adapters/prisma/schema.prisma` plus migration `20260811070000_order_submission_capacity`: additive request/idempotency tables, constraints, indexes, and foreign keys;
- `packages/adapters/src/prisma-marketplace.ts`: live database wall time, transaction advisory-lock replay, active seller/profile locks, locked-trip deadline/capacity/version update, request mapping, and completion persistence;
- `apps/web/src/app/api/trips/[tripId]/requests/route.ts`: protected `POST` endpoint and safe response;
- `apps/web/src/server/order-submission-input.ts`: exact per-mode JSON shapes and private-field exclusion;
- `apps/web/src/server/abuse-policy.ts`: `order.submit.v1` network/account/session/account-target policy;
- domain, application, web, and disposable-PostgreSQL tests for bounds, denials, both mode mappings, database time, replay/conflict/in-progress, final-slot contention, and rollback;
- lifecycle and affected product/architecture/security/quality documentation reconciliation.

Important implementation facts:

- authorization and route-level shared abuse admission occur before idempotency lookup;
- the raw idempotency key is not persisted; account, operation, key digest, and payload fingerprint scope the completed result;
- a transaction advisory-lock collision can only falsely deny as in-progress, not duplicate an order;
- the submitted snapshot is not the future seller-accepted commercial snapshot;
- no provider or object-storage call occurs inside the transaction;
- request item content is synthetic test data only. Managed encryption/key custody and real private-data activation remain unimplemented.

## 5. Verification obtained

Passed with exact Node.js `24.18.0` and pnpm `11.17.0`:

- `pnpm check`;
- formatting and lint with no reported warning;
- dependency boundaries: 4 projects, 75 source files, 251 module references;
- strict type checking across all four packages;
- 244 tests:
  - 17 review-governance;
  - 21 dependency-boundary;
  - 27 domain;
  - 34 application;
  - 71 adapter;
  - 74 web;
- clean application build; Next.js route manifest includes `/api/trips/[tripId]/requests`;
- local built request-perimeter probe in direct and simulated trusted-proxy modes.

Disposable PostgreSQL 18 proved:

- clean application of all migrations;
- database time overrides a hostile injected application clock;
- a delayed in-transaction reservation crossing the deadline is denied using live database wall time;
- Shop for me and Carry my item storage constraints and exact mappings;
- composite foreign keys bind replay ownership to the request customer and request seller/profile ownership to the exact trip;
- active seller/profile row locks and current offer revision;
- exact same-key replay, changed-payload conflict, and active-duplicate denial;
- one winner for two independent final-capacity attempts;
- rollback of capacity/version, request, audit, outbox, and idempotency on late failure.

Also passed on the corrected candidate before the registry advisory changed:

- `pnpm audit:prod` with no known production vulnerability at the time; this evidence was invalidated on 2026-08-17 when hosted run `31993037634` reported high-severity `GHSA-2v37-7h3g-55p8` against transitive `nanoid` `3.3.17`;
- lifecycle participation and diff hygiene;
- all 7 YAML files, 20 local Markdown documents, parameterized-query inventory, and high-confidence secret/log/unsafe-execution scans.

Current dependency-gate repair:

- exact Node.js `24.18.0` and pnpm `11.17.0` changed only the centralized `nanoid` override and lockfile resolution from `3.3.17` to patched `3.3.18`;
- frozen install, the complete `pnpm check` suite with 244 tests/build/runtime probe, and `pnpm audit:prod` now pass locally on the repaired tree; the production audit reports no known vulnerabilities;
- hosted application run `31993491119` and lifecycle run `31993491134` passed on exact repair head `b76d701520def6a07824e5138d4cc6b5c2a392c5`; stable review-governance replacement `31993632434` also passed after transition run `31993491123` captured the pre-repin PR event payload and failed only its expected revision-equality check;
- the repair changes dependency state, so the prior conditional merge approval is no longer sufficient even though the application quality suite itself passed before its audit step failed.

Still pending:

- commit and narrowly review this four-lifecycle-file hosted-evidence successor, repin issue #13 and pull request #14, and repeat hosted exact-head gates;
- request fresh BurinSN review of that final immutable evidence head before any merge.

Initial hosted state on `9c145515367f81571e7583495f88eca53b8d9abe`:

- review-governance run `31467896354` passed;
- application run `31467896319` and lifecycle run `31467896386` were in progress;
- CodeRabbit was pending;
- GitHub reported pull request #14 `MERGEABLE` with no review decision.

Final hosted evidence on `b4bb4aee87f6bdcf190504699f91bce7f5122050`:

- application run `31468141680`, lifecycle run `31468141673`, review-governance run `31468142538`, and post-inspection review-governance run `31468335555` passed with zero annotations;
- transition review-governance run `31468141682` was cancelled only because the workflow concurrency rule selected the higher-priority waiting replacement; its sole annotation says exactly that and is not a code or governance finding;
- CodeRabbit reported `Review rate limited`, produced a walkthrough, and created no review object or line finding;
- GitHub reported `CLEAN` / `MERGEABLE`, no review decision, and no review objects.

Final reviewed evidence head `c5fe836b27b1756b290ee32d88572e5c7458d516` was live-reverified on 2026-08-17:

- application run `31468516199`, lifecycle run `31468516235`, and final review-governance run `31468677458` passed on the exact head;
- transition review-governance run `31468516271` was cancelled by the workflow concurrency rule and its passing replacements are visible on the same head;
- issue #13 and pull request #14 match DRY `CLEAN WITH NOTES` at the full 40-character head and Strix `NOT REQUIRED` / `NOT APPLICABLE` / `NO TARGET`;
- local, remote-branch, and pull-request heads match; GitHub reports `CLEAN` / `MERGEABLE`, with no review object, review decision, or intervening source change;
- CodeRabbit remains a rate-limited walkthrough with no independent finding or review object.

Highest evidence is source-tested, disposable-PostgreSQL-integration-tested, production-build-tested, and local request-perimeter-runtime-tested. No browser, provider, load, staging, production, or penetration-test evidence exists.

## 6. Current risks and review focus

- Reservation release does not exist; real-user activation would strand capacity after rejection, expiry, or cancellation.
- Submitted item content is private transactional data but managed encryption and production key custody do not exist.
- The 10-gram precision and storage ceilings are technical bounds, not approved pilot, trust-tier, legal, insurance, or load limits.
- Seven-day completed replay retention has no cleanup worker, metrics, alert, recovery command, or load evidence.
- Seller-account/profile locks and serializable capacity behavior are proven only on disposable PostgreSQL, not managed PostgreSQL under load.
- Shared limiter thresholds are pre-preview defaults. Edge/WAF/bot compatibility and aggregate cleanup load remain unverified.
- A passed build or database test does not authorize deployment, payment, delivery, real data, or launch.
- Registry advisory state is volatile. The patched `nanoid` `3.3.18` override is locally and hosted audit-clean at `b76d701520def6a07824e5138d4cc6b5c2a392c5`; later audit claims still require dated exact-head evidence.

## 7. Authority

BurinSN approved proceeding with the issue #13 scope and explicitly deferred payment and delivery. After receiving the live exact-head result, evidence levels, remaining exclusions, and the proposed sequence, BurinSN instructed Codex to "proceed next" on 2026-08-17. That approval was correctly bound to reviewed head `c5fe836b27b1756b290ee32d88572e5c7458d516` and approval-record successor `0ef764f70e439fb45e963dd17172e803794815ba`. Hosted application run `31993037634` then discovered a new high-severity registry advisory against the unchanged transitive dependency tree. The required `nanoid` `3.3.17` to `3.3.18` repair is a dependency change and therefore invalidates that merge approval under its own stated condition. Repair head `b76d701520def6a07824e5138d4cc6b5c2a392c5` is now locally and hosted verified, but fresh BurinSN review remains required after this final evidence successor is also verified. No approval authorizes deployment, provider onboarding/configuration, payment movement, real-user testing, production data, external target testing, Strix execution, public launch, or visual production deployment.

Issue #13 and pull request #14 currently record the hosted-verified dependency-repair head and must be repinned after this evidence successor is committed:

- DRY: `CLEAN WITH NOTES` through dependency-repair head `b76d701520def6a07824e5138d4cc6b5c2a392c5`;
- Strix applicability: `NOT REQUIRED`;
- Strix status: `NOT APPLICABLE`;
- target class: `NO TARGET`.

The implementation head's complete diff passed DRY and hostile review after correcting stale transaction-start time, missing composite ownership invariants, raw-query serialization retry classification, and duplicated key grammar. The lifecycle-only successors through `0ef764f70e439fb45e963dd17172e803794815ba` were narrowly reviewed and repinned. The dependency-repair successor contains the exact two-file supply-chain delta plus all lifecycle updates, passed local and hosted gates, and both governed records carry its full 40-character SHA. Any further source, dependency, configuration, product, provider, security-control, scope, or finding change invalidates approval and requires fresh owner review.

## 8. Exact next action

Commit this final hosted-evidence checkpoint and confirm its delta from `b76d701520def6a07824e5138d4cc6b5c2a392c5` contains exactly `handoff.md`, `docs/changes.md`, `docs/roadmap.md`, and `docs/learning.md`. Narrowly review, repin, push, and repeat hosted checks on the exact successor. Then present that immutable head, the advisory repair, evidence, and unchanged exclusions to BurinSN for fresh merge approval. Do not merge, deploy, or provision a provider before that approval.
