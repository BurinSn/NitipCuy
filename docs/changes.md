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
  - Follow-up checkpoint `d31b39bbbf7cf70d5e48c38ec8f58c49f187f619` was pushed.
  - Lifecycle workflow passed at that checkpoint.
  - CodeRabbit reported pass because its review was rate-limited; it provided no independent review coverage.
- Documentation:
  - Updated all four lifecycle documents plus `AGENTS.md` and the pull-request template.
- Residual risks / exclusions:
  - File-presence automation proves that all four documents changed, not that their content is correct. Human hostile review remains mandatory.
  - GitHub cannot technically require the lifecycle check on the current private-repository plan. A green check is enforced by project policy and explicit merge approval.
  - No application architecture, scaffolding, provider contact, payment, logistics integration, deployment, or product-scope change is included.
- Follow-up:
  - Push the final lifecycle-state update, verify the rerun on the live PR head, disclose the missing independent review coverage, and request BurinSN merge approval.

## 2026-07-25 11:09 WIB - Final merge authority and volatile-state correction

- Issue / PR: Issue #1; pull request #2
- Product: NitipCuy
- Type: Documentation correction and merge authorization
- Status: Authorized; exact-head audit and merge pending
- Objective:
  - Remove the last transient external-state claims and finish the issue #1 governance change under explicit BurinSN authority.
- Scope:
  - All four lifecycle documents and pull request #2 metadata.
- Changes:
  - Replaced stale `pending` and `not yet verified` language with a durable rule requiring live GitHub verification.
  - Kept immutable checkpoints as timestamped evidence rather than presenting them as the current branch head.
  - Added a conditional handoff transition that remains correct before and after merge.
  - Recorded BurinSN authorization for final correction, audit, comments, merge, issue handling, and branch cleanup.
  - Preserved the platform-first roadmap and every accepted product boundary without change.
- Impact:
  - Future sessions cannot confuse a tracked documentation snapshot with live PR, CI, review, or merge state.
  - The issue #1 transition can complete without making the handoff stale solely because GitHub state changes after commit.
- Validation:
  - Before this correction, pull request #2 head `d33e158bf5a73395a9efb1f4f7b8f4583f0252b9` was clean, open, and mergeable.
  - The lifecycle workflow passed on that head.
  - CodeRabbit had no review object or findings because its review was rate-limited.
  - Product alignment hostile review found no drift.
- Documentation:
  - Updated `handoff.md`, `docs/changes.md`, `docs/roadmap.md`, and `docs/learning.md`.
- Residual risks / exclusions:
  - Branch protection remains unavailable for the private repository on the current GitHub plan.
  - No independent automated review coverage is available for this PR.
  - Application architecture, scaffolding, providers, payments, deployment, and product scope remain excluded.
- Follow-up:
  - Push the corrected head, wait for its lifecycle workflow, perform and post the final audit, squash-merge pull request #2, verify issue closure and `main`, and clean up the branch.

## 2026-07-25 11:14 WIB - Lifecycle workflow context handling hardened

- Issue / PR: Issue #1; pull request #2
- Product: NitipCuy
- Type: Workflow security correction
- Status: Prepared; exact-head workflow and merge pending
- Objective:
  - Remove direct GitHub-context interpolation from the lifecycle workflow before merge.
- Scope:
  - Pull-request lifecycle workflow and all four mandatory lifecycle documents.
- Changes:
  - Moved `github.base_ref` into a step environment variable.
  - Passed the resulting base ref to the shell script through a quoted shell variable.
  - Preserved the pull-request-only trigger, read-only repository permission, full-history checkout, and existing lifecycle check.
  - Refreshed all four lifecycle documents without changing product scope or roadmap order.
- Impact:
  - GitHub context data no longer appears directly inside the generated shell command.
  - The workflow remains functionally identical for pull requests against `main`.
- Validation:
  - Pre-correction pull-request head `7491442a9db85c33e7bcda3967783c35cc699b0b` was clean and mergeable.
  - Lifecycle workflow run `30143630722` passed on that exact head.
  - Full-diff audit identified the interpolation risk before merge.
  - Local lifecycle, shell syntax, workflow YAML, direct-context-interpolation, formatting, link, naming, placeholder, credential-pattern, and product-alignment checks passed after the correction.
- Documentation:
  - Updated `handoff.md`, `docs/changes.md`, `docs/roadmap.md`, and `docs/learning.md`.
- Residual risks / exclusions:
  - A fresh pull-request workflow must pass on the corrected exact head.
  - CodeRabbit has no review object or independent findings for this pull request.
  - Application architecture, scaffolding, providers, payments, deployment, and product scope remain excluded.
- Follow-up:
  - Commit and push the correction, wait for exact-head checks, repeat the final audit, post evidence, and squash-merge under the recorded BurinSN authority.

## 2026-07-25 11:17 WIB - Workflow action pinned to immutable commit

- Issue / PR: Issue #1; pull request #2
- Product: NitipCuy
- Type: Workflow supply-chain hardening
- Status: Prepared; exact-head workflow and merge pending
- Objective:
  - Remove the final moving third-party action reference before merge.
- Scope:
  - Pull-request lifecycle workflow and all four mandatory lifecycle documents.
- Changes:
  - Replaced `actions/checkout@v4` with verified immutable commit `11d5960a326750d5838078e36cf38b85af677262`.
  - Kept a `v4` comment for maintainability.
  - Preserved the pull-request trigger, read-only permission, full-history checkout, environment-based base-ref transport, and lifecycle check.
  - Refreshed all four lifecycle documents without changing product scope or roadmap order.
- Impact:
  - The workflow no longer trusts a mutable action tag at execution time.
  - Future checkout upgrades must be deliberate, reviewed commit changes.
- Validation:
  - GitHub API resolved official `actions/checkout` tag `v4` to commit `11d5960a326750d5838078e36cf38b85af677262`.
  - GitHub reports that commit as verified.
  - Pre-correction pull-request head `22f5291ba030159fca6d33fab89fde946e8986c3` passed lifecycle workflow run `30143723423`.
  - Local lifecycle, shell syntax, workflow YAML, immutable-action-reference, formatting, link, naming, placeholder, credential-pattern, and product-alignment checks passed after the pin.
