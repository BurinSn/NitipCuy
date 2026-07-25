# NitipCuy System Architecture

Status: Accepted direction; issue #3 implementation corrections in progress

Last reviewed: 2026-07-25

Binding decision: [ADR 0003](../decisions/0003-web-architecture-and-application-foundation.md)

## 1. Architectural objective

NitipCuy must make jastip discovery and transactions explicit, evidence-backed, and safer without turning BurinSN into the merchant, importer, customs broker, carrier, or seller for every item.

The architecture therefore protects five properties:

1. domain rules remain independent of frameworks and providers;
2. public discovery never leaks private identity, address, order, or evidence data;
3. every protected mutation is authorized, idempotent, attributable, and auditable;
4. payment and logistics states are reconciled rather than trusted from redirects or callbacks;
5. production provider uncertainty does not block mock-backed platform development.

## 2. Runtime shape

```text
Browser
  |
  v
Next.js App Router on Node.js 24
  |-- public server-rendered discovery
  |-- protected route handlers and server actions
  |-- request validation and presentation
  |-- server-only composition root
  |
  v
Application use cases
  |
  +--> Domain
  |
  +--> Repository / transaction ports ------> PostgreSQL adapter
  +--> Identity port -----------------------> identity adapter
  +--> Evidence storage port ---------------> private object storage adapter
  +--> Payment port ------------------------> DOKU candidate adapter
  +--> Logistics port ----------------------> Biteship candidate adapter
  +--> Audit / outbox ports ----------------> PostgreSQL adapter
```

Only the web application is deployable in Stage 1. Domain, application, and adapters are packages, not network services.

## 3. Source layout and dependency rules

```text
apps/
  web/
    src/app/          Next.js delivery
    src/server/       composition and server-only fixtures

packages/
  domain/             entities, value objects, invariants
  application/        use cases and ports
  adapters/           in-memory and external implementations
```

Allowed imports:

| Source | May import |
|---|---|
| `packages/domain` | JavaScript and TypeScript language/runtime primitives only |
| `packages/application` | `packages/domain` |
| `packages/adapters` | `packages/application`, `packages/domain`, adapter SDKs |
| `apps/web` delivery | application contracts and domain presentation types |
| `apps/web` composition | application use cases and concrete adapters |

Forbidden imports:

- domain to application, adapters, React, Next.js, Prisma, environment variables, or provider SDKs;
- application to concrete adapters, React, Next.js, Prisma, or provider SDKs;
- client components to server composition, database, secrets, private storage, provider SDKs, or application mutation internals;
- provider callbacks directly to domain repositories or ledger tables.

Package manifests constrain package-name dependencies, but they do not prevent cross-package relative imports. Review and manual scans currently enforce the direction. An automated architecture gate that covers relative, aliased, type-only, and dynamic imports remains required before issue #3 can merge.

## 4. Bounded contexts

### Identity and trust

Owns:

- internal account identity;
- provider-subject mapping;
- contact verification;
- seller eligibility and verification status;
- capability grants, restrictions, and session invalidation;
- linked-account risk signals.

Does not own orders, reviews, or payment settlement.

### Marketplace discovery

Owns:

- jastipper profile presentation;
- trip drafts and publication;
- origin, destination, deadlines, dates, capacity, service modes, and delivery terms;
- product offers and open-request availability;
- public trip, listing, and request discussion.

Does not own private addresses, paid commitments, or settlement.

### Ordering

Owns:

- customer request;
- seller acceptance or rejection;
- accepted commercial snapshot;
- private delivery method and address reference;
- order lifecycle and cancellation intent.

An order preserves the accepted terms. Later trip edits do not silently rewrite committed orders.

### Fulfilment and evidence

Owns:

- purchase, collection, photo, receipt, weight, package, dispatch, pickup, and delivery evidence;
- evidence requirements by mode and category;
- QR and OTP handover evidence;
- immutable evidence metadata and private-blob references.

File bytes live in private object storage. The database stores metadata, hashes, classification, ownership, and retention state.

### Payments and ledger

Owns:

- payment intent and held state;
- internal balanced ledger;
- platform fee;
- release, split, refund, chargeback, reserve, payout, and reconciliation state;
- provider event inbox and idempotency.

Provider success is evidence, not authoritative internal settlement.

### Logistics

Owns:

- declared delivery choice and cost basis;
- quote evidence;
- dispatch registration;
- tracking events;
- delivery evidence and exception state.

Logistics does not decide order settlement by itself.

### Moderation and disputes

Owns:

- content and transaction risk cases;
- warnings, restrictions, holds, suspensions, bans, and appeals;
- dispute evidence and resolution commands;
- lawful escalation and audit history.

Moderation commands may block payment release but cannot directly rewrite ledger rows.

### Reputation

Owns:

- transaction eligibility for review;
- dimension ratings;
- review moderation and challenge;
- aggregate reputation views.

Only completed protected orders can create verified reviews.

## 5. Initial domain proof

Issue #3 implements one framework-free published-trip model with:

- a validated trip ID;
- different origin and destination;
- an origin-local departure date paired with an exact timezone-bearing departure timestamp;
- request deadline before the exact departure instant;
- estimated arrival no earlier than departure;
- at least one supported service mode;
- non-negative remaining capacity;
- seller-defined rate and delivery summaries;
- valid rating bounds;
- public question IDs unique within a trip;
- public questions sorted oldest to newest by their actual instants across timezone offsets.

Date-only and timezone-bearing timestamp values receive strict runtime calendar, clock, and timezone-offset validation. TypeScript unions do not replace runtime validation for delivery, persistence, or provider inputs.

The proof intentionally contains public simulated data only. It does not contain an account, address, private chat, payment, real seller, real review, or provider record.

## 6. Persistence direction

