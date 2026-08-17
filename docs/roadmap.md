# NitipCuy Canonical Roadmap

Last reviewed: 2026-08-17 11:57 WIB

Current stage: Stage 1 - Platform foundation

Current work item: Issue #13 and pull request #14 are closed and squash-merged as `df0426cafedbb61d9582527c1669f3bb077125bb` after fresh BurinSN approval and passing exact-head hosted application, lifecycle, and governance gates. Issue #15 is open from that verified base on `feat/15-ux-visual-foundation`. Its local candidate establishes the first owner-reviewable visual system, responsive discovery and trip detail, non-persisting request preview, fictional customer timeline, and fictional jastipper work queue. Complete exact-toolchain quality with 248 tests, production audit, lifecycle participation, production build, request-perimeter runtime, and local HTTP route smoke checks pass. The in-app browser has no connected window, so desktop/mobile rendering, interaction, screenshot, and visible accessibility evidence remain pending alongside immutable review, hosted checks, and owner visual approval. Stage, provider order, payment/delivery deferrals, and production-approval boundaries are unchanged.

## 1. Role, authority, and freshness contract

This is the single authority for:

- product delivery sequence;
- current stage and stage status;
- completed, current, next, and later work;
- entry and exit gates;
- launch blockers versus build blockers;
- roadmap-level dependencies and deliberate deferrals.

This file is not an operational handoff and not a change log. Branches, pull requests, exact current commits, and session verification belong in `handoff.md`. Historical material changes belong in `docs/changes.md`. Reusable discoveries and corrected assumptions belong in `docs/learning.md`.

Update this file during every material session, even when scope and order do not change. At minimum, refresh the review timestamp, current work item, affected checklist state, gate evidence, and exact next work. If the roadmap remains unchanged, say so in the corresponding `docs/changes.md` entry.

The roadmap is stale when checked work lacks evidence, the current work item disagrees with GitHub or the handoff, blockers are assigned to the wrong stage, or completed and upcoming work are mixed.

## 2. Product north star

NitipCuy makes jastip activity searchable, explicit, evidence-backed, and safer without turning BurinSN into the merchant for every item.

The product must let:

- a jastipper publish where and when they are available and travelling, when orders open and close, what they can buy or carry, remaining capacity, their own rates, deadlines, relevant location, and delivery terms;
- a customer find a suitable route, see the ordering window, inspect products or submit a request, understand the full cost and delivery method, transact through the platform, follow an order timeline and evidence, dispute when necessary, and review a completed transaction;
- reusable questions remain public on the relevant trip, listing, or request, while private details remain private;
- both parties use either Shop for me or Carry my item through one authoritative order, evidence, payment, moderation, and reputation system.

The master product specification and accepted ADRs control detailed product behavior.

## 3. Non-negotiable boundaries

1. NitipCuy is a standalone BurinSN product, separate from BCN.
2. The suffix is `Cuy`, not `Coy`.
3. The two primary services are Shop for me and Carry my item.
4. Jastippers set their own rates and commercial terms.
5. NitipCuy earns a disclosed transaction protection fee, not subscriptions.
6. The provisional fee is 3 percent, minimum Rp15,000 and maximum Rp100,000, pending provider and pilot economics.
7. Public discussion complements, but does not replace, private order communication.
8. Address, delivery method, cost basis, deadlines, and evidence terms are visible before paid commitment.
9. Protected reviews require completed platform transactions.
10. Trust and safety covers identity, scanning, evidence, enforcement, appeals, disputes, and reconciliation.
11. Severe prohibited conduct can receive immediate takedown and suspension.
12. NitipCuy is not designed as the cross-border merchant, importer, customs broker, carrier, or legal seller of jastipper goods.
13. Core domain behavior remains independent of DOKU, Biteship, or another provider.
14. No external-provider unknown blocks building with mock provider ports.
15. Threads is a later acquisition and feedback channel, not a prerequisite for platform development.
16. Security is defense in depth and evidence-based: no framework, ORM, cloud provider, checklist, or passed build makes the platform attack-proof.
17. The production web shape is stateless and horizontally scalable; process-local session, idempotency, rate-limit, lock, cache, or job state is forbidden.
18. The complete production web application targets OWASP ASVS 5.0 Level 2, with additional risk-based review for high-impact flows.
19. Capacity, availability, latency, recovery, provider-quota, and cost claims require approved numerical targets and tests.
20. A closed or ineligible trip offer rejects new orders server-side while remaining read-only public seller history.
21. Fixed-price Shop for me requires an actual-product photograph before `PURCHASED`, not routine buyer-visible receipt, acquisition-cost, or margin disclosure.
22. Carry my item requires collection photographs and measured weight before `COLLECTED`; material variance requires customer approval.
23. Public trip history and private seller/customer order dashboards are projections, never mutation or authorization authority.

