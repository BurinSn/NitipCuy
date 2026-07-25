# NitipCuy Canonical Roadmap

Last updated: 2026-07-25 07:32 WIB

Current stage: Stage 1 - Platform foundation

Implementation status: Repository baseline complete; architecture and application scaffolding next

## 1. Accepted foundation

- Standalone BurinSN product named NitipCuy.
- Two service modes: Shop for me and Carry my item.
- Trip-first destination and timeline discovery.
- Seller-defined rates, capacity, minimums, maximums, and delivery terms.
- Public listing discussion plus private order communication.
- Private address captured before paid commitment.
- Self-pickup QR with OTP fallback and third-party logistics evidence.
- Verified seller identity and bank account.
- Transaction-only reputation.
- Active risk scanning with severity-based enforcement and appeals.
- No subscriptions.
- Provisional 3 percent platform protection fee, minimum Rp15,000 and maximum Rp100,000.
- DOKU as conditional preferred payment provider.
- QRIS and selected VA as preferred MVP payment rails.

## 2. Stage 0 - Product foundation

Status: Complete

Completed:

- [x] Product boundary and commercial ADR.
- [x] Master product specification.
- [x] Initial order lifecycle.
- [x] Initial trust-and-safety enforcement model.
- [x] DOKU public-documentation hostile review.
- [x] DOKU conditional-preference ADR.
- [x] Standalone project folder and lifecycle records.
- [x] Canonical private GitHub repository created under BurinSn.

Threads research is not a platform-build prerequisite. The existing market evidence is sufficient to begin building. Threads moves to public-beta acquisition, promotion, and continuous product feedback.

## 3. Stage 1 - Platform foundation

Status: In progress

Deliverables:

- [x] Commit and push the initial documentation and governance baseline.
- [ ] Select and document the web-first application architecture and deployment target.
- [ ] Define the first end-to-end vertical slice and acceptance criteria.
- [ ] Define core domain entities, permissions, state machines, and provider-independent ports.
- [ ] Establish local development, quality, test, security, migration, and CI foundations.
- [ ] Implement a working local platform shell using mock payment and logistics providers.
- [ ] Produce customer and jastipper journey maps and the initial information architecture.
- [ ] Produce the first visual direction and obtain BurinSN visual sign-off before production use.

Recommended first vertical slice:

```text
account
  -> jastipper profile
  -> trip publication
  -> destination and date search
  -> trip detail
  -> public question and answer
```

Exit gate:

- The repository is healthy and the first vertical slice works locally with documented architecture, tests, and approved product behavior.

## 4. Stage 2 - Core marketplace MVP

Status: Pending Stage 1 exit

Deliverables:

- Shop for me and Carry my item requests;
- seller acceptance, rate, capacity, deadline, address, and delivery disclosure;
- private order communication;
- order state machine and evidence collection;
- mock protected payment, hold, release, split, refund, and reconciliation;
- QR and OTP pickup;
- mock third-party delivery tracking;
- trust-and-safety scanning and moderation workflow;
- disputes and transaction-only reviews;
- administrator and support exception handling.

Real funds and production logistics remain disabled. Mock provider ports let the marketplace be built and tested without waiting for DOKU or Biteship.

Exit gate:

- Both service modes complete end to end in a controlled environment, including moderation, evidence, dispute, refund, and reconciliation failure cases.

## 5. Stage 3 - Provider integration and closed pilot

Status: Pending Stage 2 exit

Required before real transactions:

- written DOKU Partner/Aggregator approval and commercial terms;
- confirmed Hold plus Split channel matrix, maximum hold, partial release, refund, reserve, and failure behavior;
- Biteship or another approved logistics integration review;
- route-aware prohibited and restricted-item taxonomy;
- cancellation, refund, dispute, insurance, loss, damage, and provider-cost allocation matrix;
- pilot route, category, value, weight, capacity, and participant boundaries;
- legal, privacy, security, incident-response, and operational sign-off.

Initial production rails remain QRIS and selected Virtual Accounts.

Exit gate:

- End-to-end money, evidence, support, moderation, reconciliation, recovery, and logistics work with bounded pilot users and low-risk real transactions.

## 6. Stage 4 - Public beta and Threads acquisition

Status: Pending Stage 3 exit

Threads becomes a deliberate launch channel for:

- recruiting active jastippers;
- advertising published trips and destinations;
- collecting feature requests and workflow feedback;
- publishing education and trust guidance;
- directing transactions into NitipCuy instead of completing them in social replies or direct messages.

Public beta also requires measured fraud, cancellation, refund, dispute, support, conversion, and settlement results; validated fee sustainability; tested incident response; and BurinSN product and visual approval.

## 7. Current blockers

There is no external blocker to repository setup, architecture, experience design, or building with mock providers.

The following block real-money pilot launch, not platform development:

1. DOKU marketplace contract and custom fees.
2. Maximum Hold duration, partial release, refund, reserve, and failure rules.
3. Biteship or alternative logistics approval.
4. Prohibited-item taxonomy and legal review.
5. Cancellation, refund, loss, damage, insurance, and provider-cost policy.
6. Pilot route and risk boundaries.

## 8. Exact next actions

1. Create the first hosted implementation issue for architecture and project scaffolding.
2. Decide the web-first stack, deployment target, identity approach, database, and provider-port boundaries in an ADR.
3. Scaffold the application and implement the first local vertical slice.
4. Defer Threads acquisition research until the platform can demonstrate real trip discovery and collect useful feedback.