- Documentation:
  - Updated `handoff.md`, `docs/changes.md`, `docs/roadmap.md`, and `docs/learning.md`.
- Residual risks / exclusions:
  - A fresh pull-request workflow must pass on the pinned exact head.
  - CodeRabbit has no review object or independent findings for this pull request.
  - Application architecture, scaffolding, providers, payments, deployment, and product scope remain excluded.
- Follow-up:
  - Validate, commit, and push the pin; wait for exact-head checks; post the final audit; and squash-merge under recorded BurinSN authority.

## 2026-07-25 11:18 WIB - Deprecated checkout runtime upgraded

- Issue / PR: Issue #1; pull request #2
- Product: NitipCuy
- Type: Workflow compatibility and supply-chain correction
- Status: Prepared; exact-head workflow and merge pending
- Objective:
  - Remove the checkout v4 Node.js 20 deprecation warning surfaced by the hosted runner.
- Scope:
  - Pull-request lifecycle workflow and all four mandatory lifecycle documents.
- Changes:
  - Upgraded from checkout v4 to official latest release v7.0.1.
  - Pinned v7.0.1 to verified immutable commit `3d3c42e5aac5ba805825da76410c181273ba90b1`.
  - Preserved the pull-request trigger, read-only permission, full-history checkout, environment-based base-ref transport, and lifecycle check.
  - Refreshed all four lifecycle documents without changing product scope or roadmap order.
- Impact:
  - The workflow no longer depends on checkout v4's deprecated Node.js 20 runtime.
  - The dependency remains immutable and future updates remain explicit.
- Validation:
  - Lifecycle workflow run `30143787972` passed on pre-correction head `f2c9800e1788b510bd5ed2d9537040ea0680f56d` but emitted the Node.js 20 deprecation warning.
  - GitHub API reported v7.0.1 as the latest official `actions/checkout` release, published 2026-07-20.
  - GitHub reports commit `3d3c42e5aac5ba805825da76410c181273ba90b1` as verified.
  - Local lifecycle, shell syntax, workflow YAML, immutable-action-reference, direct-context-interpolation, formatting, link, naming, placeholder, credential-pattern, and product-alignment checks passed after the upgrade.
- Documentation:
  - Updated `handoff.md`, `docs/changes.md`, `docs/roadmap.md`, and `docs/learning.md`.
- Residual risks / exclusions:
  - A fresh pull-request workflow must pass without the checkout v4 warning on the corrected exact head.
  - CodeRabbit has no review object or independent findings for this pull request.
  - Application architecture, scaffolding, providers, payments, deployment, and product scope remain excluded.
- Follow-up:
  - Validate, commit, and push the upgrade; confirm an annotation-free exact-head run; post the final audit; and squash-merge under recorded BurinSN authority.

## 2026-07-25 15:55 WIB - Application architecture foundation prepared

- Issue / PR: Issue #3; pull request not yet opened at this checkpoint
- Product: NitipCuy
- Type: Architecture, application foundation, security, testing, and documentation
- Status: Locally validated; commit and pull-request review pending
- Objective:
  - Establish a maintainable web-first platform foundation that can support NitipCuy marketplace behavior without coupling the core domain to a framework, ORM, identity vendor, payment provider, logistics provider, or host.
- Scope:
  - Architecture ADR and system boundaries; exact toolchain; modular workspace; public trip discovery proof; deterministic mocks; local and hosted quality gates; README, contributor, workflow, and lifecycle documentation.
- Changes:
  - Selected one deployable Next.js modular monolith with inward dependencies across domain, application, adapters, and web delivery.
  - Pinned Node.js `24.18.0`, pnpm `11.17.0`, Next.js `16.2.11`, React `19.2.8`, TypeScript `6.0.3`, ESLint `9.39.5`, Prettier `3.9.6`, Turbo `2.10.6`, and Vitest `4.1.10`.
  - Recorded PostgreSQL plus isolated future Prisma adapter, external passwordless identity, internal deny-by-default authorization, Vercel `sin1`, and Singapore PostgreSQL direction without provisioning anything.
  - Added a published-trip domain model, public discovery use cases, in-memory repository, provider-neutral payment, logistics, identity-verification, evidence-storage, clock, identifier, transaction, audit, and outbox ports, and no-network mocks.
  - Added an Indonesian read-only shell for destination/date search, trip detail, seller-defined terms, and chronological public Q&A using explicitly simulated data.
  - Modeled both an origin-local departure date and an exact timezone-bearing departure timestamp so deadline and arrival rules compare actual instants.
  - Added strict formatting, lint, type, unit, build, audit, and PR-CI gates with read-only permissions and immutable action references.
  - Overrode vulnerable Next.js transitive `postcss` and `sharp` versions with exact patched versions after the production audit blocked the initial graph.
  - Updated the README, architecture, quality, contributor, Git workflow, PR template, and all four mandatory lifecycle documents.
- Impact:
  - Future marketplace slices can develop and test domain behavior without production credentials, money, deliveries, or external-service availability.
  - Public discovery and private transaction data have an explicit architectural boundary before identity or persistence is introduced.
  - The platform shell demonstrates working product structure but remains visually provisional and non-production.
- Validation:
  - Exact Node.js `24.18.0` and pnpm `11.17.0` toolchain used through the local compatibility wrapper.
  - `pnpm peers check` passed with no peer-dependency issues.
  - `pnpm audit:prod` initially failed on vulnerable `postcss` and `sharp`; after reviewed exact overrides it passed with no known production vulnerabilities.
  - `pnpm check` passed formatting, lint, strict type checking in four packages, 13 unit tests in three files, and the Next.js production build.
  - Production build emitted `/`, `/_not-found`, and three generated `/trips/[tripId]` fixture paths plus the route proxy.
  - Production HTTP probe returned `200` for home, filtered search, and a known trip; returned `404` for an unknown trip; and passed content assertions without a server fallback error.
  - Frozen install, lifecycle freshness, `git diff --check`, workflow YAML, internal links, immutable action references, credential patterns, placeholders, dependency direction, provider SDK, unsafe `any`, console, source network, and complete-base-diff checks passed.
  - GitHub verified that the checkout and setup-node action tags resolve to the exact immutable commits used by the workflows.