## 4. Drift alarms

Stop and require a new impact analysis and BurinSN decision if work attempts to:

- merge NitipCuy into BCN;
- replace `Cuy` with `Coy`;
- remove either primary service mode;
- make NitipCuy set a universal jastip or kilogram rate;
- force fixed-price jastippers to reveal routine receipts, acquisition cost, or margin to buyers;
- mark Shop for me as purchased without an accepted actual-product photograph;
- mark Carry my item as collected without accepted collection photographs, measured weight, and required variance approval;
- accept a new request outside the authoritative ordering window or from a stale public projection;
- delete closed trips that should remain safe public history, or expose their private customers, orders, addresses, or evidence;
- introduce subscriptions, paid boosts, or advertising as an assumed revenue requirement;
- make private addresses or identity records public;
- allow unprotected off-platform transactions to receive protected status or verified reviews;
- replace public reusable discussion with private chat only;
- weaken evidence, moderation, reconciliation, dispute, or appeal requirements;
- hard-code DOKU or Biteship behavior into the core domain;
- move real money before provider, legal, policy, security, and operational gates pass;
- delay platform development merely to collect more Threads examples;
- claim T&C removes all platform duties after known illegal or harmful activity.
- claim that NitipCuy is DDoS-proof, injection-proof, session-hijack-proof, brute-force-proof, generally “secure,” or “scalable” without naming the exact evidence level;
- rely on Vercel, Prisma, an identity provider, `SameSite`, CSP, or another single control as the complete security boundary;
- treat privileged MFA, trusted-proxy handling, security-dependency outage behavior, encryption and key custody, cache safety, or deployment compatibility as optional provider details;
- fail open for protected actions when session, authorization, rate-limit, risk, audit, or idempotency guarantees are unavailable;
- cache private, personalized, authorization-dependent, error, or redirect responses on a public path;
- perform destructive database contraction before old and new web, worker, migration, and queued payload versions are proven compatible;
- store production sessions, idempotency, rate limits, locks, cache authority, or durable jobs only in one web process;
- add unbounded search, pagination, uploads, provider calls, retries, database queries, or asynchronous work;
- activate protected or real-money flows before their security, abuse, provider, monitoring, recovery, and incident gates pass;
- split into microservices without a measured scaling, availability, security-isolation, ownership, or deployment trigger and a new ADR.

## 5. Delivery strategy

```text
product foundation
  -> platform foundation
  -> core marketplace MVP using mock providers
  -> real provider integration and closed pilot
  -> public beta and Threads acquisition
```

Build platform behavior and provider-independent contracts before production integrations. Validate with real users when there is enough product to demonstrate and measure.

## 6. Stage 0 - Product and repository foundation

Status: Complete

- [x] Product boundary and commercial ADR.
- [x] Master product specification.
- [x] Initial order lifecycle.
- [x] Trust-and-safety moderation model.
- [x] DOKU public-documentation hostile review.
- [x] DOKU conditional-preference ADR.
- [x] Standalone local folder.
- [x] Private `BurinSn/NitipCuy` repository with `main`.
- [x] Initial Git and pull-request governance.

Exit evidence:

- initial baseline `70b4c96a0df486b70e626434338e0b20dec7df1f`;
- repository-state record `6fe622733bdf457448ed0e8670ff5249ce3ca6fe`;
- lifecycle-governance merge `fd9c98aefff199bb0e8ff954fa3a56e6764cf03a`.

## 7. Stage 1 - Platform foundation

Status: In progress

### Completed governance slice

- [x] Issue #1 and pull request #2 established the four-file lifecycle contract.
- [x] Local and hosted lifecycle freshness checks were demonstrated.
- [x] GitHub-context handling and workflow dependencies were hardened.
- [x] Pull request #2 was owner-approved, squash-merged, and issue #1 closed.
- [x] Branch-protection limitations remain explicitly enforced by project policy.

