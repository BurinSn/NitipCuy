# NitipCuy Contributor and AI Operating Rules

These instructions apply to every file in this project.

## Required reading

Before planning or changing NitipCuy, read:

1. `docs/roadmap.md`
2. `handoff.md`
3. The latest entry in `docs/changes.md`
4. Relevant entries in `docs/learning.md`
5. `docs/product/master-specification.md`
6. The relevant ADR, payment, trust-and-safety, and lifecycle documents
7. `docs/development/git-workflow.md` before any Git or GitHub mutation

Verified live state and current explicit BurinSN direction override stale documentation.

## Canonical authority

- `docs/roadmap.md` owns project stage, gates, and next work.
- `docs/product/master-specification.md` owns the product model.
- `docs/product/order-lifecycle.md` owns transaction states and evidence gates.
- `docs/trust-safety/moderation-model.md` owns marketplace enforcement.
- ADRs in `docs/decisions/` own accepted product and architecture decisions.
- `docs/changes.md` and `docs/learning.md` are append-only histories.
- `handoff.md` is the current operational resume point.

When sources conflict, reconcile them before implementation.

## Product boundaries

- NitipCuy is a standalone BurinSN product, not a BCN module.
- NitipCuy connects customers with independent jastippers. It is not the cross-border merchant, importer, customs broker, carrier, or legal seller of the listed goods.
- The platform still owns its marketplace rules, moderation, transaction evidence, payment orchestration, dispute process, and compliance responses. Terms and Conditions do not replace those controls.
- Sellers set their own item, service, kilogram, minimum-order, and capacity terms. NitipCuy does not publish a mandatory market rate.
- Subscription monetization is out of scope. Platform transaction fees are the approved revenue direction.

## Change discipline

Every material product, trust, payment, architecture, implementation, or workflow change must update:

1. `docs/roadmap.md`
2. `docs/changes.md`
3. `docs/learning.md`
4. Every affected canonical specialist document
5. `handoff.md` when the operational next action changes

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
- Do not force-push `main`, rewrite shared history, expose secrets, or use direct feature commits on `main`.
- Follow `docs/development/git-workflow.md`.
