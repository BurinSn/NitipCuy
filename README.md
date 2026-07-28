# NitipCuy

NitipCuy is a standalone BurinSN marketplace for finding and transacting with independent jastippers.

It supports two primary services:

1. **Shop for me**: a jastipper publishes a trip, source-service and ordering windows, available products or open requests, rates, capacity, transport departure, and estimated arrival.
2. **Carry my item**: a customer already owns or purchased an item and hires a jastipper to collect or carry it using declared weight and route-based terms.

The product replaces fragmented promotion and repetitive private questions with searchable trips, public reusable discussion, protected orders, logistics evidence, and transaction-backed reputation.

## Current status

Stage 1 platform foundation is in progress under [issue #3](https://github.com/BurinSn/NitipCuy/issues/3).

The repository now contains a modular-monolith architecture, mechanically enforced inward package dependencies, provider-independent ports, deterministic mock adapters, unit tests, quality gates, a defense-in-depth security and scale baseline, and a working local read-only trip-discovery shell. The shell uses simulated public data. The security and scale controls are accepted design requirements, not proof that production controls are implemented or that the shell has production, provider, payment, legal, security, capacity, or visual approval.

DOKU remains the preferred payment candidate, conditional on written Partner/Aggregator approval and resolution of the gates in the [DOKU evaluation](docs/payments/doku-evaluation.md). No provider, deployment, database, or production account is active.

## Product boundaries

- Separate from BCN, MampirCuy, NgantorCuy, and District.
- Uses the BurinSN `Cuy` suffix, not `Coy`.
- No subscription monetization.
- Jastippers choose their own rates and commercial terms.
- Fixed-price Shop for me orders require purchased-product photographs, not routine buyer-visible receipt or acquisition-cost disclosure.
- Carry my item collection requires photographs and measured weight, with customer approval for material variance.
- Closed trip offers reject new orders but remain read-only seller history.
- NitipCuy earns a disclosed platform protection fee on completed protected transactions.
- Payment, identity, evidence, moderation, dispute, and review controls remain platform-authoritative.
- NitipCuy does not become the importer, customs broker, cross-border merchant, or carrier merely by facilitating a transaction.

## Local development

Required:

- Node.js `24.18.0`
- pnpm `11.17.0`

```bash
pnpm install --frozen-lockfile
pnpm dev
```

Open `http://localhost:3000`.

Run the complete local application gate:

```bash
pnpm check:boundaries
pnpm check
pnpm audit:prod
./scripts/check-lifecycle-docs.sh origin/main
```

See [development and quality gates](docs/development/quality-gates.md) for the evidence contract and supported commands.

## Repository shape

```text
apps/web                 Next.js delivery and server-only composition
packages/domain          framework-free domain model and invariants
packages/application     use cases and provider-neutral ports
packages/adapters        in-memory and mock adapter implementations
scripts                  architecture, test, and lifecycle gates
```

The [system architecture](docs/architecture/system-architecture.md), [ADR 0003](docs/decisions/0003-web-architecture-and-application-foundation.md), and [ADR 0004](docs/decisions/0004-security-resilience-and-scale-baseline.md) define the binding dependency, security, resilience, and scaling boundaries.

## Documentation

| Document | Purpose |
|---|---|
| [Roadmap](docs/roadmap.md) | Project stages, gates, status, and exact next work |
| [Master specification](docs/product/master-specification.md) | Canonical product and commercial model |
| [Order lifecycle](docs/product/order-lifecycle.md) | Trip, order, payment, fulfilment, and dispute states |
| [System architecture](docs/architecture/system-architecture.md) | Runtime, modules, data boundaries, security, and provider ports |
| [Security architecture](docs/security/security-architecture.md) | Threat model, defense-in-depth controls, and security verification gates |
| [Scalability and resilience](docs/architecture/scalability-and-resilience.md) | Stateless scaling, database and worker discipline, capacity, load, and recovery gates |
| [Product-boundary ADR](docs/decisions/0001-product-boundary-and-commercial-model.md) | Standalone product, seller-rate rights, and transaction-fee model |
| [DOKU preference ADR](docs/decisions/0002-doku-conditional-preference.md) | Conditional payment-provider direction and activation gates |
| [Architecture ADR](docs/decisions/0003-web-architecture-and-application-foundation.md) | Stack, deployment posture, alternatives, and extraction triggers |
| [Security and scale ADR](docs/decisions/0004-security-resilience-and-scale-baseline.md) | Accepted security target, layered controls, scalable runtime, and evidence levels |
| [Quality gates](docs/development/quality-gates.md) | Supported toolchain and validation requirements |
| [Moderation model](docs/trust-safety/moderation-model.md) | Scanning, enforcement, evidence, and appeals |
| [DOKU evaluation](docs/payments/doku-evaluation.md) | Payment-provider fit, costs, settlement, and blockers |
| [Git workflow](docs/development/git-workflow.md) | Issue, branch, review, and merge governance |
| [Changes](docs/changes.md) | Append-only material-change history |
| [Learning](docs/learning.md) | Verified learning and corrected assumptions |
| [Handoff](handoff.md) | Current cross-session resume point |

Start every continuation with `AGENTS.md`, `docs/roadmap.md`, and `handoff.md`.
