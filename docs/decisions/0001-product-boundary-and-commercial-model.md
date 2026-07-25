# ADR 0001: Standalone Product Boundary and Commercial Model

Status: Accepted

Date: 2026-07-25

## Context

Existing jastip activity is fragmented across social platforms. Promotion, route discovery, repeated questions, evidence, payment protection, delivery terms, dispute handling, and reputation are not represented as one transaction lifecycle.

NitipCuy needs BurinSN naming consistency without becoming a BCN product or turning BurinSN into the merchant for the goods.

## Decision

1. Create NitipCuy as a standalone BurinSN product.
2. Use `Cuy`, consistent with MampirCuy and NgantorCuy. Do not use `Coy`.
3. Support both `Shop for me` and `Carry my item`.
4. Let jastippers independently set item, service, kilogram, minimum, maximum, capacity, pickup, and delivery terms.
5. Provide public trip or listing discussion and private order communication.
6. Require protected platform payment and fulfilment evidence for transaction protection and verified reviews.
7. Use a transaction platform fee as NitipCuy's revenue model.
8. Do not introduce subscriptions, paid boosts, or advertising monetization in the accepted foundation.
9. Provisionally set the platform fee at 3 percent, minimum Rp15,000 and maximum Rp100,000, subject to provider and pilot economics.
10. Keep payment-provider, logistics, insurance, and similar third-party costs separate and transparent.

## Consequences

- NitipCuy needs marketplace identity, payment, ledger, moderation, evidence, dispute, logistics, and reputation capabilities.
- The platform is operationally more demanding than a classifieds or social-post directory.
- Transactions completed off-platform cannot receive platform protection or verified transaction reviews.
- Seller pricing remains flexible but must be disclosed and accepted before commitment.
- BurinSN must validate the platform fee after real provider pricing and pilot operations.
- NitipCuy's legal terms must describe role boundaries without pretending that terms alone remove marketplace duties.