PostgreSQL is authoritative. Prisma lives only in a future database adapter.

Core rules:

- use database constraints for identities, uniqueness, non-nullability, amounts, and state references;
- use transactions for each consistency boundary;
- use optimistic or explicit locking where concurrent acceptance, capacity, payment, release, refund, or moderation can conflict;
- use an inbox table for provider event deduplication;
- use an outbox table for reliable post-commit work;
- use append-only audit and financial records;
- keep current projections separate from immutable history;
- never use destructive schema synchronization in production;
- migrations are reviewed source files and run separately from application startup.

Initial target:

- PostgreSQL 18 compatible schema;
- Neon managed PostgreSQL in Singapore;
- pooled runtime connection;
- direct migration connection;
- separate development, test, preview, and production databases or branches;
- a literal test-environment acknowledgement before any destructive test reset.

Production database creation is not authorized by this document.

## 7. Identity and authorization

### Identity

The system stores:

- internal `AccountId`;
- provider name;
- immutable provider subject;
- verification and assurance metadata;
- contact references;
- session version or revocation state.

It does not store passwords.

Seller verification is not the same as login. It may include liveness, identity, bank ownership, provider KYB, and platform trust review.

### Authorization

Every protected command evaluates:

1. authenticated internal account;
2. active session;
3. account and profile restrictions;
4. required capability;
5. resource ownership or transaction role;
6. current aggregate state;
7. risk or moderation hold;
8. idempotency and concurrency conditions.

Missing context denies. Client-side navigation, hidden controls, route names, or claimed role fields never authorize a command.

## 8. Public and private data boundaries

Public:

- display name;
- published trip route and dates;
- declared capacity and service modes;
- seller-defined public rate summary;
- public delivery summary;
- eligible rating aggregate;
- public questions and answers after moderation.

Private:

- legal identity and verification evidence;
- phone, email, device, bank, and risk signals;
- exact address and pickup details;
- private chat;
- receipts containing personal data;
- raw evidence;
- payment, payout, dispute, and moderation details;
- internal audit and enforcement reasons.

Private data is fetched only after authorization and is never embedded in public cache entries or static fixtures.

## 9. Provider port rules

Every provider adapter must:

- validate signatures and timestamps;
- store the raw event in a restricted inbox before interpretation;
- deduplicate by provider and event identity;
- map provider state to an application command;
- execute state changes through the authoritative use case;
- record reconciliation and retry state;
- log identifiers and reason codes without sensitive content;
- fail closed on unknown or contradictory provider state.

The DOKU and Biteship candidates do not change these rules.

## 10. Background work

Do not start untracked promises after an HTTP response.

Stage 1 has no background worker. Before background work is required:

- write a transaction-bound outbox record;
- select a retrying worker or managed workflow mechanism;
- define idempotency, poison-message, alert, and replay behavior;
- keep one authoritative status in PostgreSQL;
- make operator recovery explicit.

Extract a worker deployment only when duration, throughput, or availability evidence requires it.

## 11. Security baseline

- No secrets or production URLs in Git.
- No production provider calls from tests or previews.
- Environment parsing is server-only and fail-fast.
- All external text, numbers, files, redirects, callbacks, and statuses are untrusted.
- Mutation inputs receive schema validation at the delivery boundary and invariant validation in the domain.
- Rate limiting, bot controls, and abuse signals protect registration, publication, discussion, checkout, upload, and reporting.
- Private files use authorization-mediated access, non-public storage, type and size limits, malware scanning, hash evidence, and retention policy.
- Structured logs exclude addresses, identity documents, payment data, tokens, raw chat, and uploaded content.
- Audit records include actor, action, target, reason, time, request correlation, and outcome.
- Security headers, content security policy, secure cookies, CSRF controls, and open-redirect checks are required before protected browser flows.
- Dependency and workflow action references are pinned and audited.

The trust-and-safety behavior remains governed by [the moderation model](../trust-safety/moderation-model.md).

## 12. Quality and test boundaries

Plain unit tests must exercise:

- domain invariants;
- use cases with test repositories;
- provider-neutral port behavior;
- adapter mapping and idempotency;
- authorization denials;
- state-transition conflicts.

The domain invariant tests satisfy the published-trip validation and cross-offset chronology portion. Automated dependency-boundary enforcement and provider-adapter idempotency tests remain open issue #3 findings.

Integration tests later exercise:

- migrations and constraints on disposable PostgreSQL;
- repository mapping and transactions;
- provider signature and event inbox handling;
- private object-storage authorization;
- outbox processing.

Browser tests later exercise:

- public discovery;
- protected mutation and denial;
- public versus private information;
- accessibility;
- responsive behavior;
- evidence and recovery workflows.

Build success is not runtime, browser, security, legal, payment, provider, or visual approval.

## 13. Current implementation state

Implemented in issue #3:

- exact workspace toolchain;
- package dependency direction;
- public trip domain invariants;
- trip discovery use cases;
- in-memory trip repository;
- provider-neutral payment, logistics, identity verification, evidence storage, clock, identifier, transaction, audit, and outbox ports;
- deterministic in-memory and mock adapters for those boundaries;
- server-only composition;
- destination and date search;
- trip detail;
- chronological public questions and answers;
- correct HTTP `404` behavior for unknown simulated trip paths;
- PR quality workflow.

The payment, logistics, evidence, transaction, audit, and outbox interfaces and mocks exist, but their transaction scoping, asynchronous state, idempotency, and evidence-integrity contracts remain under corrective review. Their existence is not evidence that those guarantees are implemented.

Not implemented:

- persistence;
- identity and protected authorization;
- mutations;
- private data;
- real providers;
- order, payment, evidence, logistics, moderation, dispute, or review workflows;
- production deployment;
- visual approval.