### Current architecture slice

- [x] Issue #3 created with bounded acceptance and exclusions.
- [x] Web-first stack, runtime, workspace shape, and deployment posture selected in ADR 0003.
- [x] Identity, deny-by-default authorization, PostgreSQL, and migration direction recorded.
- [x] ADR 0004 records the OWASP ASVS 5.0 Level 2 target, evidence-level claims, layered attack controls, stateless horizontal production shape, and capacity/recovery gates.
- [x] Security architecture covers DDoS and cost abuse, injection, sessions, credential and OTP attacks, authorization, browser threats, uploads, SSRF, callbacks, secrets, monitoring, incident response, and verification.
- [x] Scalability and resilience architecture covers caching, database and connection budgets, transaction and concurrency rules, durable workers, provider isolation, observability, load profiles, and evidence-driven extraction.
- [x] Security and scale amendment committed and pushed at `7522bf8d2076101cdc78245f390818eb6125252f`; application-quality run `30256384832` and lifecycle run `30256384917` passed without annotations.
- [x] Provider-independent payment, logistics, identity-verification, evidence-lifecycle, clock, identifier, audit, and outbox interfaces and deterministic mocks exist.
- [x] Framework-free domain, application, adapter, and delivery package layout established.
- [x] Mechanically enforce dependency direction through package-manifest validation, parsed source edges, and adversarial fixtures covering cross-package relative and other bypass forms.
- [x] Local development, formatting, lint, strict type, unit test, build, audit, and PR-CI gates established.
- [x] Working local shell implements public trip search, detail, and chronological public Q&A using simulated data.
- [x] Published-trip runtime invariants reject unsupported modes, impossible calendar and clock values, invalid offsets and IANA timezones, inverted source-service and ordering windows, ordering after source availability, service after departure, and duplicate question IDs; advance PO is supported and cross-offset Q&A sorts by instant.
- [x] The simulated public shell presents source-service and ordering windows in the origin timezone and arrival in the destination timezone.
- [x] Trip-window implementation checkpoint `f4b635abba9fcdf548441254d3da5e29a645e492` passed application-quality run `30316681999` and lifecycle run `30316681979` with zero annotations.
- [x] Dependency-boundary implementation checkpoint `330b10a85adbd83c151eafdfc0a5ca6d0f36e9ae` passed application-quality run `30336136426` and lifecycle run `30336136464` with zero annotations.
- [x] Transaction-deferral implementation checkpoint `bf564436bf54815782501bc10280074f16a23fa9` passed application-quality run `30354861825` and lifecycle run `30354861680` with zero annotations.
- [x] Asynchronous-payment implementation checkpoint `fae92e55fc1117b1b78fc7add244e8ccb940c2e3` passed application-quality run `30446270570` and lifecycle run `30446270568` with zero annotations.
- [x] Exact-toolchain frozen install, peer, quality, production-audit, lifecycle, runtime, complete-diff, and security gates passed for the original architecture checkpoint.
- [x] Issue #3 branch is committed, pushed, and opened as pull request #4.
- [x] BurinSN gave fresh issue #3 merge approval on 2026-08-06 after the final exact-head evidence and findings were visible.

Pull request #4 was squash-merged and issue #3 closed at `f100b03e0352bad3f969efc7d42a91f46c64f864`. Issue #5 was then squash-merged through pull request #6 at `f38cdaf144ff3c22c39e7a28544363fdb0fd0a19`, combining identity, persistence, protected mutation, and public projection through the first persisted slice. The original simulated UI remains an architecture probe; the persisted HTTP routes are source/build verified and the core flow is disposable-database verified, but no real Google, browser, preview, production, or visual evidence exists.

Pull-request head, hosted checks, annotations, reviews, and mergeability are volatile. Retrieve them directly. A missing, pending, skipped, warned, or failed lifecycle or application-quality result blocks approval by project policy.

### Hostile-review remediation gate

