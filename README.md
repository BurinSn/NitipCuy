# NitipCuy

NitipCuy is a standalone BurinSN marketplace for finding and transacting with independent jastippers.

It supports two primary services:

1. **Shop for me**: a jastipper publishes a trip, available products or open requests, rates, capacity, purchase deadline, and estimated arrival.
2. **Carry my item**: a customer already owns or has purchased an item and hires a jastipper to collect or carry it, commonly using declared weight and route-based terms.

The product replaces fragmented promotion and repetitive private questions with searchable trip listings, product or request pages, public order-related discussion, verified transactions, logistics evidence, and reputation.

## Current status

NitipCuy is entering platform foundation. The canonical private repository is [BurinSn/NitipCuy](https://github.com/BurinSn/NitipCuy). Production provider onboarding, deployment, and public launch have not started.

DOKU is the preferred payment candidate, conditional on written Partner/Aggregator approval and resolution of the commercial and operational gates in [DOKU Evaluation](docs/payments/doku-evaluation.md).

## Product boundaries

- Separate from BCN, MampirCuy, NgantorCuy, and District.
- Consistent BurinSN `Cuy` naming, not `Coy`.
- No subscription monetization.
- Jastippers choose their own rates and commercial terms.
- NitipCuy earns a disclosed platform protection fee on completed platform transactions.
- Payment, identity, evidence, moderation, dispute, and review controls remain platform-authoritative.
- NitipCuy does not become the importer, customs broker, cross-border merchant, or carrier merely by facilitating a transaction.

## Documentation

| Document | Purpose |
|---|---|
| [Roadmap](docs/roadmap.md) | Project stages, gates, status, and exact next actions |
| [Master Specification](docs/product/master-specification.md) | Canonical product and commercial model |
| [Order Lifecycle](docs/product/order-lifecycle.md) | Trip, order, payment, fulfilment, and dispute states |
| [Moderation Model](docs/trust-safety/moderation-model.md) | Scanning, enforcement, evidence, and appeals |
| [DOKU Evaluation](docs/payments/doku-evaluation.md) | Payment-provider fit, costs, settlement, and blockers |
| [ADR 0001](docs/decisions/0001-product-boundary-and-commercial-model.md) | Standalone product and fee decision |
| [ADR 0002](docs/decisions/0002-doku-conditional-preference.md) | Conditional DOKU preference |
| [Git Workflow](docs/development/git-workflow.md) | Issue, branch, review, and merge governance |
| [Changes](docs/changes.md) | Append-only material-change history |
| [Learning](docs/learning.md) | Verified learning and corrected assumptions |
| [Handoff](handoff.md) | Current cross-session resume point |

Start every continuation with `AGENTS.md`, `docs/roadmap.md`, and `handoff.md`.
