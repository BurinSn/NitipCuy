# ADR 0003: Web Architecture and Application Foundation

Status: Accepted

Date: 2026-07-25

Amended: 2026-07-28

Issue: [#3 Establish web architecture and application foundation](https://github.com/BurinSn/NitipCuy/issues/3)

## Context

NitipCuy needs public, destination-aware discovery and a transaction system that will later handle identity, private addresses, evidence, held payments, logistics events, moderation, disputes, and verified reviews.

The product is being built by a solo BurinSN developer. The architecture must keep operational cost and deployment complexity proportionate while protecting the core marketplace rules from UI, database, payment, logistics, identity, and hosting choices.

The architecture must also allow Stage 1 and Stage 2 development to continue with deterministic mocks. DOKU, Biteship, legal, policy, identity-provider, and production-infrastructure decisions remain gates for real transactions, not permission to begin building.

## Decision

### 1. Use a modular monolith

Start with one repository and one deployable web application:

- `apps/web` owns Next.js delivery, server rendering, request parsing, presentation, and the server-only composition root.
- `packages/domain` owns framework-free entities, value objects, invariants, and domain terminology.
- `packages/application` owns use cases and driven ports. It may depend only on the domain package.
- `packages/adapters` owns in-memory, mock, database, payment, logistics, identity, evidence-storage, and other external implementations. It may depend on application and domain.

Dependencies point inward:

```text
apps/web -> packages/adapters -> packages/application -> packages/domain
     |                                |
     +------------------------------->+
```

The domain never imports Next.js, React, Prisma, a provider SDK, an environment reader, or a database client. Application use cases never import concrete adapters.

The repository enforces this direction through both package manifests and a TypeScript-AST source gate. The gate parses static imports and exports, `import type`, import-type expressions, triple-slash references, dynamic imports, `require`, and `module.require`; rejects non-static module specifiers; forbids cross-project relative paths and workspace deep imports; requires declared `workspace:` dependencies; restricts concrete adapters to web server composition; and prevents client modules from importing server source or runtime application/adapters. Test files may use the approved test runner without weakening production-source rules.

### 2. Select the supported web toolchain

The issue #3 baseline is pinned to:

| Capability | Selected version | Reason |
|---|---:|---|
| Production Node.js line | `24.x` | Active LTS and the current Vercel default production line |
| Reproducible Node.js patch | `24.18.0` | Current Node 24 LTS patch verified from the official release index |
| pnpm | `11.17.0` | Current supported workspace package manager; exact integrity is pinned |
| Next.js | `16.2.11` | Current stable App Router release |
| React / React DOM | `19.2.8` | Current stable React line supported by Next.js 16 |
| TypeScript | `6.0.3` | Newest stable release inside TypeScript-ESLint's supported `<6.1.0` range |
| ESLint | `9.39.5` | Newest release supported by every active Next.js ESLint peer |
| Prettier | `3.9.6` | Deterministic source formatting |
| Turbo | `2.10.6` | Small workspace task graph and cache |
| Vitest | `4.1.10` | Framework-independent unit tests |

TypeScript 7 and ESLint 10 were evaluated and rejected for this baseline. Installation proved that TypeScript-ESLint does not yet support TypeScript 7 and transitive Next.js lint plugins do not yet support ESLint 10. “Latest” is not accepted when the actual peer graph is incompatible.

The current Next.js release also resolves transitive `postcss` `8.4.31` and `sharp` `0.34.5`. The production audit rejects those versions because patched security releases are available. The workspace therefore applies narrow, exact overrides to `postcss` `8.5.18` and `sharp` `0.35.3`. The full peer, unit, build, runtime, and audit gates must remain green, and the overrides must be removed or revised when Next.js publishes a supported patched graph.

Primary evidence checked on 2026-07-25:

- [Node.js release status](https://nodejs.org/en/about/previous-releases)
- [Next.js installation and system requirements](https://nextjs.org/docs/app/getting-started/installation)
- [Next.js 16 upgrade requirements](https://nextjs.org/docs/app/guides/upgrading/version-16)
- [PostCSS source-map file disclosure advisory](https://github.com/advisories/GHSA-r28c-9q8g-f849)
- [sharp inherited libvips advisory](https://github.com/advisories/GHSA-f88m-g3jw-g9cj)
- npm package metadata for the exact package versions
- the installed pnpm peer-dependency graph

### 3. Use App Router server components by default

- Pages, layouts, and data reads are server components unless browser state or browser APIs are required.
- Client components are narrow interactive leaves.
- Request parsing belongs in the delivery layer.
- Use cases receive provider-neutral inputs and return provider-neutral results.
- Public trip discovery may be cached only when freshness and invalidation are explicit.
- The public `PublishedTrip` type is a read-only projection, not the authoritative future `TripOffer` aggregate and never mutation, checkout, capacity-reservation, or authorization input.
- Identity, address, order, evidence, payment, dispute, and moderation surfaces are dynamic and private by default.
- Server-only composition is enforced with the `server-only` marker.

### 4. Select PostgreSQL with an isolated Prisma adapter

PostgreSQL is the authoritative transactional database direction. Prisma ORM is selected for the future database adapter and migration workflow because it is already operated in another BurinSN product and currently supports PostgreSQL 18 and Neon.

Constraints:

- Prisma models are persistence models, not domain entities.
- Repository adapters map between Prisma records and domain objects.
- Migrations are committed, SQL-reviewed, forward-fix by default, and tested against a disposable database.
- Financial amounts use exact integer minor units or explicitly constrained PostgreSQL numeric values. No floating point is permitted for money.
- Order, payment, settlement, evidence, moderation, and audit transitions are transaction-bound and idempotent.
- A transactional outbox is required before cross-process or provider event publication.
- Prisma is introduced only with the first persisted slice. It is not added as an unused dependency in the architecture probe.

Neon PostgreSQL in AWS Singapore is the initial managed-database target. The target remains ordinary PostgreSQL so the adapter can move to another compatible managed or self-hosted provider if commercial, legal, operational, or reliability evidence requires it.

### 5. Select a Vercel-compatible deployment posture

The initial application deployment target is Vercel:

- Node.js `24.x`;
- Next.js App Router;
- Function region `sin1`;
- database in the matching Singapore region;
- one web deployment and no independent microservice.

No Vercel or Neon project is created by this ADR. Production provisioning, domain connection, secrets, deployment, legal review, data-location approval, and public launch require separate BurinSN authorization.

The application must also remain deployable as a standard Next.js Node server. Hosting-specific behavior does not enter the domain or application packages.

Primary evidence checked on 2026-07-25:

- [Vercel supported Node.js versions](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions)
- [Vercel function regions](https://vercel.com/docs/functions/configuring-functions/region)
- [Next.js deployment options](https://nextjs.org/docs/app/getting-started/deploying)
- [Neon regional status](https://neon.com/docs/introduction/status)
- [Prisma with Neon](https://docs.prisma.io/docs/orm/v6/overview/databases/neon)

### 6. Keep identity external and authorization internal

NitipCuy does not build or store passwords.

The identity direction is:

- external passwordless or standards-based authentication adapter;
- immutable provider subject mapped to an internal NitipCuy account ID;
- login identity, contact verification, seller verification, bank ownership, and trust tier are separate facts;
- a person can be a customer and jastipper, while transaction permissions remain role-specific;
- production identity-provider selection requires a separate capability and security proof before protected writes are enabled.

Authorization is server-authoritative and deny-by-default:

- public discovery is anonymous read access;
- profile and trip mutations require the authenticated account owner;
- accepting orders requires an active, eligible jastipper profile;
- moderation, dispute, payment, and settlement commands require explicit capabilities;
- UI visibility never grants permission;
- every sensitive denial uses a generic external response and a reasoned internal audit record.

The issue #3 shell uses no login adapter because it exposes only public simulated data and no mutation.

### 7. Define provider-independent driven ports

Application ports describe NitipCuy intent:

- payment initiation, release request, refund request, status inspection, and reconciliation;
- logistics quote and dispatch registration;
- identity principal resolution;
- evidence storage and retrieval;
- clock and identifier generation;
- repository boundaries;
- audit and outbox recording.

Ports must not expose DOKU, Biteship, Vercel, Neon, or another vendor's object model. Provider webhooks and status callbacks are untrusted adapter inputs and never directly mutate an order or ledger.

The provider-neutral payment contract separates command submission from observed outcome. Every initiation has a stable internal payment-attempt ID, allowing inspection after an ambiguous response even when no provider payment reference was returned. Initiation returns accepted-for-processing, rejected, or unknown plus a customer action only when accepted. Release and refund requests use the same non-terminal submission model. A separate provider snapshot reports collection, hold, release, refund, settlement, and chargeback observations; a provider signal only requests fresh inspection. The current pure assessment may confirm initial payment protection only when exact collected and held amounts agree. It does not implement an order mutation, ledger, provider adapter, release/refund reconciliation, or settlement reconciliation.

The architecture probe implements deterministic in-memory trip discovery plus mock payment, logistics, identity-verification, evidence-storage, clock, identifier, audit, and outbox adapters. The mocks move no money, book no delivery, verify no real identity, store no production evidence, start no background work, and contact no service.

Issue #3 intentionally exposes no transaction port. A callback-only `execute(work)` contract and passthrough adapter were removed because they could not bind repositories, ledger, audit, and outbox writes to one underlying transaction, enforce rollback, or prove concurrency behavior.

The first persisted write slice must introduce a database-backed, transaction-scoped unit of work. Its callback receives only repositories and append-only writers bound to the same underlying PostgreSQL transaction. Unscoped write adapters may not be substituted inside that callback. Successful authoritative state, balanced ledger entries, success audit, and required outbox records commit together or roll back together. Provider and object-storage network calls remain outside the database transaction through explicit pending, inbox, outbox, and reconciliation states.

The implementation is incomplete until disposable-PostgreSQL integration tests prove rollback after fault injection at each write boundary, atomic last-capacity contention, stale-version or lock-conflict behavior, balanced ledger constraints, state-to-audit and state-to-outbox atomicity, bounded transaction and lock timeouts, and absence of provider calls while the transaction is open. A failed or denied attempt may be recorded after rollback through an explicitly separate path, but it cannot survive as a successful state-change audit.

### 8. Split architecture proof from the first persisted vertical slice

Issue #3 proves the architecture through a public read-only path:

```text
simulated published trips
  -> application discovery use case
  -> in-memory repository adapter
  -> server-only composition root
  -> destination/date search with source-service and ordering windows
  -> trip detail
  -> chronological public questions and answers
```

The next issue implements the first persisted vertical slice:

```text
account
  -> jastipper profile
  -> trip draft
  -> moderation gate
  -> trip publication
  -> destination/date discovery
  -> trip detail
  -> public question and answer
```

This split prevents architecture, identity, database schema, protected mutation, and UI behavior from landing as one unreviewable change. It preserves the accepted product order.

## Rejected alternatives

### Microservices from the start

Rejected because the product has no measured scaling boundary, independent team, or deployment need that justifies distributed transactions, additional failure modes, and higher operational cost.

### One unstructured Next.js source tree

Rejected because payment, logistics, database, and UI dependencies could silently become the source of domain truth. Package boundaries make dependency direction visible to TypeScript and the package manager.

### Separate API service from the start

Rejected because one App Router application can serve public pages, route handlers, and server actions while the product has one web client. Extract an API only when a second client or independently scaled workload proves the need.

### Provider SDKs in use cases

Rejected because DOKU and Biteship are conditional candidates. Provider-specific types would make external approval a prerequisite for core development and make later replacement expensive.

### In-house password authentication

Rejected because credential storage and recovery would add high-risk security work unrelated to NitipCuy's differentiating value.

### Event sourcing

Rejected for the initial system. The product needs append-only evidence, ledger, audit, and outbox records, but it does not yet need every aggregate reconstructed from an event stream.

### TypeScript 7 and ESLint 10

Rejected for this baseline because the installed peer graph is unsupported. Re-evaluate when all active lint and TypeScript tooling declares compatible ranges and the full gate passes without overrides.

## Consequences

- A solo developer operates one deployable while retaining clear extraction boundaries.
- Core use cases can run in tests without Next.js, a database, Docker, or network access.
- Provider integration can proceed later without rewriting the domain.
- The initial public shell is a functional architecture probe, not visual approval or production readiness.
- Public ordering-window presentation can evolve independently from the future authoritative trip-offer and order aggregates; closing a public offer never mutates accepted order snapshots.
- Dependency direction now fails in the exact local and hosted quality path when a manifest or parsed source edge violates the accepted layer graph.
- More mapping code is required between domain, persistence, providers, and HTTP. That duplication is intentional at trust boundaries.
- Cross-context workflows must use explicit application orchestration, transactions, audit records, and eventually an outbox.

## Extraction triggers

Do not split a service merely because a module grows. Consider extraction only when at least one trigger is measured:

- a workload needs independent scaling or availability;
- a security or compliance boundary requires separate isolation;
- a background process exceeds the web runtime's duration or retry model;
- a second client needs a stable independently deployed API;
- ownership or release cadence is genuinely independent;
- database contention proves that one transactional boundary is harmful.

Any extraction requires a new ADR, migration plan, failure analysis, and BurinSN approval.