- Documentation:
  - Added ADR 0003, system architecture, and quality-gate documentation.
  - Updated README, `AGENTS.md`, Git workflow, pull-request template, `handoff.md`, `docs/changes.md`, `docs/roadmap.md`, and `docs/learning.md`.
- Residual risks / exclusions:
  - The current Next.js release does not yet declare the overridden `sharp` major or patched `postcss` version in its own dependency graph; full build, runtime, and audit evidence is mandatory until upstream resolves the graph.
  - No persistence, identity provider, protected mutation, account, private data, provider integration, browser automation, visual approval, preview, deployment, or real transaction is included.
  - DOKU and Biteship remain conditional candidates, not implemented dependencies.
  - Fresh BurinSN approval is still required before issue #3 can merge.
- Follow-up:
  - Commit and push the branch, open the pull request, inspect hosted checks and findings on its immutable head, then request fresh BurinSN merge approval.

## 2026-07-25 16:36 WIB - Architecture pull request opened

- Issue / PR: Issue #3; pull request #4
- Product: NitipCuy
- Type: GitHub review-state transition
- Status: Open; exact-head hosted review pending
- Objective:
  - Move the locally validated architecture foundation into its governed hosted review boundary.
- Scope:
  - Branch publication, pull-request metadata, all four lifecycle documents, and exact-head review instructions.
- Changes:
  - Committed the coherent architecture foundation at `e1d0669e80430c3abc1f4ca4e94637c827bc3f37`.
  - Pushed branch `feat/3-architecture-foundation`.
  - Opened pull request #4 against `main` with issue #3 closure metadata, scope, exclusions, risks, local evidence, and explicit approval gaps.
  - Refreshed all four lifecycle documents for the pull-request transition.
- Impact:
  - Hosted automation and review now run against an immutable review boundary.
  - The pull request remains unapproved and unmerged.
- Validation:
  - GitHub reported pull request #4 open and mergeable at the first pushed checkpoint.
  - Lifecycle workflow passed on that checkpoint.
  - Application quality remained in progress and CodeRabbit remained pending at 16:36 WIB.
  - Those results are superseded when this lifecycle checkpoint changes the pull-request head and must be retrieved again.
- Documentation:
  - Updated `handoff.md`, `docs/changes.md`, `docs/roadmap.md`, and `docs/learning.md`.
- Residual risks / exclusions:
  - Hosted application evidence, annotations, review objects, and findings are not yet final for the resulting head.
  - Branch protection remains unavailable on the current private-repository plan.
  - No deployment, provider contact, real transaction, browser automation, or visual approval is included.
- Follow-up:
  - Push this documentation checkpoint, wait for hosted workflows and review on its exact head, inspect annotations and the complete diff, resolve findings, and request fresh BurinSN approval only when evidence is complete.

## 2026-07-25 16:39 WIB - Hosted architecture checks verified

- Issue / PR: Issue #3; pull request #4
- Product: NitipCuy
- Type: Hosted verification and review-coverage audit
- Status: Hosted technical checks passed; independent review unavailable; owner approval pending
- Objective:
  - Verify hosted evidence and review coverage on the exact post-transition pull-request head without translating a green status into approval.
- Scope:
  - Pull-request head `7623526f1058d67f53ff82076330bc6c9f6afed0`, hosted checks, annotations, reviews, comments, mergeability, and lifecycle state.
- Changes:
  - Recorded the exact-head hosted result and missing independent review coverage.
  - Converted the handoff's next action into a durable live-state condition so this documentation checkpoint does not claim its predecessor remains current.
  - Preserved product scope, architecture, exclusions, and roadmap order unchanged.
- Impact:
  - BurinSN can evaluate the architecture with both successful technical evidence and the disclosed review limitation.
  - No merge authority is implied.
- Validation:
  - Application-quality run `30153108868` passed on the exact checkpoint.
  - Lifecycle run `30153108867` passed on the exact checkpoint.
  - Both check runs returned no annotations.
  - GitHub reported the checkpoint mergeable.
  - CodeRabbit reported success only because the review limit was reached; it created no review object and no findings.
- Documentation:
  - Updated `handoff.md`, `docs/changes.md`, `docs/roadmap.md`, and `docs/learning.md`.
- Residual risks / exclusions:
  - This documentation commit creates a newer immutable head whose hosted state must be retrieved live.
  - No independent automated review covers the architecture diff.
  - Browser automation, visual approval, provider compatibility, persistence, deployment, and real transactions remain excluded.
- Follow-up:
  - Push this checkpoint; if the resulting head passes lifecycle and application quality without material annotations, remains mergeable, and introduces only the reviewed lifecycle update, post the final audit and request fresh BurinSN approval. Otherwise fix the live head.

## 2026-07-25 17:07 WIB - Published-trip runtime invariants corrected

- Issue / PR: Issue #3; pull request #4
- Product: NitipCuy
- Type: Domain correction, adversarial testing, architecture truth, and lifecycle reconciliation
- Status: First hostile-review correction implemented and locally validated; commit, push, and hosted exact-head verification pending
- Objective:
  - Make the executable published-trip boundary enforce the supported service modes, calendar and timestamp validity, question identity, and chronological behavior already promised by the architecture.
- Scope:
  - `packages/domain/src/trip.ts`, its unit tests, all four lifecycle documents, system architecture, and quality limitations.
- Changes:
  - Added a runtime allowlist for Shop for me and Carry my item instead of relying on the TypeScript union.
  - Added strict calendar, clock, and timezone-offset validation so normalized values such as `2026-02-30`, hour `24`, and offset `+14:30` are rejected.
  - Sorted public questions by parsed instant across timezone offsets.
  - Required public-question IDs to be unique within a trip.
  - Added adversarial regression tests for each corrected behavior.
  - Reopened the remaining identity, dependency-boundary, transaction, payment, idempotency, evidence, and projection findings as explicit issue #3 merge blockers.
  - Corrected the architecture documentation so package direction is no longer described as mechanically enforced.
