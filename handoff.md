# NitipCuy Cross-Session Handoff

Last updated: 2026-08-07 14:08 WIB

Handoff owner: Codex

Product owner: BurinSN

## 1. Role, authority, and freshness contract

This file is the single operational resume point. It owns verified repository state, active bounded work, authority boundaries, blockers, verification, and the exact next action. Live Git and GitHub state override this timestamped record.

This handoff never grants merge, deployment, real-provider configuration, external security testing, payment movement, production action, visual approval, or product-scope authority.

## 2. Mandatory resume protocol

Before changing NitipCuy:

1. read `AGENTS.md`, `docs/roadmap.md`, this handoff, the latest `docs/changes.md`, and relevant `docs/learning.md`;
2. read the relevant product, architecture, security, resilience, quality, Git, and review-governance authorities;
3. verify branch, status, local head, `origin/main`, issue #7, any pull request, reviews, and exact-head checks;
4. preserve unexpected work and reconcile stale lifecycle or specialist claims before implementation;
5. do not inspect or expose `.env*`, credentials, keys, browser sessions, private identity data, customer data, or production secrets.

Minimum local verification:

```bash
git status --short --branch
git rev-parse HEAD
git rev-parse origin/main
git log --oneline --decorate -5
```

## 3. Product compass

NitipCuy is a standalone BurinSN marketplace connecting customers with independent jastippers. It supports Shop for me and Carry my item. Jastippers set their own prices and terms; NitipCuy earns an approved transaction-protection fee direction rather than subscriptions. Public trip discussion is reusable and contains no private address, identity, order, evidence, or payment data.

The current Stage 1 product slice stops before orders, addresses, private chat, real evidence, payments, logistics, disputes, real provider activation, or production deployment. Issue #7 changes review governance only and does not alter that product boundary.

## 4. Completed persisted foundation

