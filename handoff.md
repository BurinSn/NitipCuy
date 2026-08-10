# NitipCuy Cross-Session Handoff

Last updated: 2026-08-10 19:55 WIB

Handoff owner: Codex

Product owner: BurinSN

## 1. Role, authority, and freshness contract

This file is the operational resume point. Live Git, GitHub, and verified runtime state override this record. It never grants merge, deployment, provider configuration, real-user testing, external security testing, payment movement, production action, or public-launch authority.

## 2. Mandatory resume protocol

1. Read `AGENTS.md`, `docs/roadmap.md`, this handoff, the latest `docs/changes.md`, and relevant `docs/learning.md`.
2. Read ADR 0004, ADR 0005, system architecture, security, resilience, quality, Git, and review-governance authorities for issue #11.
3. Verify branch, status, local head, `origin/main`, issue #11, open pull requests, and hosted checks.
4. Preserve unexpected work and never inspect `.env*`, credentials, keys, browser sessions, private identity data, customer data, or production secrets.

Minimum live verification:

```bash
git status --short --branch
git rev-parse HEAD
git rev-parse origin/main
gh issue view 11 --repo BurinSn/NitipCuy
gh pr list --repo BurinSn/NitipCuy --state open
```

## 3. Product compass and evidence boundary

NitipCuy is a standalone BurinSN marketplace connecting customers with independent jastippers through Shop for me and Carry my item. Jastippers set their own rates and terms; transaction fees are the approved revenue direction. The current Stage 1 work stops before orders, addresses, private chat, real evidence, money, logistics, disputes, provider activation, preview deployment, or production.

Claims must distinguish designed, implemented, source-tested, local-runtime-tested, disposable-database-integration-tested, load-tested, provider-verified, and incident-tested evidence.

## 4. Completed repository checkpoints

- Issue #5 / pull request #6 delivered the persisted Google-OIDC account, session, profile, trip, moderation, discovery, and public-Q&A foundation; it squash-merged as `f38cdaf144ff3c22c39e7a28544363fdb0fd0a19`.
- Issue #7 / pull request #8 delivered visible DRY and guarded-Strix governance; it squash-merged as `d09747b1a8072eaafe23f7bc604b82bb7eae5bf3`.
- Issue #9 / pull request #10 delivered the inbound browser/session perimeter and deterministic two-mode runtime probe. After BurinSN approval and repeated exact-head verification, it squash-merged on 2026-08-09 as `23a6015781228cb04e167b83f6a28b3d3cc0b62d`; issue #9 closed and feature branches were removed.
- The historical failed workflow emails for pull request #10 were governance-transition failures: two issue-heading failures corrected by rerun, two brief DRY-pin mismatches while the successor head was being pushed, and one post-merge closed-issue lookup corrected by a controlled rerun. No application or security-execution check failed, and the final required runs passed.

## 5. Active issue #11