- Impact:
  - Runtime inputs from future delivery, persistence, or provider adapters cannot bypass these trip invariants merely because their compile-time type was asserted.
  - Public discussion chronology now reflects actual time rather than lexical timestamp text.
  - Pull request #4 remains unapproved and unmergeable by project policy while the other hostile-review findings remain open.
- Validation:
  - Exact Node.js `24.18.0` and pnpm `11.17.0` targeted domain type checking passed.
  - All 10 domain tests passed; the workspace now has 18 passing unit tests.
  - An exact-Node adversarial probe rejected `UNSUPPORTED`, rejected `2026-02-30`, and returned `question-earlier,question-later` for the cross-offset ordering case.
  - Frozen install was already up to date and `pnpm peers check` found no peer issues.
  - `pnpm check` passed formatting, lint, four-package strict type checking, 18 tests, and the production build through the exact toolchain wrapper.
  - `pnpm audit:prod` reported no known production vulnerabilities.
  - A first full-gate attempt failed correctly because nested package scripts resolved ambient Node `26.0.0` and pnpm `9.15.0`; it is recorded as a failed invocation and not counted as passing evidence.
- Documentation:
  - Updated `handoff.md`, `docs/changes.md`, `docs/roadmap.md`, `docs/learning.md`, `docs/architecture/system-architecture.md`, and `docs/development/quality-gates.md`.
- Residual risks / exclusions:
  - No persistence, account, protected mutation, provider integration, private data, payment movement, logistics booking, deployment, browser automation, or visual approval was added.
  - Hosted checks do not cover the correction until it is committed and pushed.
  - The remaining hostile-review findings still block merge.
- Follow-up:
  - Run the final lifecycle and diff gates on the reconciled tree, commit and push this bounded correction, verify pull request #4 on the new exact head, then address the identity-to-internal-account acceptance mismatch as the next correction.

## 2026-07-25 17:15 WIB - Identity acceptance reconciled with persisted-slice scope

- Issue / PR: Issue #3; pull request #4
- Product: NitipCuy
- Type: Acceptance correction, scope control, GitHub metadata, and lifecycle reconciliation
- Status: Second hostile-review correction applied; lifecycle commit, push, and hosted exact-head verification pending
- Objective:
  - Remove the false claim that issue #3 implements identity-subject-to-domain-account mapping without expanding the read-only architecture probe into account persistence or production identity integration.
- Scope:
  - Issue #3 acceptance criteria, pull request #4 description and approval state, and all four lifecycle documents.
- Changes:
  - Replaced the issue's implementation claim with the accepted architecture direction: external identity maps to an internal account, authorization is server-authoritative and deny-by-default, and mapping implementation belongs to the first persisted account slice.
  - Left production identity-provider selection, account persistence, login, and protected mutations excluded from issue #3.
  - Unchecked the issue's mechanical dependency-enforcement criterion because that separate hostile-review finding remains open.
  - Reopened final exact-head verification and lifecycle reconciliation criteria until all corrective findings are complete.
  - Updated the pull-request description from 13 to 18 tests, recorded the published-trip correction, distinguished the last verified correction checkpoint from final evidence, and replaced premature approval checkmarks with the live remediation gates.
  - Removed identity mapping from the current merge-blocker list and made automated dependency-boundary enforcement the next bounded correction.
- Impact:
  - Issue #3, ADR 0003, code, exclusions, roadmap, and pull request now describe the same identity scope.
  - The architecture remains provider-independent and avoids premature account or authentication implementation.
  - Pull request #4 remains open, unapproved, and blocked by the remaining hostile-review findings.
- Validation:
  - Live issue #3 and pull request #4 bodies were retrieved before mutation.
  - Issue #3 remains open and pull request #4 remained open and GitHub-mergeable at the last verified head.
  - Application-quality run `30154018299` and lifecycle run `30154018297` passed without annotations on correction head `96a7ff9dc9a9a7542770f05070540f4cf7fb3ec1`.
  - CodeRabbit remained rate-limited and provided no review object or findings.
- Documentation:
  - Updated `handoff.md`, `docs/changes.md`, `docs/roadmap.md`, and `docs/learning.md`.
- Residual risks / exclusions:
  - This is a governance and scope correction, not identity implementation.
  - Automated dependency enforcement, transaction scope, payment lifecycle, idempotency, evidence integrity, projection boundaries, and final reconciliation remain open.
  - Hosted workflows must run again after the lifecycle commit changes the pull-request head.
- Follow-up:
  - Validate lifecycle freshness and formatting, commit and push this correction, verify the new exact-head checks and annotations, then implement automated dependency-boundary enforcement.

## 2026-07-27 17:10 WIB - Security, resilience, and scale baseline established

- Issue / PR: Issue #3; pull request #4
- Product: NitipCuy
- Type: Security architecture, anti-abuse, resilience, capacity, and lifecycle amendment
- Status: Accepted design documented, locally validated, committed, pushed, and required hosted workflows verified
- Objective:
  - Make security against DDoS and resource exhaustion, SQL injection, session compromise, credential and OTP attacks, and other common web threats a binding project requirement while preserving a realistic, testable path to horizontal growth.
- Scope:
  - Architecture decision and specialist documents, system architecture, quality gates, roadmap, contributor rules, README, and all four lifecycle documents.
- Changes:
  - Added ADR 0004 to require defense in depth, OWASP ASVS 5.0 Level 2 as the complete production web target, stateless horizontal scaling, bounded expensive work, secure sessions and authorization, safe persistence, hostile file/callback/outbound handling, measurable capacity, and explicit evidence levels.
  - Added a security architecture covering assets, trust boundaries, a threat-control matrix, DDoS and cost abuse, authentication and sessions, brute force and automation, authorization, SQL injection, XSS, CSRF, uploads, SSRF, callbacks, secrets, private logs, monitoring, incident response, and launch gates.
  - Added a scalability and resilience architecture covering public caching, pooled PostgreSQL, connection and query budgets, transactions, idempotency, durable workers, provider isolation, graceful degradation, observability, capacity contracts, load profiles, scaling sequence, backup, and recovery.
  - Updated system architecture and quality gates so “designed,” “implemented,” “source-tested,” “runtime-tested,” “load-tested,” “provider-verified,” and “incident-tested” cannot be collapsed into a false security or scale claim.
  - Updated Stage 1 through Stage 3 roadmap gates so each protected feature carries its applicable controls and real-money pilot activation requires configuration, load, abuse, restore, revocation, kill-switch, and incident evidence.
  - Kept the current issue #3 architecture shell explicitly separate from production security implementation.
