# NitipCuy Canonical Roadmap

Last reviewed: 2026-07-25 17:07 WIB

Current stage: Stage 1 - Platform foundation

Current work item: Issue #3 architecture-foundation remediation; first hostile-review correction for published-trip runtime invariants

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

- a jastipper publish where and when they are travelling, what they can buy or carry, remaining capacity, their own rates, deadlines, relevant location, and delivery terms;
- a customer find a suitable route, inspect products or submit a request, understand the full cost and delivery method, transact through the platform, follow evidence, dispute when necessary, and review a completed transaction;
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

## 4. Drift alarms

Stop and require a new impact analysis and BurinSN decision if work attempts to:

- merge NitipCuy into BCN;
- replace `Cuy` with `Coy`;
- remove either primary service mode;
- make NitipCuy set a universal jastip or kilogram rate;
- introduce subscriptions, paid boosts, or advertising as an assumed revenue requirement;
- make private addresses or identity records public;
- allow unprotected off-platform transactions to receive protected status or verified reviews;
- replace public reusable discussion with private chat only;
- weaken evidence, moderation, reconciliation, dispute, or appeal requirements;
- hard-code DOKU or Biteship behavior into the core domain;
- move real money before provider, legal, policy, security, and operational gates pass;
- delay platform development merely to collect more Threads examples;
- claim T&C removes all platform duties after known illegal or harmful activity.

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
- [x] Provider-independent payment, logistics, identity-verification, evidence-storage, clock, identifier, transaction, audit, and outbox interfaces and deterministic mocks exist.
- [x] Framework-free domain, application, adapter, and delivery package layout established.
- [ ] Mechanically enforce dependency direction; package manifests and TypeScript do not prevent cross-package relative imports.
- [x] Local development, formatting, lint, strict type, unit test, build, audit, and PR-CI gates established.
- [x] Working local shell implements public trip search, detail, and chronological public Q&A using simulated data.
- [x] Published-trip runtime invariants reject unsupported modes, impossible calendar and clock values, invalid offsets, and duplicate question IDs; cross-offset Q&A sorts by instant.
- [x] Exact-toolchain frozen install, peer, quality, production-audit, lifecycle, runtime, complete-diff, and security gates passed for the original architecture checkpoint.
- [x] Issue #3 branch is committed, pushed, and opened as pull request #4.
- [ ] BurinSN gives fresh issue #3 merge approval after all evidence and findings are visible.

The current architecture probe is deliberately public and read-only. It demonstrates the intended package direction without prematurely combining identity selection, persistence, protected mutation, and UI behavior in one change. It is not merge-ready while the hostile-review remediation gate below remains open.

Pull-request head, hosted checks, annotations, reviews, and mergeability are volatile. Retrieve them directly. A missing, pending, skipped, warned, or failed lifecycle or application-quality result blocks approval by project policy.

### Hostile-review remediation gate

- [x] Correct published-trip runtime date, timestamp, service-mode, question-identity, and cross-offset chronology invariants with adversarial tests.
- [ ] Reconcile the checked identity-to-internal-account acceptance claim with the deliberately deferred account slice.
- [ ] Add automated dependency-boundary enforcement.
- [ ] Replace or defer the transaction abstraction so repository, audit, ledger, and outbox work can share one enforceable transaction.
- [ ] Correct payment initiation, held-state, release, refund, and reconciliation contracts.
- [ ] Enforce and contract-test idempotency.
- [ ] Replace caller-trusted evidence hashes and buffered raw-upload assumptions with a server-authoritative evidence lifecycle.
- [ ] Clarify the public published-trip projection versus the future authoritative Trip aggregate.
- [ ] Reconcile all lifecycle, specialist, issue, and pull-request claims after the corrections.
- [ ] Run final exact-toolchain, runtime, security, complete-diff, and hosted exact-head review.

### Next persisted vertical slice

- [ ] Create the persisted marketplace-foundation issue only after the remediation gate passes and issue #3 is merged.
- [ ] Implement the first persisted vertical slice:

```text
account
  -> jastipper profile
  -> trip draft
  -> moderation gate
  -> trip publication
  -> destination and date search
  -> trip detail
  -> public question and answer
```

- [ ] Add the first PostgreSQL schema and reviewed migration through the isolated database adapter.
- [ ] Add external-identity proof and protected server-authoritative mutations without storing passwords.
- [ ] Add integration tests using disposable resources and explicit destructive-test guards.

### Experience slice

- [ ] Produce customer and jastipper journey maps.
- [ ] Define information architecture and responsive web behavior.
- [ ] Create the first visual direction.
- [ ] Obtain BurinSN visual sign-off before production use.

Exit gate:

- The repository is healthy and the first vertical slice works locally with documented architecture, tests, security boundaries, and approved product behavior.

## 8. Stage 2 - Core marketplace MVP

Status: Pending Stage 1

- [ ] Shop for me request and fulfilment.
- [ ] Carry my item request and fulfilment.
- [ ] Seller acceptance, rates, capacity, deadlines, addresses, and delivery disclosure.
- [ ] Private order communication.
- [ ] Authoritative order state machine and evidence records.
- [ ] Mock protected payment, hold, release, split, refund, chargeback, and reconciliation.
- [ ] QR pickup with OTP fallback.
- [ ] Mock logistics dispatch and tracking.
- [ ] Risk scanning, moderation, enforcement, and appeals.
- [ ] Disputes and transaction-only reviews.
- [ ] Administrator and support exception handling.

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

Push the final review-state documentation checkpoint. If the resulting live head passes both hosted workflows without material annotations or findings and remains mergeable, post the final audit and request fresh owner approval; otherwise fix the live head.

### Next

Obtain fresh owner approval for issue #3 after exact-head hosted evidence, then implement the persisted account-to-public-Q&A vertical slice through a new governed issue.

### Later

Complete the core marketplace with mock providers, integrate approved real providers, run a closed pilot, then use Threads for acquisition and continuous feedback.
