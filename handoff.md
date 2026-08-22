# NitipCuy Handoff

<!-- canonical: merge-turn-only -->
Updated: 2026-08-22

## 1. Resume order

1. Read `AGENTS.md`, `docs/roadmap.md`, this handoff, the latest `docs/changes.md` entry, and the latest `docs/learning.md` entry.
2. When two or more sessions are active, also read `docs/development/parallel-coordination.md`.
3. Read the order lifecycle, master specification, system architecture, resilience, security, quality, review-governance, and Git workflow authorities relevant to the active issue.
4. Verify branch, worktree, local head, `origin/main`, the active issue, open pull requests, and hosted checks. Volatile live state outranks this file.
5. Preserve unexpected work. Never inspect `.env*`, credentials, keys, browser sessions, private identity data, customer data, or production secrets.

Useful read-only commands:

```bash
git status --short --branch
git rev-parse HEAD
git rev-parse origin/main
gh issue list --repo BurinSn/NitipCuy --state open
gh pr list --repo BurinSn/NitipCuy --state open
```

## 2. Verified repository and GitHub state

| Item | Verified state |
|---|---|
| Canonical repository | `https://github.com/BurinSn/NitipCuy` |
| Default branch | `main` |
| `origin/main` | `df0426cafedbb61d9582527c1669f3bb077125bb` (issue #13 / PR #14 squash-merged) |
| Last merged work | #13 / PR #14 — server-authoritative `SUBMITTED` order request and atomic capacity reservation |
| Active issues | #15 (UX/visual foundation, in progress in a separate worktree on `feat/15-ux-visual-foundation`); #17 (this parallel-coordination protocol) |
| Open pull requests | #16 (draft, UX); #18 (draft, this protocol) — live-verify before acting |
| Parallel coordination | introduced by issue #17 / PR #18; see `docs/development/parallel-coordination.md` |
| Toolchain | Node.js `24.18.0`, pnpm `11.17.0` |
| Strix | #17 is `NOT REQUIRED` / `NOT APPLICABLE` / `NO TARGET` (pure policy/docs/bash) |

Do not commit on `main`, force-push, reset, clean, deploy, activate a provider, or merge without the governed workflow and fresh BurinSN approval. Agents never merge; BurinSN is the sole merge authority (see `docs/development/parallel-coordination.md` §7).

## 3. Boundaries and risks

- The UX/visual foundation (#15 / PR #16) is a design prototype, not a parallel transaction system; it has not received BurinSN visual sign-off and no in-app browser or accessibility evidence has been captured.
- Seller acceptance/rejection, request expiry/cancellation, and capacity release remain mandatory before the reservation lifecycle activates for real users.
- No provider, deployment, database, production account, real identity, payment, or logistics integration is active.
- Parallel application-code sessions require each session to run the exact pinned Node/pnpm toolchain locally; the protocol's bash and node gates run on any recent Node without pnpm.
- A passed gate or build does not authorize deployment, payment, delivery, real data, launch, or visual production deployment.

## 4. Owner authority

BurinSN approved merging issue #13 / PR #14 on 2026-08-17 (complete; `main` at `df0426c`) and authorized proceeding to the bounded #15 UX/visual-foundation work. BurinSN then authorized designing and implementing this parallel-session coordination protocol (issue #17 / PR #18). This does not constitute visual sign-off for #15, merge approval for #17, deployment approval, provider approval, production approval, payment authority, real-user-data authority, or security-testing authority. Fresh explicit BurinSN approval is required before merging #18 and before any merge of #16.
<!-- /canonical: merge-turn-only -->

## 5. Active sessions (append-only — edit ONLY your own subsection)

<!-- per-session: append-only -->
### Session: governance — issue #17 / PR #18 (parallel-coordination protocol)

- Branch: `docs/17-parallel-coordination` from `origin/main` (`df0426c`), in worktree `../NitipCuy-17`. The primary `feat/15` worktree is untouched.
- Scope: introduce `docs/development/parallel-coordination.md`; `scripts/check-base-freshness.sh`; `scripts/check-canonical-blocks.mjs` + `scripts/check-canonical-blocks.test.mjs`; restructure `handoff.md` and `docs/roadmap.md` into canonical (merge-turn-only) and per-session append-only zones; register the new gates in `AGENTS.md`, `README.md`, `docs/development/quality-gates.md`, `docs/development/git-workflow.md`, `docs/development/review-governance.md`, the PR template, and the `lifecycle-documentation.yml` workflow; add `package.json` `test:canonical-blocks`.
- Exclusions: no application, provider, payment, deployment, real-user, or Strix target change; no change to `feat/15`.
- Verification obtained: 23/23 `node --test scripts/check-canonical-blocks.test.mjs` pass on ambient Node (no pnpm); `check-base-freshness.sh` verified WARN/BLOCK/PASS in a throwaway repo; `check-canonical-blocks.mjs` is a graceful no-op on marker-free files and passes on this fresh worktree; `check-base-freshness.sh origin/main` PASS on this worktree.
- Exact next action: obtain BurinSN approval to open issue #17 and PR #18, push, pass hosted `lifecycle-documentation` (now including the two new gates), `application-quality`, and `review-governance` on the exact head, and stop for BurinSN merge review. After merge, the `feat/15` session runs the rebase cascade onto the merged `main` (take `main`'s canonical blocks, re-enter #15 as a per-session row).

### Session: claude — issue #15 / PR #16 (UX/visual foundation)

- Branch: `feat/15-ux-visual-foundation` in the primary worktree; base `df0426c`; local head `4fbfe16`; dirty with the hosted-evidence lifecycle checkpoint plus uncommitted UX iteration (new components and screenshots).
- Status: draft PR #16 open; `CLEAN` / `MERGEABLE`; owner visual sign-off pending; in-app browser/accessibility evidence pending.
- Note: after PR #18 merges, this session must rebase onto `main` and re-enter its state here under the new per-session format. The rebase will conflict on `handoff.md` and `docs/roadmap.md` (lifecycle-doc commits predate the restructure); resolve by taking `main`'s canonical blocks and re-entering #15's state as a per-session row. See `docs/development/parallel-coordination.md` §8.

### Last merged — #13 / PR #14 (historical record, preserved)

The following records the pre-merge state of issue #13 / pull request #14, preserved for continuity. Authoritative material-change history lives in `docs/changes.md`.

#### Current objective and approved boundary (issue #13)

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

#### Implementation state

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

#### Verification obtained

Passed with exact Node.js `24.18.0` and pnpm `11.17.0`:

- `pnpm check`;
- formatting and lint with no reported warning;
- dependency boundaries: 4 projects, 75 source files, 251 module references;
- strict type checking across all four packages;
- 244 tests (17 review-governance, 21 dependency-boundary, 27 domain, 34 application, 71 adapter, 74 web);
- clean application build; Next.js route manifest includes `/api/trips/[tripId]/requests`;
- local built request-perimeter probe in direct and simulated trusted-proxy modes.

Disposable PostgreSQL 18 proved: clean application of all migrations; database time overrides a hostile injected application clock; a delayed in-transaction reservation crossing the deadline is denied using live database wall time; Shop for me and Carry my item storage constraints and exact mappings; composite foreign keys bind replay ownership to the request customer and request seller/profile ownership to the exact trip; active seller/profile row locks and current offer revision; exact same-key replay, changed-payload conflict, and active-duplicate denial; one winner for two independent final-capacity attempts; rollback of capacity/version, request, audit, outbox, and idempotency on late failure.

Dependency-gate repair: exact Node.js `24.18.0` and pnpm `11.17.0` changed only the centralized `nanoid` override and lockfile resolution from `3.3.17` to patched `3.3.18`; frozen install, the complete `pnpm check` suite, and `pnpm audit:prod` pass locally on the repaired tree; hosted application run `31993491119` and lifecycle run `31993491134` passed on exact repair head `b76d701520def6a07824e5138d4cc6b5c2a392c5`; stable review-governance replacement `31993632434` also passed.

Highest evidence is source-tested, disposable-PostgreSQL-integration-tested, production-build-tested, and local request-perimeter-runtime-tested. No browser, provider, load, staging, production, or penetration-test evidence exists.

#### Current risks and review focus (issue #13)

- Reservation release does not exist; real-user activation would strand capacity after rejection, expiry, or cancellation.
- Submitted item content is private transactional data but managed encryption and production key custody do not exist.
- The 10-gram precision and storage ceilings are technical bounds, not approved pilot, trust-tier, legal, insurance, or load limits.
- Seven-day completed replay retention has no cleanup worker, metrics, alert, recovery command, or load evidence.
- Seller-account/profile locks and serializable capacity behavior are proven only on disposable PostgreSQL, not managed PostgreSQL under load.
- Shared limiter thresholds are pre-preview defaults. Edge/WAF/bot compatibility and aggregate cleanup load remain unverified.
- A passed build or database test does not authorize deployment, payment, delivery, real data, or launch.
- Registry advisory state is volatile. The patched `nanoid` `3.3.18` override is locally and hosted audit-clean at `b76d701520def6a07824e5138d4cc6b5c2a392c5`; later audit claims still require dated exact-head evidence.

#### Authority (issue #13)

BurinSN approved proceeding with the issue #13 scope and explicitly deferred payment and delivery. The first approval was correctly invalidated when hosted application run `31993037634` discovered a new high-severity registry advisory and the required `nanoid` `3.3.17` to `3.3.18` repair changed dependency state. After receiving a plain-language explanation that the repair changes only the existing transitive resolution, introduces no new dependency or application behavior, and passes all 244 tests/build/runtime/audit/governance gates, BurinSN replied "okay approved" on 2026-08-17. This was fresh owner approval to squash-merge pull request #14 from final hosted-evidence head `0dcf4f2ac21313d164dd26022f78061c0430a89c` and its approval-record-only successor, conditional on exact repinning, passing hosted gates, no actionable review finding, and `CLEAN` / `MERGEABLE` status. The merge is complete at `df0426c`.

DRY: `CLEAN WITH NOTES` through final hosted-evidence head `0dcf4f2ac21313d164dd26022f78061c0430a89c`; Strix applicability: `NOT REQUIRED`; Strix status: `NOT APPLICABLE`; target class: `NO TARGET`.

#### Exact next action (issue #13, completed)

Issue #13 / PR #14 was squash-merged as `df0426cafedbb61d9582527c1669f3bb077125bb`; `main`, issue closure, and branch cleanup were verified. The separately governed UX/visual-foundation issue (#15) and this parallel-coordination protocol (#17) followed.
<!-- /per-session: append-only -->