- Impact:
  - Future sessions have concrete, provider-independent acceptance criteria instead of a general instruction to “be secure” or “scale.”
  - The starting modular monolith remains appropriate, but production correctness may not depend on one process.
  - Security and capacity work becomes incremental with the feature that introduces risk; it is not deferred until launch and is not falsely claimed by documentation alone.
- Validation:
  - Primary guidance was checked from OWASP ASVS 5.0, OWASP cheat sheets and API Security, Next.js, Prisma, Vercel, and Neon documentation on 2026-07-27.
  - Exact Node.js `24.18.0` and pnpm `11.17.0` were used.
  - Frozen install was already up to date and `pnpm peers check` found no peer dependency issue.
  - `pnpm check` passed formatting, lint, strict type checking, all 18 tests, and the production build.
  - `pnpm audit:prod` reported no known production vulnerability.
  - Lifecycle participation, internal Markdown links across 19 files, and `git diff --check` passed.
  - Live issue #3 and pull request #4 were retrieved before mutation, then updated to record the accepted design, exclusions, evidence levels, remaining blockers, and non-claims.
  - Commit `7522bf8d2076101cdc78245f390818eb6125252f` was pushed to pull request #4.
  - Application-quality run `30256384832` and lifecycle run `30256384917` passed on that exact head with no annotations, failed steps, or skipped steps.
  - GitHub reported the pull request open and mergeable with no review decision.
  - CodeRabbit review run `fe94a2a4-4776-497f-b797-caae88ce6a39` remained pending after the bounded wait and had produced no review object or finding as of 17:10 WIB. It is not counted as independent review coverage or approval.
- Documentation:
  - Added `docs/decisions/0004-security-resilience-and-scale-baseline.md`, `docs/security/security-architecture.md`, and `docs/architecture/scalability-and-resilience.md`.
  - Updated `AGENTS.md`, `README.md`, `handoff.md`, `docs/architecture/system-architecture.md`, `docs/development/quality-gates.md`, `docs/roadmap.md`, `docs/changes.md`, and `docs/learning.md`.
- Residual risks / exclusions:
  - This amendment does not activate or verify identity, sessions, WAF, bot controls, shared rate limiting, a database, object storage, a worker, providers, monitoring, backup, load testing, security testing, deployment, or production.
  - No claim of DDoS immunity, complete injection prevention, session safety, brute-force immunity, OWASP conformance, production capacity, or incident readiness is made.
  - Existing hostile-review blockers for dependency enforcement, transaction scope, payment lifecycle, idempotency, evidence integrity, projection boundaries, and final reconciliation remain.
- Follow-up:
  - Implement automated dependency-boundary enforcement as the next bounded correction; the other transaction, payment, idempotency, evidence, projection, and final-reconciliation blockers follow.

## 2026-07-27 18:27 WIB - Security and scale hostile-review gaps corrected

- Issue / PR: Issue #3; pull request #4
- Product: NitipCuy
- Type: Security architecture correction, scale-safety correction, and lifecycle reconciliation
- Status: Accepted design correction committed, pushed, and hosted-verified; final lifecycle reconciliation in progress
- Objective:
  - Close six material gaps found in the accepted security and scale baseline before returning to dependency-boundary implementation.
- Scope:
  - ADR 0004, security architecture, scalability and resilience, system architecture, quality gates, roadmap, handoff, changes, learning, issue #3, and pull request #4.
- Changes:
  - Made phishing-resistant MFA such as passkeys, or an explicitly approved high-assurance alternative, a provider-selection gate for administrator, support, moderation, payment, payout, refund, bank-change, factor-replacement, and recovery flows.
  - Added non-downgrading factor recovery with reauthentication, risk, notification, revocation, and audit requirements.
  - Added an explicit edge-only origin, trusted proxy chain, forwarding-header overwrite, canonical host/origin/client-IP interpretation, direct-origin denial, and absolute-URL safety contract.
  - Added a route-class dependency-outage matrix: bounded public reads may degrade, while protected identity, transaction, evidence, moderation, support, and administrator actions fail closed when required controls are unavailable.
  - Added data minimization, provider encryption, threat-modelled application envelope encryption, managed KMS/HSM/key-vault custody, key versioning, rotation, revocation, compromise recovery, encrypted backup restore, retention, deletion, and cryptographic-erasure requirements.
  - Added canonical public cache keys, protected-response exclusion, poisoning and deception defenses, concurrent-miss coalescing, hot-key budgets, expiry jitter, bounded stale windows, invalidation, and database-stampede prevention.
  - Added expand-and-contract schema releases, bounded backfills, mixed old/new web and worker compatibility, queued-payload compatibility, destructive-cleanup delay, and rollback or forward-fix evidence.
  - Expanded protected-preview, pilot, security, integration, load, outage, migration, cache, recovery, and incident gates for these controls.
  - Corrected the handoff's stale instruction to commit and push the already hosted-verified identity acceptance work.
- Impact:
  - Future implementation has explicit provider-independent security and deployment contracts at the designed evidence level.
  - The correction narrows false assumptions; it does not activate or verify any production control.
  - Product scope, roadmap stage order, two service modes, seller-set rates, platform-fee direction, and provider-independent core remain unchanged.
