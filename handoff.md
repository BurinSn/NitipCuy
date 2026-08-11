# NitipCuy Handoff

Updated: 2026-08-11 14:06 WIB

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
| Local `HEAD` | still the merged base; issue #13 candidate is uncommitted |
| Worktree | intentionally dirty with issue #13 source, migration, tests, and documentation |
| Active issue | #13, open |
| Open pull requests | none at last verification |
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

## 4. Local implementation state

Implemented in the dirty worktree:

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

Also passed on the corrected candidate:

- `pnpm audit:prod` with no known production vulnerability;
- lifecycle participation and diff hygiene;
- all 7 YAML files, 20 local Markdown documents, parameterized-query inventory, and high-confidence secret/log/unsafe-execution scans.

Still pending:

- complete `origin/main...HEAD` DRY and hostile security review pinned to an immutable commit;
- GitHub issue progress update, push, pull request, hosted application/lifecycle/review-governance checks, CodeRabbit disclosure inspection, mergeability, and fresh owner approval.

Highest evidence is source-tested, disposable-PostgreSQL-integration-tested, production-build-tested, and local request-perimeter-runtime-tested. No browser, provider, load, staging, production, or penetration-test evidence exists.

## 6. Current risks and review focus

- Reservation release does not exist; real-user activation would strand capacity after rejection, expiry, or cancellation.
- Submitted item content is private transactional data but managed encryption and production key custody do not exist.
- The 10-gram precision and storage ceilings are technical bounds, not approved pilot, trust-tier, legal, insurance, or load limits.
- Seven-day completed replay retention has no cleanup worker, metrics, alert, recovery command, or load evidence.
- Seller-account/profile locks and serializable capacity behavior are proven only on disposable PostgreSQL, not managed PostgreSQL under load.
- Shared limiter thresholds are pre-preview defaults. Edge/WAF/bot compatibility and aggregate cleanup load remain unverified.
- A passed build or database test does not authorize deployment, payment, delivery, real data, or launch.

## 7. Authority

BurinSN approved proceeding with the issue #13 scope and explicitly deferred payment and delivery. This authorizes the bounded local implementation and governed pull-request workflow. It does not authorize merge, deployment, provider onboarding/configuration, payment movement, real-user testing, production data, external target testing, Strix execution, public launch, or visual production deployment.

Issue #13 currently records:

- DRY: `NOT STARTED`;
- Strix applicability: `NOT REQUIRED`;
- Strix status: `NOT APPLICABLE`;
- target class: `NO TARGET`.

The DRY status can become `CLEAN` or `CLEAN WITH NOTES` only after the complete immutable diff is reviewed and the exact 40-character head is recorded in both issue and pull request. Merge still needs fresh BurinSN approval after every check, finding, limitation, and integration result is visible.

## 8. Exact next action

Commit the corrected coherent issue #13 candidate. Review the immutable complete diff for duplicated authority, migration correctness, authorization, privacy, idempotency, timing, locks, contention, rollback, and false claims. If clean, push it, pin the governed issue to that exact head, open the focused pull request, and repeat exact-head local and hosted verification. Stop for fresh BurinSN merge approval after reporting the final evidence and hostile-review rating.
