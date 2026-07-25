# NitipCuy Changes

## 1. Role, authority, and freshness contract

This is the append-only material-change history. It answers:

- What changed?
- Why did it change?
- What product, technical, security, operational, or documentation impact resulted?
- What was actually verified?
- What remained partial, blocked, or unverified at that time?

Historical entries remain truthful to the time they were written. Their old status, follow-up, branch, commit, or verification must never be used as current state. Use `handoff.md` for live operational truth and `docs/roadmap.md` for current stage, sequencing, gates, and upcoming work.

Never delete or silently rewrite a merged historical entry to make the project appear cleaner. Correct it with a newer dated entry that identifies what it supersedes.

## 2. Mandatory update contract

Every material session must append one entry before completion, including documentation-only, planning, security, dependency, configuration, schema, provider, workflow, or governance work.

An entry must record:

- Asia/Jakarta date and time;
- issue and pull request when applicable;
- product or surface;
- change type and status;
- objective and bounded scope;
- concrete changes;
- user or business impact;
- verification commands and exact results;
- all lifecycle and specialist documents updated;
- residual risks, exclusions, and unverified claims;
- exact follow-up.

A session with no material change does not invent an entry. A session that makes a material change is incomplete while this file is stale.

## 3. Entry template

```markdown
## YYYY-MM-DD HH:MM WIB - Short factual title

- Issue / PR:
- Product:
- Type:
- Status: Complete | Partial | Blocked | Prepared, pending merge
- Objective:
- Scope:
- Changes:
- Impact:
- Validation:
- Documentation:
- Residual risks / exclusions:
- Follow-up:
```

## 2026-07-25 - Product planning baseline created

- Products: NitipCuy
- Type: Product and commercial planning
- Status: Documentation complete; implementation not started
- Summary:
  - Established NitipCuy as a standalone BurinSN product using the verified `Cuy` naming pattern.
  - Accepted Shop for me and Carry my item as the two primary service modes.
  - Recorded trip-first discovery, public listing discussion, private order communication, address-before-commitment, seller location disclosure, pickup QR/OTP, logistics evidence, documented weight, and transaction-only reputation.
  - Accepted active marketplace risk scanning and severity-based enforcement, including immediate action for severe prohibited conduct.
  - Accepted transaction-fee monetization with no subscription and a provisional 3 percent, Rp15,000 minimum, Rp100,000 maximum fee.
  - Recorded DOKU as the conditional preferred Partner/Aggregator provider and QRIS plus selected VA as MVP rails.
  - Recorded DOKU fees, settlement, refund, chargeback, Hold, Split, seller-capital, reconciliation, and contract blockers.
  - Created the canonical roadmap, product specification, lifecycle, moderation model, DOKU evaluation, ADRs, learning record, README, contributor rules, and handoff.
- Validation:
  - Cross-checked the `Cuy` naming pattern against BCN's MampirCuy and NgantorCuy documentation.
  - DOKU facts are dated and linked to official DOKU sources.
  - No code, Git repository, provider account, external communication, payment movement, or deployment was created.
- Follow-up:
  - Prepare the DOKU questionnaire, research active Threads cases, define the pilot risk and cancellation boundaries, and evaluate Biteship.

## 2026-07-25 - Platform-first sequencing and repository creation

- Products: NitipCuy
- Type: Product sequencing and repository governance
- Status: Complete
- Summary:
  - Corrected the roadmap so platform development begins before additional Threads research.
  - Moved Threads to the public-beta acquisition, promotion, recruitment, and feature-feedback stage.
  - Established that DOKU, Biteship, legal-policy, and pilot-risk unknowns block real-money launch but do not block building against provider-independent mock ports.
  - Created the private `BurinSn/NitipCuy` GitHub repository using BurinSn's verified private-repository and `main`-branch convention.
  - Added baseline Git workflow, pull-request template, safe ignore rules, and canonical repository references.
- Validation:
  - Verified the authenticated GitHub user is `miclawrenceee`.
  - Verified all existing listed BurinSn product repositories are private and normally use `main`.
  - Verified `BurinSn/NitipCuy` did not exist before creation.
  - Initial baseline commit `70b4c96a0df486b70e626434338e0b20dec7df1f` was pushed to `main`.
  - Local `main`, local `origin/main`, GitHub `main`, and `git ls-remote` matched the exact baseline commit after push.
  - GitHub reported the canonical repository as private, unarchived, and using `main`.
- Follow-up:
  - Open the first architecture and application-scaffolding issue.

## 2026-07-25 07:40 WIB - Lifecycle documentation governance hardened

- Issue / PR: Issue #1; pull request #2
- Product: NitipCuy
- Type: Documentation governance and drift prevention
- Status: Prepared and pushed; pull request checks and approval pending
- Objective:
  - Make the four lifecycle documents authoritative, current, non-overlapping, and enforceable for future sessions.
- Scope:
  - `handoff.md`, `docs/changes.md`, `docs/roadmap.md`, `docs/learning.md`, contributor rules, pull-request governance, and lifecycle freshness checks.
- Changes:
  - Assigned one explicit role and authority boundary to each lifecycle document.
  - Added mandatory update triggers, reading rules, stale-state stop conditions, and historical-entry interpretation rules.
  - Pinned the product compass, non-goals, platform-first sequence, provider-independent boundary, launch gates, and exact next platform slice.
  - Corrected the distinction between the first baseline commit and current repository state.
  - Made deferred Threads research explicit so it cannot reappear as a platform-build gate.
  - Added a fail-closed lifecycle file-presence check for local and pull-request use.
- Impact:
  - Future sessions have a deterministic resume path and cannot truthfully declare material work complete while any of the four lifecycle documents is omitted.
  - Historical records remain auditable without competing with current-state authority.
- Validation:
  - `scripts/check-lifecycle-docs.sh origin/main` passed.
  - `bash -n scripts/check-lifecycle-docs.sh` passed.
  - Workflow YAML parsed successfully.
  - Internal Markdown links, `git diff --check`, naming and placeholder scan, and credential-pattern scan passed.
  - GitHub branch-protection query returned `403`: private-repository branch protection requires a higher plan or public visibility.
  - `shellcheck` and `actionlint` are unavailable locally; their specialist validation was not claimed.
  - Branch head `db936aa94c525b8eeb2d48a20cf752eaac1dd419` was pushed and pull request #2 was opened against `main`.
  - Lifecycle workflow and CodeRabbit review were pending at 07:48 WIB.
- Documentation:
  - Updated all four lifecycle documents plus `AGENTS.md` and the pull-request template.
- Residual risks / exclusions:
  - File-presence automation proves that all four documents changed, not that their content is correct. Human hostile review remains mandatory.
  - GitHub cannot technically require the lifecycle check on the current private-repository plan. A green check is enforced by project policy and explicit merge approval.
  - No application architecture, scaffolding, provider contact, payment, logistics integration, deployment, or product-scope change is included.
- Follow-up:
  - Wait for pull request #2 checks and review, resolve findings, refresh all four lifecycle files, and request BurinSN merge approval.