Issue [#11](https://github.com/BurinSn/NitipCuy/issues/11) governs shared abuse controls and privacy-safe denial telemetry for the existing persisted routes.

Included:

- one canonical client-network decision: explicit loopback identity in local-direct mode and exactly one canonical IP address supplied through the trusted-proxy path;
- fail-closed rejection and downstream removal of raw forwarding plus maintained alternate client-network metadata before route execution, and a server-owned HMAC network subject using `NITIPCUY_ABUSE_SUBJECT_HMAC_KEY_BASE64`;
- one versioned typed policy authority for identity start/callback, session validation/logout, public trip list/detail, profile/trip writes, discussion, and moderation;
- additive PostgreSQL fixed-window buckets for action-scoped network, account, session/device, and caller-target axes; public detail uses network-target while authenticated actions use account-target so no target bucket is globally exhaustible;
- concurrency-safe shared decisions, bounded opportunistic expiry cleanup, generic `429` plus bounded `Retry-After`, and generic fail-closed `503` on authority or audit failure;
- one atomic denial audit per crossed axis/bucket/window without raw IPs, tokens, cookies, OAuth values, user content, or raw target identifiers;
- hostile source/unit tests, disposable PostgreSQL 18 concurrency/redaction/rollback/cleanup tests, and the existing built two-mode perimeter probe.

Excluded:

- provider WAF/bot/challenge/IP-reputation controls, dashboards, alerts, SIEM, production logging backend, deployment, real Google, real data, load/soak testing, provider verification, and incident exercise;
- capacity or production-readiness claims; the checked-in v1 ceilings are conservative pre-preview safety defaults and require later pilot calibration;
- privileged recovery, new-order eligibility/capacity, payment, upload, KMS/private-data work, or cache implementation;
- Strix authorization, plan, execution, report, or external model transfer.

## 6. Verified live repository state

Verified 2026-08-10 19:51 WIB:

| Field | State |
|---|---|
| Local project | `/Users/miclawrencee/Workspace/NitipCuy` |
| Canonical remote | `https://github.com/BurinSn/NitipCuy` |
| Visibility / default branch | Private / `main` |
| `main`, `origin/main`, branch base | `23a6015781228cb04e167b83f6a28b3d3cc0b62d` |
| Active issue | #11, open |
| Active branch | `sec/11-shared-abuse-observability` |
| Pull request | #12, open, not draft, GitHub `CLEAN` / `MERGEABLE` at live head `64ba91501d06ac06d47e1bdb9a81ffcea8da45be`; hostile policy verdict is `CHANGES REQUIRED` until the local corrections are committed and re-reviewed |
| Worktree | Intended caller-target, alternate-client-network, adversarial-test, and lifecycle/specialist-document corrections only; no unrelated dirty files observed |
| Deployment / providers | None deployed or activated |
| Strix issue state | `NOT REQUIRED` / `NOT APPLICABLE`, target class `NO TARGET` under the approved zero-external-Strix-AI path |
| Merge authority | None; fresh BurinSN approval is required after exact-head evidence is visible |

## 7. Current implementation state

- `packages/adapters/src/postgres-abuse-protection.ts` owns validated policy input, subject HMAC, one PostgreSQL-sampled production timestamp, deterministic axis lock order, shared read-committed transactional increments with bounded connection-wait/transaction time, bounded cleanup, first-denial audit claims, and generic authority failure. Injected time requires an explicit disposable-test-database acknowledgement.
- Migration `20260810090000_shared_abuse_controls` adds only the enum and `abuse_rate_limit_bucket` table with composite authority key, digest/window/count constraints, and expiry index.
- `apps/web/src/server/abuse-policy.ts` is the sole v1 route-policy authority. Policy revisions are explicit storage keys so a safety ceiling cannot silently change in place. The correction candidate makes anonymous target identity network-target and authenticated target identity account-target using a validated, length-framed, domain-separated digest before the storage HMAC.
- The request perimeter requires a separate exact 32-byte HMAC key. Trusted proxy mode requires one canonical `X-Forwarded-For` address; local-direct mode accepts absent or framework-inserted loopback only. A maintained set of alternate client-network authorities fails closed, and raw forwarding, alternate client-network, and proof headers do not reach routes.
- Existing persisted routes call the common guard. Session validation uses both network and presented opaque-session axes before database validation; protected route policies add authenticated account/session and relevant target axes.
- Denial events use bounded action/reason/target categories. Bucket subjects are HMAC digests and audit rows contain no raw limiter subject.
- Fixed windows intentionally remain simple and source/integration tested. Their boundary-burst characteristic, HMAC-rotation reset risk, policy calibration, mixed-version policy evolution, aggregate per-request cleanup load, and external monitoring remain activation work.

## 8. Verification state

Rejected as evidence:

- the ambient Node.js `26.0.0` / pnpm `9.15.0` invocation stopped at `engine-strict` before generation or tests;
- the first built-runtime attempt after adding client-network validation returned local `421` because Next.js inserts a loopback forwarding value. The policy was corrected to accept only absent or canonical loopback in explicit local-direct mode; that failed run is correction evidence, not a pass.

Passed with exact Node.js `24.18.0` and pnpm `11.17.0`:

- complete `pnpm check`: formatting, lint, dependency boundaries across 4 projects / 69 source files / 227 module references, strict type checking, 185 tests, production build, and the two-mode built-runtime perimeter probe;
- 17 review-governance tests, 21 dependency-boundary tests, 19 domain tests, and 20 application tests;
- 43 web tests covering policy construction, generic `429`/`503`, key/perimeter behavior, hostile client addresses, proxy behavior, and existing HTTP boundaries;
- 65 adapter tests, including disposable PostgreSQL clean migration, database-time authority, cross-instance concurrent admission, four-axis denial, HMAC redaction, atomic audit rollback, fixed-window rollover, and bounded cleanup;
- production dependency audit with no known vulnerability;
- lifecycle participation, diff hygiene, high-confidence secret/unsafe-execution/sensitive-logging scans, 36 local Markdown links across 22 tracked Markdown files, and parsing of all 7 tracked YAML files;
- built runtime probe in direct and simulated trusted-proxy modes: root `200`, unauthenticated session `401`, unknown trip `404`, hostile host/forwarding/prefetch `421`, fresh matching nonce CSP, private/denied `no-store`, HSTS, and edge-proof non-disclosure;
- complete candidate-diff DRY and hostile source-security review found no unresolved actionable issue.

Superseded review conclusion and current correction evidence:

- the complete hostile review of live head `64ba91501d06ac06d47e1bdb9a81ffcea8da45be` superseded the earlier clean verdict after finding that raw target-only buckets let one caller deny unrelated users and that common alternate client-IP headers survived the downstream clone;
- the local correction now derives caller-target identities, rejects/strips nine maintained alternate client-network headers, and passes 49 focused policy/perimeter tests with exact Node.js `24.18.0` and pnpm `11.17.0`;
- complete exact-toolchain `pnpm check` passed formatting, lint, 4-project boundaries across 69 source files / 228 references, strict types, 205 tests, production build, and the corrected two-mode runtime probe; `pnpm audit:prod` found no known vulnerability and lifecycle participation passed;
- 36 local Markdown links across 22 tracked Markdown files, 7 tracked YAML parses, diff hygiene, and high-confidence credential, unsafe-execution/query, and sensitive-logging scans passed;
- the prior hosted runs remain evidence only for the superseded head. Hosted, DRY, and hostile re-verification of the correction head is still required before merge approval.

Hosted checkpoint `33e67b5b7139327fbf67f3c701441ecb779e2ff8`:

- application-quality run `31359479398`, lifecycle run `31359479386`, and final review-governance run `31359650901` passed with zero annotations;
- the live issue/PR governed fields and exact DRY pins matched;
- GitHub reported the pull request open, not draft, clean, and mergeable with no review object or review decision;
- CodeRabbit selected the 38-file exact-head diff but reported its Free-plan review limit and supplied no review object, line comment, or finding. Its status is external-AI processing disclosure, not security evidence or approval;
- one earlier review-governance event on the same SHA was automatically cancelled when the PR-body edit replaced it; the final replacement run passed and no failed check exists.

Still pending:

- commit/push of the synchronized correction, successor-head DRY repinning, repeated hosted exact-head checks, fresh complete-diff hostile review, and fresh BurinSN merge approval.

## 9. Authority and non-claims

- BurinSN authorized proceeding with the next bounded Stage 1 slice and the normal governed issue/branch/code/test/documentation/pull-request workflow.
- This does not authorize merge, deployment, provider or production configuration, real-user testing, external target testing, payment movement, public launch, or Strix execution.
- Issue #11 selects no Strix target under the approved zero-external-Strix-AI direction. The compensating evidence is complete hostile source review, deterministic negative tests, disposable-database concurrency/outage tests, dependency audit, and the built local runtime probe. This is not a penetration test.
- The existing CodeRabbit GitHub integration may process a future PR diff; if it does, disclose that separately. It is not Strix evidence or owner approval.
- No live edge has verified header overwrite, proof injection, IP format, ingress restriction, alternate-origin denial, WAF, bot controls, or rate-limit compatibility.
- No load, browser, real Google, monitoring backend, alert route, managed key, backup, incident, staging, or production environment has been tested.

## 10. Exact next action

Commit and push the locally verified synchronized correction, pin issue #11 and pull request #12 to that immutable SHA, inspect all hosted checks and annotations, and repeat the complete-base-diff DRY and hostile security review. Request fresh BurinSN merge approval only if the exact corrected head is fully green, cleanly mergeable, and finding-free. Otherwise correct and repeat. Do not merge without that approval.
