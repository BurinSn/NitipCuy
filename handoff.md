# NitipCuy Cross-Session Handoff

Last updated: 2026-07-27 18:27 WIB

Handoff owner: Codex

Product owner: BurinSN

## 1. Role, authority, and freshness contract

This file is the single operational resume point. It owns verified repository state, active bounded work, authority boundaries, blockers, verification, and the exact next action.

It is current-state documentation, not history. Update it whenever the issue, branch, pull request, verification, blocker, approval, or next action changes. Verified live state overrides this file. Reconcile any mismatch before continuing.

This handoff never grants merge, deployment, provider contact, payment movement, production action, visual approval, or product-scope authority.

## 2. Mandatory resume protocol

Before planning or changing NitipCuy:

1. Read `AGENTS.md`.
2. Read `docs/roadmap.md`.
3. Read this handoff.
4. Read the newest `docs/changes.md` and relevant `docs/learning.md` entries.
5. Read `docs/product/master-specification.md`.
6. Read `docs/architecture/system-architecture.md`, relevant ADRs, and relevant specialist documents.
7. Read `docs/development/git-workflow.md` before Git or GitHub mutation.
8. Verify local branch, status, head, `origin/main`, issue, pull request, reviews, and exact-head checks.
9. Reconcile every mismatch before implementation.

Minimum local verification:

```bash
git status --short --branch
git rev-parse HEAD
git rev-parse origin/main
git log --oneline --decorate -5
```

Do not inspect or expose `.env*`, credentials, private keys, identity documents, payment data, customer addresses, or production secrets while gathering context.

## 3. Product compass

NitipCuy is a standalone BurinSN marketplace for independent jastippers and customers. It is separate from BCN and uses `Cuy`, not `Coy`.

The two primary service modes are:

1. **Shop for me**: a jastipper purchases an item for the customer.
2. **Carry my item**: the customer already owns or arranged the item and hires a jastipper to collect or carry it.

Non-negotiable boundaries:

- discovery is trip-first, route-aware, destination-aware, and timeline-aware;
- jastippers set their own item, service, kilogram, minimum, maximum, capacity, pickup, and delivery terms;
- NitipCuy does not impose a mandatory seller rate;
- public discussion serves reusable questions; private surfaces hold addresses, identity, receipts, disputes, and order details;
- address and final-delivery terms are known before paid commitment;
- only protected completed platform transactions receive verified reviews;
- revenue is a disclosed transaction protection fee, not subscriptions or paid boosts;
- the planning fee remains 3 percent, minimum Rp15,000 and maximum Rp100,000, pending provider and pilot economics;
- risk scanning, evidence, enforcement, appeals, disputes, and reconciliation remain platform responsibilities;
- severe prohibited conduct can receive immediate takedown or suspension;
- NitipCuy is not designed as the cross-border merchant, importer, customs broker, carrier, or legal seller of jastipper goods.

The master product specification and accepted ADRs control detailed behavior.

## 4. Accepted architecture foundation

ADR 0003 selects:

- a modular monolith with one deployable Next.js App Router web application;
- framework-free `domain`, application-use-case and port, adapter, and delivery boundaries;
- Node.js `24.x`, reproducible patch `24.18.0`, pnpm `11.17.0`, Next.js `16.2.11`, and the compatible pinned toolchain;
- server components by default and a server-only composition root;
- PostgreSQL authority with a future isolated Prisma adapter;
- external passwordless or standards-based identity mapped to internal account IDs;
- server-authoritative, deny-by-default authorization;
- provider-independent payment, logistics, identity, evidence, repository, audit, and outbox contracts;
- Vercel Node.js in `sin1` plus Singapore PostgreSQL as the intended first hosting posture, without provisioning or deployment authority.

ADR 0004 adds:

