# NitipCuy Contributor and AI Operating Rules

These instructions apply to every file in this project.

## Required reading

Before planning or changing NitipCuy, read:

1. `docs/roadmap.md`
2. `handoff.md`
3. The latest entry in `docs/changes.md`
4. Relevant entries in `docs/learning.md`
5. `docs/product/master-specification.md`
6. `docs/architecture/system-architecture.md` before architecture or implementation work
7. `docs/security/security-architecture.md` and `docs/architecture/scalability-and-resilience.md` before protected, data, provider, deployment, performance, or operational work
8. The relevant ADR, payment, trust-and-safety, and lifecycle documents
9. `docs/development/quality-gates.md` before dependency, code, test, build, security, load, or CI work
10. `docs/development/git-workflow.md` before any Git or GitHub mutation
11. `docs/development/review-governance.md` before opening or reviewing a material issue or pull request
12. `docs/development/parallel-coordination.md` before working in parallel with another session (human or AI) on this repository

Verified live state and current explicit BurinSN direction override stale documentation.

## Canonical authority

- `docs/roadmap.md` owns project stage, gates, and next work.
- `handoff.md` owns verified current repository state, active work, authority boundaries, blockers, verification, and the exact next action.
- `docs/changes.md` owns append-only material-change history and never overrides current state.
- `docs/learning.md` owns append-only verified learning, corrections, failed approaches, and deferred questions.
- `docs/product/master-specification.md` owns the product model.
- `docs/product/order-lifecycle.md` owns transaction states and evidence gates.
- `docs/architecture/system-architecture.md` owns accepted system boundaries, dependency direction, data classification, and provider-port rules.
- `docs/security/security-architecture.md` owns application-security, anti-abuse, data-protection, threat-control, and security-verification requirements.
- `docs/architecture/scalability-and-resilience.md` owns stateless scaling, capacity, resource budgets, provider isolation, load, and recovery requirements.
- `docs/development/quality-gates.md` owns the supported toolchain and validation evidence contract.
- `docs/development/review-governance.md` owns DRY-review and guarded-Strix applicability, progress, evidence, and merge-gate requirements.
- `docs/trust-safety/moderation-model.md` owns marketplace enforcement.
- ADRs in `docs/decisions/` own accepted product and architecture decisions.

When sources conflict, reconcile them before implementation.

## Product boundaries

- NitipCuy is a standalone BurinSN product, not a BCN module.
- NitipCuy connects customers with independent jastippers. It is not the cross-border merchant, importer, customs broker, carrier, or legal seller of the listed goods.
- The platform still owns its marketplace rules, moderation, transaction evidence, payment orchestration, dispute process, and compliance responses. Terms and Conditions do not replace those controls.
- Sellers set their own item, service, kilogram, minimum-order, and capacity terms. NitipCuy does not publish a mandatory market rate.
- Subscription monetization is out of scope. Platform transaction fees are the approved revenue direction.

## Change discipline

Every material product, trust, payment, architecture, implementation, or workflow change must update:

1. `handoff.md`
2. `docs/changes.md`
3. `docs/roadmap.md`
4. `docs/learning.md`
5. Every affected canonical specialist document

All four lifecycle documents are mandatory for every material session and pull request. This is required even when one document has no substantive product change:

- update the handoff with current live state and exact next action;
- append the material change to changes;
- refresh roadmap status and explicitly record when scope/order is unchanged;
- append the learning, correction, failed approach, deferred question, or an explicit no-new-learning statement.

Run `scripts/check-lifecycle-docs.sh origin/main` before declaring the work complete. Passing the check proves file participation only. It does not replace live-state reconciliation or hostile content review.

Every material issue and pull request must use the versioned review-governance contract. The linked issue and pull request must expose matching DRY and guarded-Strix progress, and the dedicated hosted workflow must pass on the exact immutable pull-request head. Follow `docs/development/review-governance.md`; do not duplicate or weaken its status and evidence rules elsewhere.

For application changes, also use the exact supported Node.js and pnpm versions and run `pnpm check` plus `pnpm audit:prod`. A passed build does not prove runtime, browser, security, provider, payment, legal, or visual readiness.

Security and scale claims must state the highest evidence actually obtained: designed, implemented, source-tested, runtime-tested, load-tested, provider-verified, or incident-tested. Do not describe a control as generally secure, attack-proof, scalable, or production-ready.

Work is incomplete while any lifecycle document is stale. Do not defer lifecycle updates to a later issue, cleanup pass, handoff, or sign-off.

Classify statements as verified fact, accepted decision, current assumption, proposal, or open question. Date external pricing and regulatory facts and link their primary sources.

Do not store credentials, tokens, private keys, database URLs, raw identity documents, customer addresses, payment details, or production secrets in documentation.

## Approval boundaries

Provider onboarding, legal commitments, paid services, production integrations, external messages, public launch, and visual production deployment require explicit BurinSN approval. Passing technical checks does not constitute product, legal, financial, security, or visual approval.

## Git and GitHub

- Canonical repository: `https://github.com/BurinSn/NitipCuy`
- Default branch: `main`
- Repository visibility: private
- After the explicitly authorized initial documentation baseline, material work begins from a written issue and uses a focused branch and pull request.
- Never merge because checks pass. BurinSN product-owner approval remains required.
- Agents (Claude, Codex, or any other) never merge, never push to `main`, and never force-push `main`. BurinSN is the sole merge authority. Under parallel work, BurinSN merges one pull request at a time; after each merge every other active session rebases and re-verifies. See `docs/development/parallel-coordination.md`.
- Do not force-push `main`, rewrite shared history, expose secrets, or use direct feature commits on `main`.
- Every material pull request must include all four lifecycle documents and pass the lifecycle freshness check.
- Every material pull request must complete the exact-head DRY review and satisfy the issue's guarded-Strix applicability decision before owner approval.
- GitHub branch protection is unavailable for this private repository on the current plan. Merge-button availability is not permission. A missing or red lifecycle check blocks merge by project policy.
- Run `./scripts/check-base-freshness.sh origin/main commit` before committing (warns if another session advanced `main`). Run it in `merge` mode, and `node scripts/check-canonical-blocks.mjs origin/main`, before requesting merge. The hosted lifecycle workflow enforces both on the exact PR head.
- Follow `docs/development/git-workflow.md` and, when two or more sessions are active, `docs/development/parallel-coordination.md`.