- Validation:
  - Starting branch head `bf48727ed9f1e65d87919f4fbe11ac0815542355`, issue #3, pull request #4, reviews, and required hosted workflows were retrieved before editing.
  - Application run `30257081811` and lifecycle run `30257081823` passed on that starting head without annotations.
  - CodeRabbit run `86ff3d62-b1f7-4429-839e-e07fd4402c20` was rate-limited and created no review object or finding.
  - Exact Node.js `24.18.0` and pnpm `11.17.0` were used for the current tree.
  - Frozen install, peer check, formatting, lint, strict types, all 18 tests, production build, and production dependency audit passed.
  - Lifecycle participation, internal Markdown links across 20 files, stale-control-language scan, six-control presence scan, and `git diff --check` passed.
  - Issue #3 and pull request #4 were updated and read back successfully; both remain open, and the pull request remains GitHub-mergeable with no review or review decision.
  - Correction commit `609c23b8bf96be995a9c9347a442d8abaca59ff6` was pushed to pull request #4.
  - Application-quality run `30262412048` and lifecycle run `30262412059` passed on that exact checkpoint with zero annotations.
  - Pull request #4 remained open and GitHub-mergeable with no review decision or review object after hosted verification.
  - CodeRabbit did not review the correction; its only current record remains the earlier rate-limited run and provides no independent review coverage.
- Documentation:
  - Updated all four lifecycle documents and every affected canonical architecture, security, scale, and quality document.
- Residual risks / exclusions:
  - All six controls remain designed only; no identity provider, MFA, proxy, WAF, limiter, KMS, encryption, cache, database, migration, deployment, backup, security test, load test, or production service was created or configured.
  - Dependency enforcement, transaction scope, payment lifecycle, idempotency, evidence integrity, projection separation, and final issue/PR reconciliation remain merge blockers.
  - Pull request #4 remains open and unapproved.
- Follow-up:
  - Commit and push the lifecycle reconciliation, verify its exact hosted head, then resume automated dependency-boundary enforcement.

## 2026-07-28 06:56 WIB - Trip windows, order projections, and evidence policy aligned

- Issue / PR: Issue #3; pull request #4
- Product: NitipCuy
- Type: Product rule, public projection, domain invariant, evidence policy, and lifecycle correction
- Status: Implementation checkpoint committed, pushed, and hosted-verified; lifecycle reconciliation in progress
- Objective:
  - Formalize seller-defined ordering windows, closed-trip history, seller and customer order workspaces, and evidence-gated fulfilment without exposing fixed-price seller acquisition cost.
- Scope:
  - Public simulated trip projection and presentation, product and order specifications, product and architecture ADRs, system and security architecture, quality gates, README, roadmap, handoff, changes, learning, issue #3, and pull request #4.
- Changes:
  - Added origin and destination IANA timezones, source-service start and end, and request-opening time to the public `PublishedTrip` projection.
  - Added domain invariants for valid IANA timezones, advance PO, ordering-window sequence, source-service cutoff, and transport departure.
  - Updated simulated trips and public list and detail presentation to show source-service and ordering windows in origin time and arrival in destination time.
  - Defined the future authoritative `TripOffer`, rebuildable public `PublishedTrip`, read-only public history, and private seller/customer order projections; projections cannot authorize mutations, checkout, or capacity reservation.
  - Split offer availability from physical trip milestones so request closure can coexist with ongoing accepted-order fulfilment.
  - Required server-side new-order rejection outside the exact ordering window or when capacity, seller, offer, moderation, or risk eligibility fails.
  - Required a verified actual-product photograph before fixed-price Shop for me can become `PURCHASED`, while removing routine buyer-visible receipt, acquisition-cost, and margin disclosure.
  - Limited receipt evidence to an explicitly accepted actual-cost pricing formula or a proportionate private dispute, fraud, or compliance purpose.
  - Required collection photographs and measured weight before Carry my item can become `COLLECTED`, with customer approval for material variance.
  - Defined private jastipper work queues and customer progress timelines as future projections, not current implementation.
- Impact:
  - Customers can see when ordering starts and ends rather than only a deadline.
  - Jastippers retain seller-defined fixed-price privacy while customers receive item-existence and condition evidence.
  - Closed offers remain useful reputation history without accepting stale orders or exposing private transaction data.
  - The prior public-versus-authoritative trip projection finding is resolved at the contract and current-code level.
- Validation:
  - Starting local and remote branch head `55eda6bfc903f712b7eeff97e21bf37b99d0ccb5` was clean.
  - Pull request #4 was open and GitHub-mergeable with application run `30262587723` and lifecycle run `30262587684` passed with zero annotations; no review object or decision existed.
  - Exact Node.js `24.18.0` and pnpm `11.17.0` formatting, lint, strict type checking, all 24 unit tests, production build, production dependency audit, lifecycle, and `git diff --check` passed after the final hostile-audit correction.
  - The audit found that source-service chronology was enforced but lacked a direct inverted-window test; that adversarial test was added and passed.
  - The rebuilt Next.js production runtime returned `200` for home and a known trip and `404` for an unknown trip; exact opening, closing, transport-departure, and estimated-arrival timestamps were present in their documented timezones.
  - Public-page content assertions found no receipt, acquisition-cost, or margin disclosure.
  - An initial runtime-start attempt picked up ambient Node.js `26.0.0` and pnpm `9.15.0`; `engine-strict` rejected it before startup. The successful probe used the exact `npx` Node.js and pnpm wrapper, and the failed attempt is not counted as success.
  - Issue #3 and pull request #4 were updated and read back successfully; both remain open.
  - Final lifecycle, 20-file internal Markdown-link, formatting, and diff checks passed after GitHub and hostile-audit reconciliation.
  - Implementation commit `f4b635abba9fcdf548441254d3da5e29a645e492` was pushed to pull request #4.
  - Application-quality run `30316681999` and lifecycle run `30316681979` passed on that exact implementation checkpoint with zero annotations.
  - Pull request #4 was open and GitHub-mergeable with no review object or review decision after hosted verification.
  - Lifecycle-reconciliation commit, push, and exact-head hosted verification remain pending.
- Documentation:
  - Updated all four lifecycle documents and every affected canonical product, order, architecture, security, and quality document.
- Residual risks / exclusions:
  - No authoritative trip persistence, protected request, capacity reservation, order, evidence upload, payment, dashboard, archive, provider, or production flow was created.
  - A file hash still does not prove product authenticity, price, payment, ownership, or lawful content.
  - Dependency enforcement, transaction scope, payment lifecycle, idempotency, evidence-storage integrity, and final lifecycle reconciliation remain issue #3 merge blockers.