- OWASP ASVS 5.0 Level 2 as the complete production web-application verification target, with additional risk-based review for high-impact flows;
- layered edge, WAF, bot, shared rate-limit, resource-budget, session, authorization, query, upload, callback, monitoring, incident, and recovery controls;
- explicit evidence levels from designed through incident-tested so accepted architecture cannot be mislabeled production security;
- stateless horizontally scalable web instances, pooled PostgreSQL, shared cross-request control state, private direct-to-quarantine evidence storage, and durable workers before asynchronous work;
- numerical capacity, provider-quota, cost, RPO, RTO, load, abuse, and recovery evidence before real-money pilot activation;
- evidence-driven optimization and service extraction instead of premature microservices.
- mandatory privileged phishing-resistant MFA or approved high-assurance step-up with non-downgrading recovery;
- an edge-only origin, explicit trusted-proxy chain, canonical host and request interpretation, and protected fail-closed dependency behavior;
- provider and threat-modelled application encryption, managed-key lifecycle, encrypted backups, restore, retention, and verified deletion;
- canonical public-only caching with poisoning, deception, stampede, hot-key, and stale-window controls;
- expand-and-contract migrations with old/new web, worker, payload, and queue compatibility during rolling deployment.

Issue #3 proves these boundaries with simulated public trip discovery, destination/date search, trip detail, chronological public Q&A, and deterministic platform-service mocks. It intentionally implements no account, protected mutation, address, private chat, database, real provider, or payment movement.

The shell is a functional architecture probe. It is not a production UI, has no visual approval, and does not implement or verify the production security and scaling controls in ADR 0004.

## 5. Verified repository state