- [x] Correct published-trip runtime date, timestamp, service-mode, question-identity, and cross-offset chronology invariants with adversarial tests.
- [x] Reconcile identity acceptance as documented architecture direction while deferring mapping implementation to the first persisted account slice.
- [x] Add automated dependency-boundary enforcement.
- [x] Remove the unenforceable callback-only transaction abstraction and defer a database-backed transaction-scoped unit of work, with explicit atomicity and disposable-PostgreSQL proof gates, to the first persisted write slice.
- [x] Correct payment initiation, held-state, release, refund, and reconciliation contracts through provider-neutral submissions, observations, signals, stable attempt correlation, exact collected-and-held amount assessment, configured mocks, and adversarial tests. Full local and hosted exact-head verification passed.
- [x] Enforce and contract-test idempotency through scoped keys, canonical payload fingerprints, exact replay, changed-payload conflict, concurrent denial, recovery-required ambiguous outcomes, expiry, authority-outage denial, and cross-scope isolation. Shared durable production state remains a later implementation gate.
- [x] Replace the vulnerable PostCSS `8.5.18` override with patched `8.5.23`; implementation head `a086dcf2b9060394756b2bf4ddc57994d7b158c8` passed application run `30983580593` and lifecycle run `30983580611` with zero annotations.
- [x] Replace caller-trusted evidence hashes and buffered raw-upload assumptions with a server-authoritative evidence lifecycle. Implementation head `f57ef166db9bf6d71e7b2b5b9505f8c71cf38b84` passed application run `30985369642` and lifecycle run `30985369587` with zero annotations after complete local gates.
- [x] Separate the future authoritative `TripOffer`, public `PublishedTrip`, public history, and private seller/customer order projections; projections never authorize mutation, checkout, or capacity reservation.
- [x] Establish the binding defense-in-depth security and evidence-based scale baseline without claiming the controls are implemented.
- [x] Close the follow-up design gaps for sensitive-data encryption and managed-key lifecycle, mandatory privileged assurance, trusted-proxy and canonical-host handling, explicit dependency-outage failure policy, cache poisoning/deception/stampede/hot-key protection, and expand-and-contract mixed-version deployment.
- [x] Reconcile all lifecycle, specialist, issue, and pull-request claims after the corrections; issue comment `5188962019` and pull-request comment `5188964841` record the final evidence and non-claims.
- [x] Run final exact-toolchain, runtime, security, complete-diff, and hosted exact-head review; implementation and lifecycle heads passed locally and through both hosted workflows with zero annotations.

### Next persisted vertical slice

- [x] Create governed issue #5 after pull request #4 and issue #3 were merged and closed.
- [x] Implement the first persisted vertical slice:

```text
account
  -> jastipper profile
  -> trip draft
  -> moderation gate
  -> trip publication
  -> source-service and ordering windows
  -> destination and date search
  -> trip detail
  -> public question and answer
```

- [x] Add the first additive PostgreSQL schema and SQL-reviewed migration through the isolated Prisma adapter, with disposable clean-apply evidence. Mixed-version and destructive contraction evidence is not applicable to this initial un-deployed schema and remains mandatory when evolution begins.
- [x] Add Google OIDC identity proof and protected server-authoritative mutations without passwords or email linking. Google creates base assurance only; moderation requires a separately persisted phishing-resistant session, and no real privileged step-up/recovery path exists yet.
- [x] Add integration tests using a container created and destroyed by the suite, with no configurable fallback to development or production databases.
- [x] Complete issue #13's server-authoritative new-order slice. Pull request #14 squash-merged as `df0426cafedbb61d9582527c1669f3bb077125bb` after exact-head local, disposable-PostgreSQL, build, request-perimeter-runtime, production-audit, lifecycle, DRY, hostile-review, hosted, and owner-approval gates. Seller response, expiry/cancellation, and capacity release remain required before real-user activation.
- [ ] Complete the remaining protected-preview controls. Implemented and source/integration-tested now: opaque digest-only sessions, rotation/revocation, exact transactional session/assurance/ownership checks, generic errors, exact-origin and Fetch-Metadata checks, parameterized Prisma queries, database ownership constraints, bounded inputs, and the issue #11 shared limiter candidate. Still required: provider-verified trusted proxy/direct-origin behavior, WAF/bot controls, managed key custody and rotation, complete logging-redaction/static/safe-query scans, operational metrics/alerts, browser automation, privileged step-up/recovery, and load/provider/incident evidence.
- [x] Complete issue #9's inbound browser/session perimeter. Pull request #10 squash-merged as `23a6015781228cb04e167b83f6a28b3d3cc0b62d` with source and local built-runtime evidence for canonical request interpretation, simulated edge proof, nonce CSP, defensive headers, private no-store, callback reconstruction, and hostile request denial.
- [x] Complete issue #11's shared abuse-control and denial-telemetry repository slice. Pull request #12 squash-merged as `ea4b629466df1e1e1381f62ae5ca26722edbe4bf`; issue closure, local/remote `main`, and branch cleanup were verified. Provider WAF/bot behavior, operational dashboards/alerts, threshold calibration, aggregate cleanup load, broader load, and incident evidence remain separate.
- [x] Establish bounded cursor pagination plus connection, query, statement, transaction, and request budgets for the persisted slice. Minimal production observability remains open with the prior item.
- [ ] Record preliminary pilot capacity, provider-quota, cost, RPO, and RTO questions without inventing targets before the pilot is bounded.