- Follow-up:
  - Commit and push the lifecycle reconciliation, inspect its exact hosted head and annotations, update pull request #4 with the immutable result, then return to dependency-boundary enforcement.

## 2026-07-28 13:38 WIB - Dependency direction enforced mechanically

- Issue / PR: Issue #3; pull request #4
- Product: NitipCuy application foundation
- Type: Architecture enforcement, test, quality-gate, and lifecycle correction
- Status: Implementation committed, pushed, and hosted-verified; lifecycle reconciliation in progress
- Objective:
  - Turn the accepted modular-monolith dependency direction from a review convention into a deterministic failing local and hosted gate.
- Scope:
  - Four project manifests, governed source under `packages/*/src` and `apps/web/src`, root quality scripts, adversarial fixtures, ADR 0003, system architecture, quality gates, README, and all four lifecycle documents.
- Changes:
  - Added a TypeScript-AST dependency analyzer that validates package manifests and parsed imports, exports, import-type expressions, triple-slash references, dynamic imports, `require`, `require.resolve`, and `module.require`.
  - Rejected disallowed, unknown, undeclared, non-workspace, deep, cross-project-relative, source-root-escape, non-static, and symlink dependency paths.
  - Kept domain and application production source free of external runtime packages and Node.js builtins.
  - Restricted concrete adapters to web server composition and rejected client-to-server and client runtime-core imports while permitting type-only application contracts.
  - Added `pnpm check:boundaries` for the live tree and 20 disposable adversarial fixture tests through `pnpm test:boundaries`.
  - Wired both into `pnpm check`, so the existing read-only application-quality workflow executes the enforcement without new permissions or secrets.
- Impact:
  - A forbidden dependency edge now fails before merge instead of relying on a reviewer noticing it.
  - Framework and provider code cannot silently enter domain or application through a relative, aliased, type-only, dynamic, require, manifest, or symlink bypass covered by the gate.
  - The modular monolith remains one deployable; no microservice, provider, database, deployment, or runtime security control was introduced.
- Validation:
  - Starting local and remote branch head `b87e4541569d825c3b686e8954013945f986f1fb` was clean and synchronized.
  - Exact Node.js `24.18.0` and pnpm `11.17.0` were used.
  - Live scan passed across four projects, 24 governed source files, and 46 module references.
  - All 20 boundary tests and 24 existing unit tests passed after the manifest-placement and source-root-symlink corrections.
  - Complete-diff review found that the configured source root itself could still be a symlink; root-symlink rejection and a twentieth fixture were added, rerun, and passed.
  - Formatting, lint, strict type checking, production build, production dependency audit, lifecycle, 20-file internal Markdown links, and diff hygiene passed.
  - Production runtime regression returned `200` for home and a known trip and `404` for an unknown trip; expected timeline content remained present and public pages exposed no receipt, acquisition-cost, or margin language.
  - Complete-diff hostile review found no further material issue.
  - Issue #3 and pull request #4 were updated and read back successfully with the dependency scope, evidence, and remaining blockers; both remain open.
  - Implementation commit `330b10a85adbd83c151eafdfc0a5ca6d0f36e9ae` was pushed to pull request #4.
  - Application-quality run `30336136426` and lifecycle run `30336136464` passed on that exact implementation checkpoint with zero annotations.
  - The issue's dependency acceptance criterion is checked; pull request #4 is GitHub-mergeable with no review object or decision.
  - Lifecycle-reconciliation commit, push, and hosted verification remain pending.
- Documentation:
  - Updated all four lifecycle documents plus README, ADR 0003, system architecture, and quality gates.
- Residual risks / exclusions:
  - Static enforcement cannot prove runtime authorization, transaction atomicity, payment correctness, idempotency, evidence integrity, provider behavior, or production security.
  - Transaction scope, payment lifecycle, idempotency, evidence-storage integrity, and final lifecycle reconciliation remain issue #3 merge blockers.
- Follow-up:
  - Commit and push the lifecycle reconciliation, inspect its exact hosted head and annotations, update pull request #4 with the immutable result, then begin the transaction-scope correction.

## 2026-07-28 18:21 WIB - Misleading transaction abstraction removed and deferred

- Issue / PR: Issue #3; pull request #4
- Product: NitipCuy application foundation
- Type: Architecture correction, false-capability removal, test correction, and lifecycle reconciliation
- Status: Implementation committed, pushed, hosted-verified, and externally reconciled; lifecycle reconciliation in progress
- Objective:
  - Resolve the transaction-scope finding without adding an in-memory abstraction that cannot prove persistence atomicity.
- Scope:
  - Application platform-service ports and exports, deterministic adapters and tests, ADR 0003, system architecture, quality gates, roadmap, handoff, changes, and learning.
- Changes:
  - Removed the callback-only `TransactionPort`.
  - Removed `PassthroughTransaction` and the test that treated independently mutated audit and outbox arrays as work performed inside a transaction.
  - Kept deterministic audit and outbox adapters as standalone provisional test services without claiming shared atomicity.
  - Amended ADR 0003 to defer a database-backed transaction-scoped unit of work to the first persisted write slice.
  - Required the future scope to bind repositories, ledger, success audit, inbox, and outbox writers to one PostgreSQL transaction while keeping provider and object-storage calls outside it.
  - Added future disposable-PostgreSQL proof gates for rollback fault injection, last-capacity contention, stale-version or lock conflict, balanced ledger constraints, state-to-audit and state-to-outbox atomicity, timeouts, and absence of provider calls inside the transaction.
- Impact:
  - Issue #3 no longer exposes a transaction-shaped callback that cannot commit, roll back, isolate concurrent work, or bind writers to one connection.
  - The public read-only architecture probe remains appropriately database-free.
  - The correction does not implement or verify PostgreSQL transactions, protected writes, ledger behavior, or production atomicity.
  - Product scope, service modes, seller-defined rates, platform-fee direction, ordering windows, evidence rules, and roadmap stage order remain unchanged.
