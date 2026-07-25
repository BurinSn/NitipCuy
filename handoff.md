# NitipCuy Cross-Session Handoff

Last updated: 2026-07-25 11:14 WIB

Handoff owner: Codex

Product owner: BurinSN

## 1. Role, authority, and freshness contract

This file is the single operational resume point. It answers:

- What is the verified repository state now?
- What bounded work is active?
- What is complete, partial, blocked, or unverified?
- What authority has and has not been granted?
- What exact action must happen next?

This file is current-state documentation, not an append-only history. Update it during every material work session and whenever the issue, branch, pull request, commit, verification result, blocker, authority boundary, or exact next action changes.

The handoff is stale and work must stop when any live claim below disagrees with Git, GitHub, a connected provider, an accepted ADR, or current BurinSN direction. Verified live state wins. Reconcile this file before continuing.

The handoff does not authorize a merge, deployment, provider contact, payment movement, production action, product-scope change, or external communication.

## 2. Mandatory resume protocol

Before planning or changing the project:

1. Read `AGENTS.md`.
2. Read `docs/roadmap.md`.
3. Read this handoff.
4. Read the newest entry in `docs/changes.md`.
5. Read the newest relevant entries in `docs/learning.md`.
6. Read `docs/product/master-specification.md`.
7. Read relevant ADRs and specialist documents.
8. Read `docs/development/git-workflow.md` before Git or GitHub mutations.
9. Verify local branch, status, head, remote tracking, open issue, open pull request, and CI state.
10. Reconcile every mismatch before implementation.

Minimum local verification:

```bash
git status --short --branch
git rev-parse HEAD
git rev-parse origin/main
git log --oneline --decorate -5
```

Do not inspect or expose `.env*`, credentials, private keys, identity documents, payment data, or production secrets while gathering context.

## 3. Product compass

NitipCuy is a standalone BurinSN marketplace for independent jastippers and customers. It is separate from BCN.

The platform has two primary service modes:

1. **Shop for me**: the jastipper purchases an item for the customer.
2. **Carry my item**: the customer already owns or arranged the item and hires a jastipper to collect or carry it.

Non-negotiable product boundaries:

- Discovery is trip-first, route-aware, destination-aware, and timeline-aware.
- Jastippers set their own item, service, kilogram, minimum, maximum, capacity, pickup, and delivery terms.
- NitipCuy does not impose a mandatory seller rate.
- Public discussion handles reusable trip, listing, and request questions.
- Private communication handles addresses, identity data, receipts, disputes, and personal order details.
- Addresses and final-delivery terms are known before paid commitment.
- Only protected platform transactions receive platform protection and verified transaction reviews.
- The revenue model is a disclosed transaction protection fee, not subscriptions or paid boosts.
- The planning fee is 3 percent, minimum Rp15,000 and maximum Rp100,000, subject to provider and pilot economics.
- Active risk scanning, evidence, enforcement, appeals, disputes, and reconciliation are platform responsibilities.
- Severe prohibited conduct may be removed or suspended immediately without warning-first treatment.
- NitipCuy is not designed to become the cross-border merchant, importer, customs broker, carrier, or legal seller of jastipper goods.

The canonical product model is `docs/product/master-specification.md`. The binding accepted decisions are in `docs/decisions/`.

## 4. Delivery strategy

Build the platform first.

- Additional Threads market research is not a platform-development gate.
- Threads is reserved for later jastipper acquisition, trip promotion, feature feedback, and workflow validation once there is a demonstrable platform.
- DOKU is the conditional preferred payment provider.
- Biteship is an unapproved logistics candidate.
- DOKU, Biteship, legal, and policy unknowns block real-money pilot activation, not development against provider-independent mock ports.
- Production-specific provider behavior must not leak into the core order, ledger, evidence, moderation, or dispute model.

## 5. Verified repository state

| Field | Verified state |
|---|---|
| Local project | `/Users/miclawrencee/Workspace/NitipCuy` |
| Canonical remote | `https://github.com/BurinSn/NitipCuy` |
| Visibility | Private |
| Default branch | `main` |
| Verified `main` base | `6fe622733bdf457448ed0e8670ff5249ce3ca6fe` |
| Active issue | `#1 Harden lifecycle documentation against stale state and product drift` |
| Active branch | `docs/1-lifecycle-governance` |
| Pull request | `#2 docs: enforce lifecycle documentation freshness` |
| Last pushed checkpoint before this handoff edit | `7491442a9db85c33e7bcda3967783c35cc699b0b` |
| Pull-request checks at that checkpoint | Lifecycle workflow passed; CodeRabbit was successful but provided no review object or findings |
| Live pull-request head and checks | Volatile; retrieve directly from GitHub before merge |
| Merge authority | Granted by BurinSN on 2026-07-25, conditional on final exact-head audit and green lifecycle workflow |
| Branch protection | Unavailable for this private repository on the current GitHub plan |
| Deployment | None |
| Production providers | None activated |