### Review-evidence governance slice

- [x] Create governed issue #7 for visible DRY and guarded-Strix progress in every future material issue and pull request.
- [x] Define one versioned status/evidence contract with exact-head DRY review and guarded-Strix applicability.
- [x] Add a required material-change issue form and expand the pull-request template.
- [x] Add a dependency-free validator, adversarial fixtures, and a read-only `Review governance` pull-request workflow that never invokes Strix.
- [x] Classify issue #7 Strix applicability as `NOT REQUIRED` because this policy/tooling slice introduces no runnable application target; hostile source review remains required.
- [x] Run exact-toolchain quality, audit, lifecycle, link, diff, candidate-diff DRY, and hostile security review gates; final exact-head review pinning remains part of pull-request reconciliation.
- [x] Commit and push implementation head `fcf9628241dd12a2e0a04dc88225a6a776243a19`, open pull request #8, and verify the new review-governance workflow once with zero annotations.
- [x] Commit/push the PR-state lifecycle checkpoint, re-review and pin the final exact head, then verify all three hosted workflows on that immutable head.
- [x] Obtain fresh BurinSN review after the exact review states, evidence, limitations, and checks are visible; pull request #8 was squash-merged as `d09747b1a8072eaafe23f7bc604b82bb7eae5bf3`, issue #7 closed, and branches were removed.

### Experience slice

- [x] Create governed issue #15 from the verified issue #13 / pull request #14 merge base.
- [x] Record the first customer and jastipper decision journeys in `docs/product/experience-design.md`.
- [x] Define the first information architecture and responsive behavior for discovery, trip detail, request composition, customer progress, and jastipper work assessment.
- [x] Implement the first local visual-direction candidate with a functional route-ribbon signature and explicit simulation boundaries.
- [ ] Complete issue #15 evidence. Workspace quality with 248 tests, production audit/build, lifecycle, request-perimeter runtime, and local HTTP route smoke checks pass; desktop/mobile browser, interaction, visible accessibility, immutable-head review, and hosted evidence remain pending.
- [ ] Obtain BurinSN visual sign-off before production use or merge approval.

Exit gate:

  - The repository is healthy and the first vertical slice works locally with documented architecture, automated negative tests, implemented applicable security boundaries, bounded resource use, and approved product behavior.

## 8. Stage 2 - Core marketplace MVP

Status: Pending Stage 1

- [ ] Shop for me request and fulfilment.
- [ ] Carry my item request and fulfilment.
- [ ] Seller acceptance, rates, capacity, deadlines, addresses, and delivery disclosure.
- [ ] Private jastipper order workspace grouped by trip, store, and actionable status.
- [ ] Private customer order timeline with evidence, expected next action, arrival, pickup or delivery, tracking, confirmation, and dispute entry.
- [ ] Private order communication.
- [ ] Authoritative order state machine and evidence records.
- [ ] Mock protected payment, hold, release, split, refund, chargeback, and reconciliation.
- [ ] QR pickup with OTP fallback.
- [ ] Mock logistics dispatch and tracking.
- [ ] Risk scanning, moderation, enforcement, and appeals.
- [ ] Disputes and transaction-only reviews.
- [ ] Administrator and support exception handling.
- [ ] Shared production-shape session, idempotency, rate-limit, and abuse state; process-local implementations remain test-only.
- [ ] Public cache safety: canonical keys, protected-response exclusion, poisoning and deception tests, concurrent-miss coalescing, hot-key budgets, bounded stale windows, invalidation, and database-stampede prevention.
- [ ] Direct private evidence quarantine, server-observed hashes, validation, scanning, retention, and authorization-mediated downloads.
- [ ] Gate Shop for me `PURCHASED` on an accepted actual-product photograph without routine fixed-price receipt disclosure.
- [ ] Gate Carry my item `COLLECTED` on accepted collection photographs and measured weight; require customer approval for material variance.
- [ ] Keep any actual-cost, dispute, fraud, or compliance receipt evidence private, purpose-limited, and retention-bounded.
- [ ] Transaction-bound outbox and durable retrying worker before asynchronous scans, notifications, provider retries, or reconciliation.
- [ ] Bounded cursor-paginated reads, request and provider budgets, circuit breakers, kill switches, and actionable observability.

