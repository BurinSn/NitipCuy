# ADR 0004: Security, Resilience, and Scale Baseline

Status: Accepted

Date: 2026-07-27

Issue: [#3 Establish web architecture and application foundation](https://github.com/BurinSn/NitipCuy/issues/3)

## Context

NitipCuy will expose public discovery while later handling accounts, private addresses, communication, identity evidence, orders, payments, fulfilment evidence, logistics callbacks, disputes, and administrative actions. That combination attracts ordinary web attacks, automated abuse, fraud, resource exhaustion, and provider-cost attacks.

The architecture must also support growth beyond one web process without introducing premature microservices or silently relying on process-local state. A successful build or dependency audit does not establish runtime security, DDoS resistance, session safety, or production capacity.

No internet-facing application can honestly promise that it is immune to DDoS, injection, session compromise, credential attacks, or every future vulnerability. NitipCuy instead requires defense in depth, bounded resource use, measurable verification, provider controls, monitoring, and recovery.

## Decision

### 1. Adopt a named security verification baseline

NitipCuy targets OWASP ASVS 5.0 Level 2 for the complete production web application. Payment, settlement, moderation, support, administrator, identity-evidence, and other high-impact operations receive additional risk-based controls and independent review even where those controls exceed the general Level 2 target.

The target is a requirements and verification baseline. It is not a claim that the current architecture shell is ASVS-verified.

### 2. Use layered security controls

Security is enforced at multiple independent layers:

```text
provider network and DDoS controls
  -> web application firewall, bot controls, and shared rate limits
  -> request size, time, pagination, and cost budgets
  -> authentication, session, and server-side authorization
  -> delivery validation and domain invariants
  -> parameterized persistence and least-privilege database roles
  -> transaction, idempotency, inbox, outbox, and audit controls
  -> monitoring, incident response, backup, and recovery
```

No layer is accepted as a substitute for the others. A hosting provider's DDoS mitigation does not replace application limits. An ORM does not replace least privilege or query review. `SameSite` cookies do not replace complete CSRF controls. A content security policy does not replace output safety.

The edge-to-origin boundary is explicit. Only the approved edge may reach the application origin. The application trusts forwarding information only from the approved proxy chain, which must strip and overwrite client-supplied forwarding headers. Client IP, scheme, host, origin, redirect, callback, and absolute-URL decisions use one canonical server-owned interpretation. An unrecognized host, proxy path, or contradictory forwarding value is rejected rather than guessed.

Shared security dependencies also have route-class failure policies. Public reads may degrade to bounded authoritative reads or an approved stale public projection. Authentication, recovery, OTP, checkout, refund, payout, bank-detail change, protected evidence, moderation, support, and administrator actions fail closed when required session, authorization, rate-limit, risk, audit, or idempotency state is unavailable. A dependency timeout or unavailable control never silently becomes “allow.”

### 3. Keep the first production shape horizontally scalable

NitipCuy remains a modular monolith with:

- stateless web instances;
- shared authoritative PostgreSQL;
- pooled runtime database connections and a separate migration connection;
- shared session, idempotency, and rate-limit state where those concerns are not stored transactionally in PostgreSQL;
- private object storage with direct signed uploads through a quarantine lifecycle;
- a durable outbox and retrying worker before asynchronous work is introduced;
- explicit caching only for public projections with documented freshness and invalidation.

In-memory adapters and process-local controls are test and architecture-probe tools only. They are not production scale or security mechanisms.

Public caches use canonical, bounded keys and never cache private, personalized, authentication, authorization, error, or redirect responses. Implementations must resist cache poisoning and deception, coalesce concurrent misses, bound hot-key work, add expiry jitter, and use stale-while-revalidate only inside an approved public-data stale window. Cache failure must not bypass authorization or create an unbounded database stampede.

Database and deployment changes use an expand-and-contract sequence. Additive schema and application support lands before data backfill or traffic migration; old and new web and worker versions remain compatible during the deployment window; destructive cleanup occurs only after observed cutover and rollback expiry. Migrations run separately from application startup and must have rehearsal, monitoring, rollback or forward-fix, and version-skew evidence. This follows Prisma's [expand-and-contract migration guidance](https://www.prisma.io/docs/guides/database/data-migration).

### 4. Bound every expensive or abusable operation

Every public or protected endpoint receives explicit limits appropriate to the action:

- request body, upload, field, array, and pagination limits;
- execution, database statement, provider, and outbound-request timeouts;
- per-network, per-account, per-session or device, and per-action rate limits;
- separate budgets for login, OTP, recovery, registration, search, publication, discussion, checkout, payment, upload, reports, and administrative actions;
- provider-spend alerts, circuit breakers, and operator kill switches;
- cursor pagination and indexed bounded queries;
- queue retry ceilings, dead-letter handling, and replay controls.

Limits must use shared state or provider-enforced controls when multiple application instances are possible. In-process counters are not authoritative.

### 5. Make identity external but sessions and authorization platform-controlled

NitipCuy does not store passwords. A reviewed authentication provider or library supplies standards-based identity. NitipCuy maps the immutable provider subject to an internal account and remains responsible for:

- secure cookie-based sessions;
- rotation after authentication or privilege change;
- idle and absolute expiry;
- revocation and session-version invalidation;
- step-up authentication for high-impact actions;
- server-side object and function authorization;
- restrictions, risk holds, and capability checks;
- generic external authentication and recovery errors;
- independent protections against brute force, credential stuffing, password spraying, and OTP abuse.

Authentication success never grants implicit authorization to another account's object.

The provider-selection gate is mandatory, not opportunistic: administrator, support, moderation, payment, payout, refund, bank-detail change, and account-recovery flows require phishing-resistant MFA such as passkeys where feasible, or a separately approved high-assurance factor and recent step-up. Recovery and factor replacement cannot be weaker than the assurance they replace, cannot silently downgrade a protected account, and require notification, revocation, audit, and risk controls. A provider that cannot satisfy the approved assurance and recovery contract is ineligible for those flows. See the [OWASP MFA guidance](https://cheatsheetseries.owasp.org/cheatsheets/Multifactor_Authentication_Cheat_Sheet.html).

### 6. Keep SQL and external input behind strict boundaries

Prisma is the default database adapter. Ordinary application persistence uses generated ORM operations. Unsafe raw query APIs are forbidden in application source. A raw query is exceptional and requires:

- a tagged, parameterized query;
- allowlisted dynamic identifiers;
- focused review and tests;
- a documented reason the ORM cannot express the operation.

Runtime and migration database identities use different credentials and least-privilege grants. Delivery schemas, domain invariants, database constraints, query timeouts, and bounded result sets remain separate controls.

### 7. Treat files, callbacks, and outbound requests as hostile

Uploads enter private quarantine through short-lived, narrowly scoped signed requests. The platform verifies actual type, size, count, hash, scan result, and ownership before promotion. Downloads remain authorization-mediated.

Provider callbacks use signature, timestamp, replay, deduplication, inbox, idempotency, and reconciliation controls. Outbound server requests use destination allowlists, safe DNS and IP resolution, redirect and response-size limits, and blocks for private, loopback, link-local, and metadata destinations.

### 8. Protect sensitive data through an explicit cryptographic lifecycle

NitipCuy minimizes collection and retention before applying encryption. Database, object-storage, queue, and backup providers must encrypt data at rest and in transit. Threat modelling determines which high-impact identity, bank, contact, address, verification, payment-reference, and evidence fields also require application-level envelope encryption.

Encryption is an outer-adapter responsibility behind provider-independent ports. Approved platform cryptography and a managed KMS, HSM, or key vault supply authenticated encryption and key wrapping; domain records carry only key identifiers and versions, never raw keys. Data-encryption keys, key-encryption keys, application secrets, encrypted data, and backups remain separated by purpose and least privilege.

The operational contract covers generation, distribution, use, rotation, re-wrapping, revocation, compromise recovery, backup, restore, retention expiry, and verified deletion or cryptographic erasure. Key loss and key compromise are separate rehearsed incidents. Long-lived encrypted records and backups must remain recoverable during approved retention while expired data and unnecessary old key material are retired. NitipCuy does not design custom cryptographic algorithms or store plaintext keys beside protected data. These requirements follow the [OWASP Cryptographic Storage](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html) and [Key Management](https://cheatsheetseries.owasp.org/cheatsheets/Key_Management_Cheat_Sheet.html) guidance.

### 9. Require measurable capacity and recovery evidence

Before closed pilot, BurinSN must approve:

- expected concurrent users and requests per second;
- peak factor and primary traffic shapes;
- latency, availability, and error objectives;
- data, evidence, and queue-volume assumptions;
- database and provider quotas;
- infrastructure and provider-spend budgets;
- recovery point and recovery time objectives.

An isolated environment must then pass ramp, spike, soak, recovery, abuse, and provider-failure tests against those targets. “Many users” is not a testable capacity requirement.

Tests also cover cache hot keys, concurrent misses, poisoned-key attempts, protected-response non-caching, rolling old/new application versions, worker-version skew, expand-and-contract migrations, interrupted backfills, rollback or forward-fix, and dependency-outage fail-open or fail-closed behavior.

### 10. Separate design, implementation, and verification claims

Security and scale statements use these evidence levels:

1. **Designed**: accepted requirement exists.
2. **Implemented**: source and configuration exist.
3. **Source-tested**: automated local or CI tests cover the implementation.
4. **Runtime-tested**: the deployed non-production behavior was exercised.
5. **Load-tested**: approved load and abuse profiles passed.
6. **Provider-verified**: the live provider configuration and limits were inspected.
7. **Incident-tested**: detection, containment, recovery, and evidence preservation were rehearsed.

Only the highest completed level may be claimed for a control.

### 11. Use versioned shared abuse authority for persisted routes

The first application limiter uses PostgreSQL rather than web-process memory. The canonical request perimeter derives one HMAC-only network subject; route policy combines that action scope with account, session/device, and target axes where relevant. Policy storage keys carry an explicit revision. PostgreSQL supplies the production decision timestamp so instance clock skew cannot split a window. Fixed-window counters and the first-denial audit claim commit in one transaction, expired-row cleanup is bounded, and missing counter or required audit authority fails closed with a generic response.

The v1 ceilings are pre-preview safety defaults, not traffic or capacity approval. Fixed-window boundary behavior, HMAC rotation, mixed-version policy revision, provider client-address compatibility, WAF/bot coordination, metrics, alerts, load, and incident response require later evidence. A policy-number change without a revision and rollout analysis is not permitted.

## Consequences

- The current shell becomes governed by an explicit security and scale contract without being mislabeled production-safe.
- Some protected features cannot launch immediately after functional implementation; they also require negative, abuse, runtime, and operational evidence.
- Shared rate-limit state, durable asynchronous work, private quarantine storage, and monitoring add cost only when the corresponding functionality is introduced.
- Managed key custody, field-encryption decisions, privileged assurance, trusted-proxy configuration, cache safety, and deployment-version compatibility become explicit activation work rather than implicit provider assumptions.
- Existing persisted routes now have a production-shape shared limiter contract and disposable-database evidence, but provider, load, operations, and production verification remain separate gates.
- Public read-heavy traffic can scale independently through cache and horizontal web instances while protected writes remain transactionally authoritative.
- Service extraction remains evidence-driven. Security and scale requirements do not justify microservices by themselves.

## Rejected alternatives

### Promise that the platform is attack-proof

Rejected because no architecture or provider can guarantee immunity from DDoS, account compromise, new vulnerabilities, or operational failure.

### Rely only on Vercel or another edge provider

Rejected because edge mitigation cannot understand every account, order, payment, upload, or marketplace abuse invariant and may not prevent cost exhaustion.

### Rely only on Prisma for SQL injection prevention

Rejected because unsafe raw APIs, dynamic identifiers, excessive database privileges, unbounded queries, and application authorization remain independent risks.

### Store sessions or rate limits only in web-process memory

Rejected because horizontal instances do not share process memory and restarts erase it.

### Introduce microservices before measurements

Rejected because distributed services add authentication surfaces, network failure, consistency problems, queues, secrets, and operational load without current evidence of benefit.

## Governing detail

- [Security architecture](../security/security-architecture.md)
- [Scalability and resilience](../architecture/scalability-and-resilience.md)
- [System architecture](../architecture/system-architecture.md)
- [Development and quality gates](../development/quality-gates.md)