| Field | Verified state |
|---|---|
| Local project | `/Users/miclawrencee/Workspace/NitipCuy` |
| Canonical remote | `https://github.com/BurinSn/NitipCuy` |
| Visibility / default branch | Private / `main` |
| Verified `main` and issue #3 base | `fd9c98aefff199bb0e8ff954fa3a56e6764cf03a` |
| Prior governance work | Issue #1 closed; pull request #2 squash-merged |
| Active issue | [#3 Establish web architecture and application foundation](https://github.com/BurinSn/NitipCuy/issues/3) |
| Active branch | `feat/3-architecture-foundation` |
| Pull request | [#4 feat: establish application architecture foundation](https://github.com/BurinSn/NitipCuy/pull/4) |
| Last live-verified pushed correction head before this amendment | `bf48727ed9f1e65d87919f4fbe11ac0815542355` |
| Checks at that checkpoint | Application quality run `30257081811` and lifecycle run `30257081823` passed without annotations |
| Independent review at that checkpoint | CodeRabbit run `86ff3d62-b1f7-4429-839e-e07fd4402c20` was rate-limited and created no review object or finding; it provides no review coverage |
| First hostile-review correction | Published-trip runtime invariants committed, pushed, and hosted-verified |
| Second hostile-review correction | Issue #3 identity acceptance and pull-request scope reconciled with the deliberately deferred persisted account implementation; committed, pushed, and hosted-verified |
| Security and scale amendment | Accepted, committed, pushed, and required hosted workflows verified; production controls remain unimplemented |
| Live head, checks, reviews, and mergeability | Volatile; retrieve directly before any approval or merge action |
| Merge authority | Not granted for issue #3; fresh BurinSN approval is required after exact-head evidence |
| Branch protection | Unavailable for this private repository on the current GitHub plan |
| Deployment | None |
| Production providers | None activated |

The tracked handoff cannot contain its own final commit SHA. Copy immutable identifiers only from direct Git or GitHub output and treat the table as a timestamped checkpoint, never as permission to skip live verification.

## 6. Current work item

Issue #3 owns the architecture and application-foundation slice. A direct hostile review found material implementation and acceptance gaps after the original technical checks passed. Pull request #4 is therefore in corrective review and is not ready for merge.

The issue now states that external-identity-to-internal-account mapping and deny-by-default authorization are documented architecture directions. Mapping implementation is explicitly deferred to the first persisted account slice, matching the issue scope, exclusions, ADR 0003, current code, and roadmap.

The security and scale amendment answers BurinSN's security and growth requirement through ADR 0004 plus dedicated security and scalability documents. The current hostile-review correction closes six material design gaps: sensitive-data encryption and managed-key lifecycle; mandatory privileged assurance and non-downgrading recovery; trusted-proxy, forwarded-header, and canonical-host rules; explicit fail-open or fail-closed dependency behavior; cache poisoning, deception, stampede, and hot-key controls; and expand-and-contract mixed-version deployment. These are binding design requirements. They are not claims that production infrastructure or controls exist.

Implemented locally:

- ADR 0003 and the supporting system-architecture document;
- exact Node.js, pnpm, framework, compiler, lint, format, task, and test pins;
- modular workspace packages for domain, application, adapters, and web delivery;
- validated published-trip domain behavior, including origin-local departure date plus exact timezone-bearing departure timestamp;
- strict runtime rejection of unsupported service modes, impossible calendar and clock values, invalid timezone offsets, and duplicate public-question IDs;
- public-question sorting by actual instant across differing timezone offsets;
- read-only trip discovery and detail use cases;
- deterministic in-memory repository plus mock payment, logistics, identity-verification, evidence-storage, clock, identifier, transaction, audit, and outbox adapters with no external calls;
- a local Indonesian web shell with explicit simulated-data and inactive-transaction notices;
- PR-only application-quality CI with read-only permission and immutable action references;
- local quality-gate documentation and production dependency overrides for audited patched `postcss` and `sharp` versions.
- accepted security, anti-abuse, resilience, and scale requirements with explicit evidence-level claims and pilot gates.
- accepted encryption, managed-key, privileged-assurance, trusted-edge, dependency-outage, cache-safety, and deployment-compatibility requirements at the **designed** evidence level only.

Deliberately excluded:

- production or preview deployment;
- visual approval or final experience design;
- account creation, seller verification, protected authorization, and persistence;
- real DOKU, Biteship, identity, storage, or database integration;
- orders, money movement, delivery booking, customer PII, or production secrets;
- provider outreach, Threads promotion, public launch, microservices, or event sourcing.

## 7. Verification checkpoint

Verified locally with Node.js `24.18.0` and pnpm `11.17.0`:

- `pnpm peers check`: no peer-dependency issues;
- `pnpm audit:prod`: no known production vulnerabilities after the explicit patched overrides;
- `pnpm check`: format, lint, strict type checking, 18 unit tests, and production build passed on the reconciled domain-correction tree;
- targeted domain type checking and 10 domain tests passed;
- an exact-Node adversarial probe rejected `UNSUPPORTED`, rejected `2026-02-30`, and sorted the `+08:00` earlier instant before the `+07:00` later instant;
- Next.js production routes built for `/`, `/_not-found`, and three generated `/trips/[tripId]` fixture paths;
- production HTTP probe returned `200` for home, filtered search, and a known trip, `404` for an unknown trip, passed content assertions, and emitted no fallback error;
- lifecycle, diff, workflow YAML, internal-link, credential-pattern, placeholder, dependency-direction, provider-SDK, unsafe-`any`, console, and source-network scans passed;
- workflow action tags resolve to their pinned immutable commits and both commits are verified by GitHub;
- no external service or production credential was required.

The first direct full-gate attempt invoked pnpm `11.17.0` through Node `24.18.0`, but nested package-script calls resolved the ambient Node `26.0.0` and pnpm `9.15.0`; `engine-strict` correctly failed the attempt. Re-running through the exact `npx` Node and pnpm wrapper propagated the supported toolchain to child processes and passed. The failed attempt is not counted as verification success.

Hostile-review corrections already made:

- reject unsupported service modes at runtime rather than relying on a TypeScript union;
- reject normalized impossible dates, invalid clock values, and invalid timezone offsets;
- sort public questions by parsed instants and require unique question IDs;
- rejected TypeScript 7 and ESLint 10 because the installed peer graph does not support them;
- removed a hard-coded Jakarta-midnight comparison from the trip timeline;
- compare Q&A timestamps as real instants across timezone offsets;
- removed false Turbo output warnings and the App-Router-only ESLint warning;
- replaced vulnerable Next.js transitive `postcss` and `sharp` versions with audited patched overrides;
- selected `postcss` `8.5.18` instead of a release inside the package-manager minimum-age window;
- converted simulated trip details to build-time known paths and rejected unknown slugs before streamed rendering so missing trips return a quiet HTTP `404`, not a `200` or an internal fallback error.

Still required before requesting merge:

1. Validate, commit, push, and inspect hosted checks and annotations for the six-gap design correction.
2. Resolve each remaining implementation finding through the same branch, one coherent correction at a time.
3. Reconcile issue #3 and pull-request claims after the final correction.
4. Ask BurinSN for fresh merge approval only when no material finding remains.

Browser automation and visual approval were not performed and are not claimed.

The first security and scale amendment passed the exact-toolchain frozen install, peer, format, lint, type, 18-test, production-build, production-audit, lifecycle, internal-link, and diff gates. The later identity and lifecycle reconciliation is hosted-verified at exact head `bf48727ed9f1e65d87919f4fbe11ac0815542355` through application run `30257081811` and lifecycle run `30257081823`, both without annotations. CodeRabbit was rate-limited and produced no review object or finding; this is unavailable independent-review evidence, not approval.

The current six-gap design correction has changed documentation only. Exact Node.js `24.18.0` and pnpm `11.17.0` frozen install, peer, format, lint, type, 18-test, production-build, production-audit, lifecycle, 20-file internal-link, stale-language, control-presence, and diff gates passed locally. Its resulting hosted exact-head checks still require inspection after push. No WAF, proxy policy, bot control, shared limiter, privileged MFA, encryption key, production session, database, cache, private upload pipeline, worker, monitoring, backup, load test, security test, deployment, or provider configuration was activated by the documentation.

## 8. Blockers and gates

No external blocker prevents continuing provider-independent development with mocks.

The following internal findings block issue #3 merge:

1. package dependency direction has no automated enforcement against cross-package relative imports;
2. the transaction port cannot bind repository, audit, ledger, and outbox changes to one enforceable transaction;
3. the payment port collapses asynchronous payment initiation and reconciliation directly into `HELD`;
4. payment, logistics, and evidence mocks ignore their idempotency keys;
5. evidence storage trusts a caller-supplied hash and models raw buffered content without a quarantine or verification lifecycle;
6. the public `PublishedTrip` projection is not yet clearly separated from the future authoritative Trip aggregate;
7. lifecycle, issue, and pull-request claims require reconciliation after every correction.

The following still block real-money pilot activation:

1. written DOKU Partner/Aggregator approval and complete commercial terms;
2. confirmed Hold plus Split channels, maximum hold, partial release, refund, reserve, and failure behavior;
3. approved logistics integration and exception model;
4. route-aware prohibited and restricted-item taxonomy;
5. cancellation, refund, dispute, insurance, loss, damage, customs, and provider-cost allocation policy;
6. bounded pilot route, category, value, weight, capacity, and participant rules;
7. legal, privacy, security, incident-response, support, reconciliation, and operational sign-off.
8. applicable OWASP ASVS 5.0 Level 2 traceability and independent review of high-impact flows;
9. verified identity, cookie, header, edge, WAF, bot, rate-limit, database, storage, payment, and logistics configuration;
10. approved capacity, latency, availability, provider-quota, cost, RPO, and RTO contract;
11. isolated ramp, spike, soak, abuse, provider-failure, and recovery evidence;
12. backup restore, session revocation, provider kill switch, incident response, and evidence-preservation exercises.

These are Stage 3 activation gates, not reasons to delay provider-independent platform work.

## 9. Exact next action

Commit and push the locally validated six-gap design correction to pull request #4. Inspect both required hosted workflows and annotations on the resulting immutable head, then retrieve and reconcile issue #3 and pull request #4 again.

After that published checkpoint is sound, implement automated dependency-boundary enforcement as the next bounded code correction. Cover cross-package relative, aliased, type-only, and dynamic imports; wire the gate into the exact local and hosted quality path; add adversarial fixtures or tests; and reconcile all lifecycle, issue, and pull-request claims.

Do not add account persistence or a production identity provider to issue #3. Those belong to the first persisted account slice after this architecture issue is corrected and merged.

Do not provision WAF, rate-limit, identity, database, storage, worker, monitoring, backup, security-test, load-test, or production infrastructure merely because the requirements are accepted.

Do not create another pull request.

Do not merge issue #3, deploy, contact providers, move money, or claim visual approval without the corresponding fresh BurinSN authority.
