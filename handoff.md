# NitipCuy Cross-Session Handoff

Last updated: 2026-07-25 07:29 WIB

Handoff owner: Codex

Product owner: BurinSN

Canonical repository: `https://github.com/BurinSn/NitipCuy`

Current stage: Platform foundation

Current work item: Establish the repository baseline and begin the web-first platform

Status: BurinSN changed the sequence to platform-first. Additional Threads research is no longer a build gate and is deferred to public-beta acquisition and feedback. The private `BurinSn/NitipCuy` repository has been created. The documentation now separates what can be built with mock provider ports from the DOKU, logistics, policy, and legal gates that block real-money launch. The initial baseline still needs its local Git commit, push, and exact post-push verification.

## Mandatory resume order

1. Read `AGENTS.md`.
2. Read `docs/roadmap.md`.
3. Read this handoff.
4. Read the latest `docs/changes.md` entry.
5. Read relevant `docs/learning.md` entries.
6. Read `docs/product/master-specification.md`.
7. Read `docs/product/order-lifecycle.md`.
8. Read `docs/trust-safety/moderation-model.md`.
9. Read `docs/payments/doku-evaluation.md`.
10. Verify any volatile DOKU, Biteship, payment, legal, price, or regulatory fact against current primary sources.

## Accepted decisions

- Name: NitipCuy, using `Cuy`, not `Coy`.
- Ownership: standalone BurinSN product, separate from BCN.
- Modes: Shop for me and Carry my item.
- Monetization: no subscriptions; disclosed platform protection fee.
- Planning fee: 3 percent, minimum Rp15,000, maximum Rp100,000.
- Seller pricing: seller-authoritative, disclosed before commitment.
- Communication: public listing discussion plus private order communication.
- Delivery: declared before payment; self-pickup uses QR with OTP fallback; third-party delivery requires tracking and evidence.
- Trust: verified seller, transaction evidence, transaction-only reviews, active scanning, enforcement, appeals.
- Payments: DOKU preferred conditionally; QRIS and selected VA first; cards and PayLater disabled initially.
- Architecture boundary: provider-independent ledger and payment contract.

## Unresolved blockers

1. DOKU Partner/Aggregator approval for the model.
2. DOKU Hold plus Split channel matrix.
3. Maximum hold, auto-release, partial release, refund-while-held, reserve, and failure terms.
4. Partner, KYB, Hold, Split, payout, and SLA prices.
5. Prohibited and restricted-item taxonomy and legal review.
6. Cancellation, refund, damage, loss, insurance, and provider-cost matrix.
7. Biteship evaluation.

## Exact next action

Commit and push the initial baseline to `BurinSn/NitipCuy` on `main`, verify the immutable commit and remote state, then create the first architecture and application-scaffolding issue. Do not contact DOKU, Biteship, Threads users, or other external parties without separate approval.

## Verification performed

- Confirmed local BurinSN naming uses MampirCuy and NgantorCuy.
- DOKU claims and fees were researched from official DOKU sources on 2026-07-25.
- Planning documents distinguish accepted decisions, verified facts, proposals, assumptions, and open questions.
- Verified the authenticated GitHub user and BurinSn private-repository convention.
- Created the private `BurinSn/NitipCuy` GitHub repository.
- No provider account, external vendor message, payment movement, deployment, or public launch occurred.