- Validation:
  - Starting local and remote branch head `780563fa784c3ff57d28039b1f6cd491b126d2b4` was clean and synchronized.
  - Dependency-boundary lifecycle reconciliation at that head had application run `30336362159` and lifecycle run `30336362143` passed with zero annotations.
  - Exact Node.js `24.18.0` and pnpm `11.17.0` application type checking and all five adapter tests passed after the removal.
  - Exact-toolchain peer validation, formatting, lint, live boundary scan, strict type checking, all 20 boundary tests, all 24 unit tests, production build, production dependency audit, and lifecycle participation passed.
  - Internal Markdown links passed across 19 files and 33 local targets; `git diff --check` passed.
  - The rebuilt production runtime returned `200` for home and a known trip and `404` for an unknown trip; tested public pages exposed no receipt, acquisition-cost, margin, or equivalent Indonesian private-pricing language.
  - Complete correction-diff hostile review found no material issue.
  - Implementation checkpoint `bf564436bf54815782501bc10280074f16a23fa9` was pushed and matched the remote branch.
  - Application run `30354861825` and lifecycle run `30354861680` passed on that exact head with zero annotations.
  - Pull request #4 remained open and GitHub-mergeable with no review object or review decision.
  - CodeRabbit was green but produced no review object or finding and therefore provided no independent review coverage.
  - Issue #3 and pull request #4 were updated and read back with the explicit deferral, exact implementation evidence, and remaining blockers.
- Documentation:
  - Updated all four lifecycle documents plus ADR 0003, system architecture, and quality gates.
- Residual risks / exclusions:
  - The future transaction-scoped unit of work is designed only and cannot be counted complete until implemented with the first persisted write slice and verified against disposable PostgreSQL.
  - Payment lifecycle, idempotency, evidence-storage integrity, and final lifecycle and pull-request reconciliation remain issue #3 merge blockers.
- Follow-up:
  - Commit, push, and inspect this lifecycle reconciliation, then correct the asynchronous payment lifecycle.

## 2026-07-29 17:51 WIB - Asynchronous payment outcomes separated from submissions

- Issue / PR: Issue #3; pull request #4
- Product: NitipCuy application foundation
- Type: Payment architecture correction, fail-closed assessment, adversarial tests, and lifecycle reconciliation
- Status: Implemented, full-local-gate verified, and hostile-reviewed; commit, hosted exact-head verification, and external reconciliation pending
- Objective:
  - Prevent an accepted payment-provider request, redirect, QR, Virtual Account instruction, callback, timeout, or mock default from being treated as proof that money is held, released, refunded, split, or settled.
- Scope:
  - Application payment port, payment-protection assessment, adapter mock and tests, payment and order product contracts, ADR 0003, system architecture, DOKU evaluation, quality gates, roadmap, handoff, changes, and learning.
- Changes:
  - Replaced the immediate held-payment contract with provider-neutral initiation, release-request, refund-request, and inspection operations.
  - Modeled accepted-for-processing, rejected, and unknown submission receipts without assigning completed financial outcomes.
  - Added provider-neutral redirect, QR, and Virtual Account customer actions to accepted initiation receipts.
  - Separated provider observations for collection, hold, release, refund, settlement, and chargeback.
  - Limited provider events to status-change signals that require inspection and reconciliation.
  - Added a stable internal payment-attempt ID so an ambiguous initiation remains inspectable even when no provider payment reference was returned.
  - Added explicit held-amount evidence and a pure initial-protection assessment that confirms `HELD` only when the observation matches the expected attempt, retains a provider payment reference, both collected and held amounts exactly match, and no contradictory post-hold status or amount evidence exists.
  - Made unknown, contradictory, amount-mismatched, paid-but-not-held, and post-hold observations fail closed into pending or reconciliation.
  - Changed the deterministic mock to require explicit configured receipts and snapshots instead of inventing financial success.
  - Added adversarial application and adapter coverage for accepted, rejected, unknown, pending, expired, contradictory, mismatched, and post-hold cases.
- Impact:
  - Application code can no longer infer a completed hold from payment initiation or a completed release or refund from request acceptance.
  - Core contracts remain independent of DOKU and expose no provider object model.
  - The correction does not mutate an order or ledger and does not process money.
  - Product roles, service modes, seller-defined prices, platform-fee direction, evidence rules, logistics direction, and roadmap stage order remain unchanged.
- Validation:
  - The correction started from clean synchronized head `81fb1f5ceab5ba2445d6606a255471b1dca75a86`, whose application run `30355124146` and lifecycle run `30355122231` passed with zero annotations.
  - Exact Node.js `24.18.0` and pnpm `11.17.0` application and adapter type checking passed.
  - All 18 application tests and 10 adapter tests passed after the ambiguous-initiation, cross-attempt, missing-reference, exact-held-amount, paid-but-hold-failed, terminal-with-money, and status-versus-amount hostile corrections.
  - Exact-toolchain frozen install, peer validation, formatting, lint, live dependency scan, strict type checking, all 20 boundary tests, all 44 package tests, production build, production dependency audit, and lifecycle participation passed.
  - The live dependency scan covered four projects, 26 governed source files, and 51 module references.
  - Internal Markdown links passed across 19 files and 33 local targets; `git diff --check` and the stale immediate-held contract scan passed.
  - The rebuilt production runtime returned `200` for home and a known trip and `404` for an unknown trip; the public-page pricing-privacy assertion passed.
  - Complete correction-diff hostile review found and corrected ambiguous-initiation lookup, missing held amount, cross-attempt matching, paid-but-hold-failed, terminal-with-money, missing provider reference, and status-versus-amount contradictions; no further material issue remained.
- Documentation:
  - Updated all four lifecycle documents plus the master specification, order lifecycle, ADR 0003, system architecture, DOKU evaluation, and quality gates.
- Residual risks / exclusions:
  - Commit, push, hosted exact-head, issue, and pull-request reconciliation evidence is pending.
  - Idempotency enforcement remains the next implementation blocker.
  - No callback authentication, replay protection, durable inbox, worker, retry scheduler, ledger, database transaction, order transition, real provider adapter, release/refund/settlement assessment, or money movement exists.
- Follow-up:
  - Commit and push the correction, inspect its exact hosted head, and reconcile issue #3 and pull request #4 before beginning idempotency enforcement.