The earlier `70b4c96a0df486b70e626434338e0b20dec7df1f` commit is the first documentation baseline, not the current `main` tip. Future sessions must never treat it as current repository state.

Do not hard-code a tracked handoff file's own containing commit as its current head: committing that claim immediately creates a newer head. The checkpoint above is timestamped evidence, not permission to skip live `git rev-parse` and GitHub verification.

## 6. Current work item

Issue #1 hardens the four lifecycle documents and their enforcement:

- `handoff.md`
- `docs/changes.md`
- `docs/roadmap.md`
- `docs/learning.md`

In scope:

- define a unique role, authority, update trigger, and reading rule for each document;
- reconcile product, sequencing, provider, risk, and repository truth;
- remove ambiguity between historical and current claims;
- enforce the four-file update requirement locally and in pull requests;
- update contributor and pull-request governance;
- hostile-review the complete documentation set for contradiction and drift.

Out of scope:

- application architecture or scaffolding;
- UI or visual design;
- DOKU, Biteship, or Threads outreach;
- provider onboarding, payment movement, deployment, or production changes;
- new product-scope decisions.

## 7. Current stage and next platform slice

Current roadmap stage: Stage 1 - Platform foundation.

After issue #1 is merged, the next hosted issue must cover architecture and application scaffolding. It must decide and document:

- web-first stack and deployment target;
- identity and authorization direction;
- database and migration direction;
- provider-independent payment and logistics ports;
- local development, quality, security, test, and CI gates;
- the first vertical slice:

```text
account
  -> jastipper profile
  -> trip publication
  -> destination and date search
  -> trip detail
  -> public question and answer
```

## 8. Blockers and gates

There is no external blocker to lifecycle governance, architecture, experience design, or building with mock providers.

The following block real-money pilot launch:

1. Written DOKU Partner/Aggregator approval and complete commercial terms.
2. Confirmed Hold plus Split channels, maximum hold, partial release, refund, reserve, and failure behavior.
3. Approved logistics integration and exception model.
4. Route-aware prohibited and restricted-item taxonomy.
5. Cancellation, refund, dispute, insurance, loss, damage, and provider-cost allocation policy.
6. Pilot route, category, value, weight, capacity, and participant boundaries.
7. Legal, privacy, security, incident-response, and operational sign-off.

Do not convert a launch blocker into a reason to delay provider-independent platform work.

## 9. Verification and unresolved evidence

Verified:

- local `main` and `origin/main` matched `6fe622733bdf457448ed0e8670ff5249ce3ca6fe` before branch creation;
- the worktree was clean before issue #1 work;
- GitHub repository visibility is private and default branch is `main`;
- issue #1 exists and owns this bounded documentation hardening pass;
- accepted product and payment decisions match the master specification, ADRs, and active Global Brain entries.

Volatile evidence that must always be retrieved live:

- pull-request head;
- lifecycle workflow state for that exact head;
- review objects and findings;
- mergeability and issue state;
- post-merge `main` and branch state.

Do not store a transient `pending`, `passed`, or current PR-head claim here as permanent current truth.

Verified for issue #1:

- local lifecycle check passed;
- shell syntax check passed;
- workflow YAML parsed;
- internal links, formatting, naming, placeholder, and credential-pattern scans passed;
- lifecycle authority, product-boundary, provider-boundary, Threads-sequencing, and historical-versus-current contradiction review passed;
- branch-protection API returned `403`, so a green lifecycle check must be manually enforced as a merge policy.
- `shellcheck` and `actionlint` were unavailable locally and were not claimed.
- branch `docs/1-lifecycle-governance` content was committed and pushed at `db936aa94c525b8eeb2d48a20cf752eaac1dd419`;
- pull request #2 was opened against `main`;
- lifecycle state commit `d31b39bbbf7cf70d5e48c38ec8f58c49f187f619` was pushed;
- the lifecycle workflow passed at that checkpoint;
- CodeRabbit reported pass only because review was rate-limited, so no independent review was performed.
- BurinSN reviewed the disclosed check and review limitations and explicitly authorized final correction, audit, and merge of pull request #2 on 2026-07-25.
- The final full-diff audit found and corrected direct GitHub-context interpolation in the lifecycle workflow; the base ref now crosses into the shell through an environment variable.

## 10. Exact next action

Resolve the transition from live state:

- If pull request #2 is open, verify its exact head, lifecycle workflow, review objects, mergeability, and complete base diff; post the audit evidence; then squash-merge under the recorded BurinSN authority.
- If pull request #2 is merged, verify `main`, issue #1 closure, and remote/local branch cleanup; then create the architecture and application-scaffolding issue as the next governed slice.

Do not begin application scaffolding before the issue #1 merge and cleanup are verified.
