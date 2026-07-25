# NitipCuy Cross-Session Handoff

Last updated: 2026-07-25 16:36 WIB

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

Issue #3 proves these boundaries with simulated public trip discovery, destination/date search, trip detail, chronological public Q&A, and deterministic platform-service mocks. It intentionally implements no account, protected mutation, address, private chat, database, real provider, or payment movement.

The shell is a functional architecture probe. It is not a production UI and has no visual approval.

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
| Last pushed implementation checkpoint | `e1d0669e80430c3abc1f4ca4e94637c827bc3f37` |
| Checks at that checkpoint | Lifecycle passed; application quality in progress; CodeRabbit pending at 16:36 WIB |
| Live head, checks, reviews, and mergeability | Volatile; retrieve directly before any approval or merge action |
| Merge authority | Not granted for issue #3; fresh BurinSN approval is required after exact-head evidence |
| Branch protection | Unavailable for this private repository on the current GitHub plan |
| Deployment | None |
| Production providers | None activated |

The tracked handoff cannot contain its own final commit SHA. Copy immutable identifiers only from direct Git or GitHub output and treat the table as a timestamped checkpoint, never as permission to skip live verification.

## 6. Current work item

Issue #3 owns the architecture and application-foundation slice.

Implemented locally:

- ADR 0003 and the supporting system-architecture document;
- exact Node.js, pnpm, framework, compiler, lint, format, task, and test pins;
- modular workspace packages for domain, application, adapters, and web delivery;
- validated published-trip domain behavior, including origin-local departure date plus exact timezone-bearing departure timestamp;
- read-only trip discovery and detail use cases;
- deterministic in-memory repository plus mock payment, logistics, identity-verification, evidence-storage, clock, identifier, transaction, audit, and outbox adapters with no external calls;
- a local Indonesian web shell with explicit simulated-data and inactive-transaction notices;
- PR-only application-quality CI with read-only permission and immutable action references;
- local quality-gate documentation and production dependency overrides for audited patched `postcss` and `sharp` versions.

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
- `pnpm check`: format, lint, strict type checking, 13 unit tests, and production build passed;
- Next.js production routes built for `/`, `/_not-found`, and three generated `/trips/[tripId]` fixture paths;
- production HTTP probe returned `200` for home, filtered search, and a known trip, `404` for an unknown trip, passed content assertions, and emitted no fallback error;
- lifecycle, diff, workflow YAML, internal-link, credential-pattern, placeholder, dependency-direction, provider-SDK, unsafe-`any`, console, and source-network scans passed;
- workflow action tags resolve to their pinned immutable commits and both commits are verified by GitHub;
- no external service or production credential was required.

Hostile-review corrections already made:

- rejected TypeScript 7 and ESLint 10 because the installed peer graph does not support them;
- removed a hard-coded Jakarta-midnight comparison from the trip timeline;
- compare Q&A timestamps as real instants across timezone offsets;
- removed false Turbo output warnings and the App-Router-only ESLint warning;
- replaced vulnerable Next.js transitive `postcss` and `sharp` versions with audited patched overrides;
- selected `postcss` `8.5.18` instead of a release inside the package-manager minimum-age window;
- converted simulated trip details to build-time known paths and rejected unknown slugs before streamed rendering so missing trips return a quiet HTTP `404`, not a `200` or an internal fallback error.

Still required before requesting merge:

1. Commit and push this pull-request-state documentation checkpoint.
2. Inspect hosted checks, annotations, review objects, comments, and findings on the resulting exact immutable head.
3. Resolve or explicitly disposition every material finding through the same branch and update all four lifecycle documents again if code or operational truth changes.
4. Ask BurinSN for fresh issue #3 merge approval.

Browser automation and visual approval were not performed and are not claimed.

## 8. Blockers and gates

No external blocker prevents completing issue #3 or continuing later development with mocks.

The following still block real-money pilot activation:

1. written DOKU Partner/Aggregator approval and complete commercial terms;
2. confirmed Hold plus Split channels, maximum hold, partial release, refund, reserve, and failure behavior;
3. approved logistics integration and exception model;
4. route-aware prohibited and restricted-item taxonomy;
5. cancellation, refund, dispute, insurance, loss, damage, customs, and provider-cost allocation policy;
6. bounded pilot route, category, value, weight, capacity, and participant rules;
7. legal, privacy, security, incident-response, support, reconciliation, and operational sign-off.

These are Stage 3 activation gates, not reasons to delay provider-independent platform work.

## 9. Exact next action

Commit and push the pull-request-state documentation checkpoint, then audit pull request #4 on the resulting exact immutable head.

Do not create another pull request. Retrieve pull request #4's exact head, hosted checks, review objects, findings, mergeability, and complete base diff. Fix findings through the same branch and update all four lifecycle documents again.

Do not merge issue #3, deploy, contact providers, move money, or claim visual approval without the corresponding fresh BurinSN authority.