Issue [#5](https://github.com/BurinSn/NitipCuy/issues/5) and pull request [#6](https://github.com/BurinSn/NitipCuy/pull/6) delivered:

```text
verified Google OIDC proof
  -> internal account
  -> revocable base-assurance session
  -> owned jastipper profile
  -> owned trip draft
  -> privileged moderation decision
  -> published safe projection
  -> anonymous bounded search/detail
  -> authenticated public question
  -> trip-owner answer
```

Verified merge evidence:

- approved PR head `18213db14f373a7a17c5496ed6bc6b04034e08a2`;
- application-quality run `31153847007` passed with zero annotations;
- lifecycle run `31153847009` passed with zero annotations;
- pull request #6 squash-merged as `f38cdaf144ff3c22c39e7a28544363fdb0fd0a19` at 2026-08-07 13:27 WIB;
- issue #5 closed and the remote feature branch was deleted;
- no independent GitHub review object existed; BurinSN approval was explicit and bounded to that reviewed merge.

Evidence remains source-tested, production-build-tested, missing-configuration-runtime-tested, and local disposable-database-runtime-tested. It is not real-Google-, browser-, managed-database-, load-, guarded-Strix-, provider-, incident-, visual-, or production-verified.

## 5. Active issue #7 direction

Issue [#7](https://github.com/BurinSn/NitipCuy/issues/7) governs visible DRY and guarded-Strix progress for every future material issue and pull request.

Accepted behavior:

- one versioned material-change issue form declares DRY scope/status and Strix applicability/status/target class;
- one pull-request contract records an exact-head DRY verdict and the guarded Strix authorization, plan, execution, findings, and evidence state or a concrete non-applicability record;
- the linked issue and pull request must agree on review progress;
- only `CLEAN` or `CLEAN WITH NOTES` DRY verdicts are merge-eligible;
- required Strix work must reach `TRIAGED` or `REMEDIATION VERIFIED`;
- the read-only hosted workflow validates declarations and emits a progress summary but contains no Strix execution path;
- a new PR commit invalidates a stale DRY reviewed revision;
- passing automation does not prove review quality, security, or owner approval.

Issue #7 classifies Strix as `NOT REQUIRED` / `NOT APPLICABLE` with target class `NO TARGET`. The change governs documentation, templates, a validator, tests, and read-only CI; it adds no runnable application target. A complete hostile source review is still required.

## 6. Verified repository and GitHub state

Verified 2026-08-07 before the current uncommitted documentation reconciliation:

| Field | State |
|---|---|
| Local project | `/Users/miclawrencee/Workspace/NitipCuy` |
| Canonical remote | `https://github.com/BurinSn/NitipCuy` |
| Visibility / default branch | Private / `main` |
| `main` and `origin/main` | `f38cdaf144ff3c22c39e7a28544363fdb0fd0a19` |
| Persisted foundation | Pull request #6 merged; issue #5 closed |
| Active issue | #7, open |
| Active branch | `chore/7-review-governance`, based on `f38cdaf144ff3c22c39e7a28544363fdb0fd0a19` |
| Pull request | #8, open, not draft, GitHub-mergeable at implementation head `fcf9628241dd12a2e0a04dc88225a6a776243a19` before this lifecycle edit |
| Current worktree | Clean at pushed implementation head before this PR-state lifecycle edit |
| Deployment / providers | None deployed; no provider configured or activated |
| Strix authority | None; no authorization, plan, or execution requested for a target |
| Merge authority | None; a future pull request requires exact-head evidence and fresh BurinSN approval |

## 7. Implemented working-tree scope

- `.github/ISSUE_TEMPLATE/material-change.yml` and `config.yml` establish the required issue record and disable blank issues.
- `.github/PULL_REQUEST_TEMPLATE.md` exposes exact-head DRY and guarded-Strix evidence.
- `scripts/check-review-governance.mjs` validates the PR, retrieves one linked open issue, compares governed states, and writes only a concise step summary.
- `scripts/review-governance.test.mjs` contains 17 adversarial fixtures covering final and unfinished DRY states, vocabulary drift, fenced Markdown, duplicate headings and closing lines, exact-head drift, required and non-required Strix paths, target/environment mismatch, budget ceiling, missing authorization evidence, state mismatch, and schema failure.
- `.github/workflows/review-governance.yml` uses read-only contents/issues/PR permissions, pinned actions, exact Node, and no scanner invocation.
- `docs/development/review-governance.md` owns the status vocabulary, evidence contract, applicability decision, guarded lifecycle, and automation limits.
- `AGENTS.md`, `README.md`, Git, quality, security, architecture, resilience, and lifecycle documentation are being reconciled with the new authority and the completed PR #6 state.

## 8. Verification state

Passed on exact Node.js `24.18.0` and pnpm `11.17.0`:

- dependency-free review-governance tests: 17 passed;
- `pnpm check`: formatting, lint, 61-source/193-reference dependency scan, strict types, 21 boundary tests, 104 package/web tests including disposable PostgreSQL, governance tests, and production build;
- frozen install and peer validation;
- production audit: zero findings at every severity;
- lifecycle participation, YAML parsing, 35 local links across 22 Markdown files, and diff hygiene;
- candidate complete-diff DRY review: `CLEAN WITH NOTES` after fixing status-vocabulary drift risk, duplicate-heading/closing-line bypasses, target/environment mismatch, and missing tested-revision/mode/scope/budget binding;
- hostile security review: no unresolved actionable finding; workflow remains read-only and has no scanner-execution path.
- manual live-state verification of `main`, pull request #6, issue #5, and issue #7 before editing.
- hosted `Review governance` run `31156499668` passed at implementation head `fcf9628241dd12a2e0a04dc88225a6a776243a19` with zero annotations, exercising the real PR body and linked issue #7.

Still required before pull-request creation:

- commit and push this PR-state lifecycle checkpoint;
- final exact committed-head DRY review and PR-body pin;
- all three hosted workflows and annotations on that final head;
- live PR/review/mergeability reconciliation before fresh owner review.

## 9. Authority and non-claims

- BurinSN authorized implementation of the DRY and Strix progress rule.
- This authority permits the governed issue, branch, repository changes, verification, and pull-request creation required by the normal workflow.
- It does not authorize a Strix target, guard authorization, dry-run plan, scan execution, production test, provider configuration, deployment, public launch, or merge.
- The validator checks declared evidence only. It cannot prove a reviewer inspected the diff, that a guard artifact is genuine, that findings were correctly triaged, or that NitipCuy is secure.

## 10. Exact next action

Commit and push this PR-state lifecycle checkpoint, then re-review the exact new head, update pull request #8's reviewed revision, and inspect all hosted runs and annotations before requesting fresh BurinSN review.
