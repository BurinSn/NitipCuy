# NitipCuy Scalability and Resilience

Status: Accepted design baseline; capacity targets and production infrastructure remain unapproved

Last reviewed: 2026-07-27

Binding decision: [ADR 0004](../decisions/0004-security-resilience-and-scale-baseline.md)

## 1. Objective

NitipCuy must grow from a solo-operated platform foundation to a marketplace serving materially more users without rewriting the core domain or creating an unsafe distributed system prematurely.

The design optimizes for:

- stateless horizontal web scaling;
- bounded work per request;
- authoritative transactions;
- durable asynchronous work;
- controlled provider failure;
- observable saturation and cost;
- tested recovery;
- evidence-driven extraction.

“Can handle many users” is not a verifiable requirement. Before a pilot or public beta, BurinSN must approve explicit traffic, latency, availability, storage, provider, and cost assumptions and test the system against them.

## 2. Initial deployment shape

```text
browser
  -> CDN / edge cache / DDoS and WAF layer
  -> stateless Next.js web instances
       -> shared session, idempotency, and rate-limit state
       -> pooled PostgreSQL
       -> private object storage
       -> durable outbox
  -> retrying worker when asynchronous work exists
       -> identity, payment, logistics, scan, notification, and reconciliation providers
```

The modular monolith remains one codebase. A web runtime and a worker may become separate deployables while sharing application contracts; that is not a requirement to split domain services.

## 3. Stateless web requirements

Production correctness must not depend on:

- process memory surviving a request;
- one user returning to the same instance;
- an in-memory lock, cache, rate limiter, session, or idempotency map;
- an untracked promise continuing after an HTTP response;
- a deployment having only one instance.

Per-request context is immutable and request-scoped. Cross-request state belongs in PostgreSQL or an approved shared system. Large file bytes go directly to private object storage through signed, bounded requests rather than through application memory.

Issue #11's first shared limiter candidate follows that rule: every existing persisted route uses one versioned policy authority and PostgreSQL buckets keyed by policy, axis, HMAC subject, and fixed-window start. Target ceilings are compound caller-target identities: network-target for anonymous public detail and account-target for authenticated publication, discussion, and moderation. They therefore distribute by caller instead of letting one caller consume a global target bucket. PostgreSQL supplies one timestamp per production decision so instance clock skew cannot split windows. Concurrent adapter instances share the same count; deterministic axis order reduces deadlock risk; the decision deletes at most 100 expired rows; denial audit and counter state commit together. This is production-shape shared state but only disposable-PostgreSQL integration evidence. Per-request cleanup is bounded but its aggregate write load is not load-tested. The fixed-window reset boundary, HMAC rotation, v1-to-v2 mixed deployment, thresholds, database capacity, provider edge identity, WAF/bot coordination, metrics, alerts, load, and incident behavior remain unapproved and unverified.

## 4. Public reads and caching

Public discovery is the primary cacheable workload.

- Cache only explicit public projections.
- Cache keys are canonical and include every normalized filter, authorization-independent representation dimension, locale, version, and encoding choice that changes the public response. Unbounded or attacker-controlled key cardinality is rejected.
- Freshness and invalidation are documented per projection.
- Publication, moderation, capacity, cancellation, and privacy changes trigger invalidation or a safely bounded stale period.
- Private identity, address, order, evidence, payment, dispute, moderation, and support data is never stored in a public cache.
- Personalized, authenticated, error, redirect, and authorization-dependent responses are private and use conservative cache headers; path shape or file-like suffixes never change that classification.
- Cache population derives the key and response classification from canonical server state, not untrusted forwarding or host headers, preventing cache poisoning and cache-deception variants.
- Concurrent misses use request coalescing or single-flight behavior. Hot keys and cache-fill work receive per-key and global concurrency budgets, expiry jitter, and overload shedding.
- Stale-while-revalidate is allowed only for an explicit public projection and approved stale window. Privacy, moderation, cancellation, and safety invalidation can require immediate expiry.
- Cache failure falls back to bounded authoritative reads rather than bypassing authorization or stampeding PostgreSQL. A circuit breaker may prefer an approved stale public projection or safe `503` over uncontrolled origin work.

Search and list endpoints use cursor pagination, maximum page sizes, bounded filters, stable ordering, and reviewed indexes. Offset-based unbounded browsing and export-style endpoints are not default product APIs.

## 5. PostgreSQL and connection discipline

PostgreSQL remains authoritative for transactional marketplace state.

Required production behavior:

- pooled runtime connection string for serverless or horizontally scaled web and worker clients;
- separate direct migration connection and identity;
- explicit maximum connection budget per deployment and workload;
- statement, transaction, idle-transaction, and lock timeouts;
- short transactions with no provider network call inside the transaction;
- unique constraints for natural idempotency and ownership;
- optimistic version checks or explicit locking for capacity, acceptance, payment, release, refund, and moderation conflicts;
- cursor pagination, selective projections, and indexes justified by actual query plans;
- slow-query, lock-wait, connection, storage, and replication monitoring;
- expand-and-contract migrations with additive schema first, compatible application support, bounded backfill, observed cutover, and destructive cleanup only after rollback expiry;
- simultaneous compatibility for the old and new web and worker versions during rolling deployment, including mixed-version reads, writes, messages, and outbox payloads;
- migration rehearsal, interrupted-backfill recovery, rollback or forward-fix, and version-skew verification.

Migrations run separately from application startup. A release cannot require every web and worker instance to switch versions atomically. Contracting a column, constraint, payload, event, or behavior is a later independently reviewed release after telemetry confirms that no supported old code or queued work depends on it. The pattern follows Prisma's [expand-and-contract migration guidance](https://www.prisma.io/docs/guides/database/data-migration).

[Neon connection pooling](https://neon.com/docs/connect/connection-pooling) can accept many client connections through PgBouncer, but that does not mean the database can execute the same number of operations concurrently. Capacity decisions use database compute, active backend connections, query latency, working set, and contention evidence, not the advertised client ceiling alone.

Scale-to-zero is not assumed appropriate for latency-sensitive production flows. Minimum compute and autoscaling bounds require load evidence and cost approval.

## 6. Transaction and concurrency boundaries

Each consistency-critical command uses one enforceable transaction across the repositories and append-only records it owns. Examples include:

- accepting a request and reserving trip capacity;
- creating an order commercial snapshot;
- recording a provider event and applying its valid state transition;
- posting balanced ledger entries;
- releasing or refunding funds;
- applying a moderation hold;
- writing audit and outbox records.

Provider calls occur before or after a database transaction through explicit pending and reconciliation states. A callback or browser redirect never directly rewrites authoritative state.

Every externally retryable command has an authorization-bound scope, operation namespace, stable idempotency key, canonical payload fingerprint, stored result, expiry policy, and conflict behavior. Authorization runs before idempotency lookup; a stored result is never a substitute for ownership checks. Exact duplicates replay the stored result without repeating the side effect. Reusing a scoped operation key with a different fingerprint is rejected.

A concurrent exact duplicate fails closed while the first execution is active. A thrown or otherwise unclassified outcome moves to an explicit recovery-required state instead of releasing the key for a blind retry. Expected provider timeouts or ambiguous responses are modeled as stored `UNKNOWN` results and reconciled. Completed-result retention may expire under an approved policy; an unresolved recovery-required record does not silently expire into permission to repeat a financial, dispatch, or evidence action.

The issue #3 in-memory idempotency store exists only to source-test these semantics. It is process-local, unbounded, non-persistent, and not production infrastructure. Production requires a shared durable implementation with atomic claim, completion, and recovery transitions; authorization and rate limiting before lookup; bounded key, scope, and fingerprint inputs; encrypted and access-controlled stored results where sensitive; retention and cleanup jobs; metrics and alerts; and an audited operator recovery command.

Issue #13 implements a narrower durable form for the database-only `order.submit.v1` command. Authorization and shared abuse admission run before lookup. The application hashes the bounded client key and canonical normalized payload separately. A transaction-scoped PostgreSQL advisory lock fails an active duplicate closed; a completed same-account/same-payload retry replays the stored request; a changed payload conflicts. Capacity, request, audit, outbox, and completed idempotency result commit together, so this command has no ambiguous external provider outcome and needs no persisted recovery-required state. A 64-bit advisory-lock collision can only cause a false in-progress denial, not duplicate admission. Seven-day completed-result retention is source-tested, but cleanup scheduling, metrics, operational recovery, load, managed database behavior, and idempotency for payment, logistics, evidence, callbacks, and workers remain unimplemented.

## 7. Durable asynchronous work

When notifications, evidence scanning, provider retries, reconciliation, or other work can outlive one request:

1. commit the authoritative state and outbox record in one transaction;
2. let a durable worker claim the record with bounded concurrency;
3. call the provider with an idempotency key and timeout;
4. record the outcome through an authoritative use case;
5. retry transient failures with exponential backoff and jitter;
6. stop at a defined ceiling and route poison work to a dead-letter state;
7. alert and provide a safe replay or operator-recovery command.

Queue depth, oldest-message age, processing latency, retry count, and dead-letter count are monitored. A worker must tolerate redelivery and restart.

## 8. Provider isolation and graceful degradation

Each provider adapter defines:

- connect, response, and total timeouts;
- bounded retry policy;
- circuit breaker;
- concurrency limit or bulkhead;
- idempotency and reconciliation behavior;
- provider quota and spend budget;
- observable error classification;
- operator disable or kill switch.

Provider failure must not exhaust web threads, database connections, queue workers, or spending limits.

Graceful degradation examples:

- public discovery remains available when payment or logistics is unavailable;
- new checkout is paused while existing order and support status remains readable;
- evidence intake pauses safely when quarantine or scanning is unavailable;
- callbacks remain durably inboxed when interpretation or downstream work is temporarily unavailable;
- publication or discussion can be rate-reduced independently from order support.

The product must never report a successful payment, dispatch, scan, or notification merely because a request was queued.

Minimum shared-dependency behavior:

| Dependency | Public-read degradation | Protected-write behavior |
|---|---|---|
| Public cache | Bounded authoritative read or approved stale public projection | Never used as authorization or transaction authority |
| Session or authorization store | Public reads remain available | Fail closed; do not create or mutate protected state |
| Shared rate-limit or risk service | Serve only explicitly approved low-cost public reads within edge budgets | Fail closed for publication, identity, recovery, transaction, evidence, moderation, support, and admin actions |
| Identity provider | Public reads remain available | Reject new authentication, recovery, assurance, and protected actions whose identity guarantee cannot be refreshed |
| PostgreSQL | Approved stale public projection may remain readable | Fail closed; never acknowledge a durable mutation |
| Evidence storage or scanner | Existing authorized metadata may remain readable | Pause upload/promotion and retain a recoverable pending or rejected state |
| Payment or logistics provider | Existing authoritative platform status remains readable | Pause initiation or retain explicit pending/reconciliation state; never infer success |
| Audit or idempotency authority | Public reads remain available | Fail closed for actions requiring durable audit or replay safety |

Each dependency receives an owner, timeout, circuit breaker, alert, retry ceiling, recovery command, and tested state transition. Degradation cannot silently weaken authorization, assurance, audit, idempotency, evidence, or financial integrity.

## 9. Resource and cost budgets

Every route or command declares appropriate budgets:

- maximum request and response body;
- maximum fields, list entries, page size, and upload count;
- upload byte, dimension, and processing limits;
- database statement and transaction time;
- provider call count and timeout;
- cache-key cardinality considerations;
- queue payload and retry ceiling;
- per-user, per-account, per-network, and global request limits;
- daily and incident provider-spend ceilings.

Budget violations fail with stable safe errors and an internal reason code. They do not trigger an unbounded retry.

## 10. Observability

At minimum, production dashboards and alerts cover:

- requests per second and concurrent work;
- latency percentiles by public, protected, provider, and administrator flow;
- error and rejection rates;
- instance concurrency, memory, and execution duration;
- database active connections, pool wait, statement latency, lock wait, slow queries, storage, and compute saturation;
- cache hit, miss, stale, and invalidation behavior;
- queue depth, age, retry, and dead-letter state;
- provider latency, failure, quota, callback lag, and reconciliation mismatch;
- upload rate, bytes, scan time, and rejection;
- WAF, rate-limit, challenge, and bot decisions;
- infrastructure and provider spend against approved budgets.

Metrics use bounded-cardinality labels. Logs and traces follow the security document's private-data rules. Every critical alert has an owner and response action.

## 11. Capacity contract

Before closed pilot, record and approve:

| Dimension | Required decision |
|---|---|
| Users | registered, daily active, peak concurrent |
| Traffic | steady and peak requests per second by major flow |
| Latency | p50, p95, and p99 objective by flow |
| Reliability | availability and acceptable error rate |
| Data | trips, orders, discussion, evidence objects, ledger and audit growth |
| Burst | launch, viral-trip, callback, upload, and moderation peak factors |
| Providers | connection, request, storage, callback, and spending quotas |
| Recovery | RPO and RTO |
| Cost | monthly steady-state and incident ceilings |

Capacity numbers are not invented during architecture work. They come from the bounded pilot plan and provider quotas.

## 12. Test profiles

Use isolated non-production resources and synthetic identities. Do not point a load tool at production without separate explicit authorization.

Required profiles:

- **ramp**: increase public browse and search until the approved peak;
- **mixed protected**: authentication, publication, discussion, order, and support reads and writes;
- **callback burst**: duplicate, delayed, reordered, invalid, and valid provider events;
- **upload**: bounded concurrent quarantine uploads and scan backlog;
- **spike**: a viral trip or acquisition burst above normal peak;
- **soak**: sustained expected peak long enough to expose leaks, queue drift, pool starvation, and cost;
- **abuse**: enumeration, brute-force, scraping, large inputs, expensive filters, and repeated failures;
- **cache safety**: poisoned-key and cache-deception attempts, protected-response non-caching, concurrent misses, hot keys, invalidation bursts, stale-window expiry, and cache outage without database stampede;
- **provider failure**: latency, timeout, partial failure, quota rejection, and recovery;
- **deployment compatibility**: old and new web and worker versions operating together across additive schema, message, outbox, and API changes;
- **recovery**: restart, interrupted migration or backfill, deployment rollback or forward-fix, queue replay, backup restore, and cache rebuild.

Record dataset, infrastructure size, concurrency, request mix, duration, latency percentiles, errors, saturation, cost, and recovery time. A passed test applies only to that exact profile and environment.

## 13. Evidence-driven scaling sequence

Prefer this order:

1. bound payloads and queries;
2. fix correctness and indexes;
3. remove avoidable round trips and N+1 access;
4. cache safe public projections;
5. tune database pooling and compute working set;
6. scale stateless web instances horizontally;
7. add or scale the durable worker for asynchronous pressure;
8. add a read replica or dedicated search system only when measured query or search workload justifies it;
9. partition data or extract a service only after a measured boundary and an approved ADR.

Service extraction requires a workload or isolation need, ownership model, data authority, failure analysis, migration plan, observability, and rollback. File count is not a scaling signal.

## 14. Availability and recovery

- Apply the explicit dependency matrix above; protected state never uses generic fail-open behavior.
- Keep development, test, preview, and production isolated.
- Back up authoritative data and verify restore into an isolated target.
- Reconcile object storage and database evidence references.
- Require expand-and-contract compatibility across the rolling-deployment window and retained queue messages.
- Test session revocation, provider disablement, mixed-version deployment, migration interruption, rollback or forward-fix, queue replay, cache rebuild, cache stampede resistance, and hot-key containment.
- Preserve ledger, audit, inbox, and evidence integrity during recovery.
- Approve RPO and RTO before real money.

A successful database backup job is not restore evidence. A platform uptime percentage is not end-to-end marketplace availability.

## 15. Current status

Designed:

- modular monolith and stateless production direction;
- public/private cache boundary;
- canonical cache keys, protected-response exclusion, poisoning/deception defenses, miss coalescing, hot-key budgets, and bounded stale behavior;
- pooled PostgreSQL direction;
- expand-and-contract migration and mixed-version deployment requirements;
- transactions, inbox, outbox, idempotency, and provider isolation requirements;
- explicit shared-dependency degradation and protected fail-closed policy;
- direct private evidence storage direction;
- observability, capacity, load, and recovery gates.

Implemented and source-tested for the architecture probe, merged issues #5/#9/#11, and the issue #13 local candidate:

- deterministic in-memory public discovery;
- bounded simulated dataset;
- additive PostgreSQL schema and isolated Prisma adapter;
- bounded connection pool, connection wait, statement/query, serializable-transaction, JSON-body, field, result-page, and cursor controls;
- indexed published-trip search ordered by departure date and ID;
- database-backed OAuth attempts, sessions, authoritative trip state, audit, and outbox;
- one transaction budget, a three-attempt serialization/unique-conflict retry ceiling, and one connection-bound context for authoritative state, success audit, and required outbox writes;
- disposable PostgreSQL 18 tests for migration constraints, rollback, repeated and concurrent identity resolution, optimistic concurrency, ownership foreign keys, cursor pages, session revocation, and OAuth browser-binding/replay;
- provider-neutral evidence upload intent, inspection, scan-gated promotion, retention, and deletion contracts through bounded process-local fixtures;
- stateless per-request canonical-origin and CSP-nonce derivation; no session, limiter, lock, cache, or durable authority is added to web-process memory;
- dynamic rendering for nonce integrity and explicit private or denied-response `no-store` policy, with a later public-cache design still required before reintroducing cacheable public HTML;
- a two-mode built-runtime probe that starts and stops isolated local processes with deterministic non-secret configuration;
- an additive shared PostgreSQL fixed-window limiter with HMAC-only subjects, action-scoped multi-axis policies, deterministic concurrency, bounded expiry cleanup, and atomic first-denial audit evidence;
- an additive submitted-request schema and serializable capacity/idempotency boundary with locked-row live database time, exact fixed-precision reservation, seller/profile eligibility locks, composite ownership constraints, conditional offer-revision update, final-slot and delayed-deadline proof, atomic audit/outbox, and fail-closed active duplicate handling;
- disposable PostgreSQL cross-instance concurrency, redaction, audit-failure rollback, rollover, and cleanup tests;
- no production provider calls or asynchronous work.

Not implemented or verified:

- production cache or cache-safety controls, generalized shared idempotency beyond order submission, live edge/client-network/direct-origin configuration, managed PostgreSQL, object storage, scanner, durable cleanup worker, provider, operational observability, alert routing, backup, or restore;
- expand-and-contract migration, mixed-version rollout, or dependency-outage runtime evidence;
- capacity targets, load tests, provider quotas, SLOs, RPO, RTO, or production cost budgets;
- runtime horizontal-scaling or failure-recovery evidence.