Real funds and production logistics remain disabled.

Exit gate:

- Both service modes complete end to end in a controlled environment, including evidence, moderation, dispute, refund, and reconciliation failure paths.

## 9. Stage 3 - Provider integration and closed pilot

Status: Pending Stage 2

Required before real transactions:

- [ ] Written DOKU Partner/Aggregator approval and complete commercial terms.
- [ ] Confirmed Hold plus Split channels, maximum hold, partial release, refund, reserve, and failure behavior.
- [ ] Approved logistics provider, evidence, claims, and exception model.
- [ ] Route-aware prohibited and restricted-item taxonomy.
- [ ] Cancellation, refund, dispute, insurance, loss, damage, and provider-cost allocation matrix.
- [ ] Pilot route, category, value, weight, capacity, and participant boundaries.
- [ ] Legal, privacy, security, incident-response, support, reconciliation, and operational sign-off.
- [ ] Applicable OWASP ASVS 5.0 Level 2 requirements traced to current evidence, with independent review of high-impact flows.
- [ ] Actual privileged assurance and recovery, cookie, trusted-proxy, canonical-host, header, edge, WAF, bot, rate-limit, database, cache, managed-key, encrypted-backup, storage, payment, and logistics configurations verified in non-production.
- [ ] BurinSN-approved user, traffic, latency, availability, data, provider-quota, recovery, and cost capacity contract.
- [ ] Ramp, spike, soak, abuse, cache-stampede and hot-key, mixed-version deployment, migration-interruption, provider-failure, and recovery profiles passed in an isolated environment against that contract.
- [ ] Encrypted-backup and key restore, key rotation and compromise response, session revocation, provider kill switches, incident response, and evidence preservation rehearsed.

Initial production payment rails remain QRIS and selected Virtual Accounts. Cards, PayLater, and convenience stores remain disabled until separately approved.

Exit gate:

- End-to-end money, evidence, support, moderation, reconciliation, recovery, and logistics work with bounded pilot users and low-risk real transactions.

## 10. Stage 4 - Public beta and Threads acquisition

Status: Pending Stage 3

Threads is used to:

- recruit active jastippers;
- advertise real published trips and destinations;
- collect feature requests and workflow feedback;
- publish trust and safety education;
- move transaction activity from social replies and direct messages into NitipCuy.

Public beta requires:

- measured conversion, fulfilment, cancellation, fraud, moderation, refund, dispute, support, and settlement results;
- validated fee sustainability;
- tested incident response and recovery;
- stable provider and operational service levels;
- BurinSN product and visual approval.

## 11. Current blockers

No external blocker prevents Stage 1 or Stage 2 work with mock providers.

The unresolved DOKU, logistics, policy, legal, and pilot items listed in Stage 3 block only real-money pilot activation.

## 12. Now, next, and later

### Now

Commit, narrowly review, and repin the final four-lifecycle-file evidence successor, then repeat hosted exact-head gates.

### Next

Report the repeated final exact-head checks, hostile-review rating, CodeRabbit limitation, mergeability, and exclusions, then obtain fresh BurinSN review before any merge.

### Later

Add seller acceptance/rejection, request expiry/cancellation, and capacity release before activating the reservation lifecycle. Then add accepted commercial terms and mock payment; delivery remains later. Complete the core marketplace with mock providers, integrate approved real providers, run a closed pilot, then use Threads for acquisition and continuous feedback.
