# NitipCuy

NitipCuy is a standalone BurinSN marketplace for finding and transacting with independent jastippers.

It supports two primary services:

1. **Shop for me**: a jastipper publishes a trip, source-service and ordering windows, available products or open requests, rates, capacity, transport departure, and estimated arrival.
2. **Carry my item**: a customer already owns or purchased an item and hires a jastipper to collect or carry it using declared weight and route-based terms.

The product replaces fragmented promotion and repetitive private questions with searchable trips, public reusable discussion, protected orders, logistics evidence, and transaction-backed reputation.

## Current status

Stage 1 platform foundation is in progress. Shared abuse controls merged through issue #11 / pull request #12. The current bounded work is [issue #13](https://github.com/BurinSn/NitipCuy/issues/13), which adds server-authoritative order submission and atomic trip-capacity reservation while deliberately stopping at `SUBMITTED`.

The repository now contains a modular-monolith architecture, mechanically enforced inward package dependencies, a PostgreSQL-backed Google-account-to-public-Q&A slice, a local order-submission candidate for both service modes, provider-independent ports, deterministic fixtures, unit and disposable-database tests, quality gates, a defense-in-depth security and scale baseline, and a working local trip-discovery shell. The shell uses simulated public data. Implemented controls remain source-, disposable-database-, or local-runtime-tested unless a narrower record says otherwise; they are not proof of production, provider, payment, legal, complete security, load capacity, or visual approval.

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
export NITIPCUY_ABUSE_SUBJECT_HMAC_KEY_BASE64="$(openssl rand -base64 32)"
NITIPCUY_APP_ORIGIN=http://localhost:3000 \
NITIPCUY_PROXY_MODE=LOCAL_DIRECT \
pnpm dev
```

Open `http://localhost:3000`.

Run the complete local application gate:

```bash
pnpm check:boundaries
pnpm check
pnpm check:perimeter-runtime
pnpm audit:prod
./scripts/check-lifecycle-docs.sh origin/main
./scripts/check-base-freshness.sh origin/main commit
node scripts/check-canonical-blocks.mjs origin/main
```

The last two gates are required when two or more sessions work this repository in parallel; see [parallel session coordination](docs/development/parallel-coordination.md). `check-base-freshness.sh` warns if another session has advanced `main` since your branch's base (use `merge` mode to block before requesting merge). `check-canonical-blocks.mjs` blocks a canonical (merge-turn-only) block edit on a stale base.

The request perimeter is fail-closed. `NITIPCUY_ABUSE_SUBJECT_HMAC_KEY_BASE64` must be a separately managed, exactly 32-byte base64 key and must never reuse the session or edge-proof secret. `LOCAL_DIRECT` is valid only for an exact loopback origin and accepts only absent or canonical loopback client-address metadata. Any non-local environment must use `TRUSTED_PROXY`, an exact HTTPS `NITIPCUY_APP_ORIGIN`, one canonical trusted client address, and a cryptographically random, separately managed `NITIPCUY_EDGE_REQUEST_SECRET` injected by an approved edge that strips client-supplied forwarding, proof, and alternate client-IP headers. Requests containing maintained alternatives such as `CF-Connecting-IP`, `True-Client-IP`, or `X-Real-IP` fail closed at the application perimeter as defense in depth. Never commit either secret. Source implementation does not prove provider configuration, direct-origin denial, key custody/rotation, aggregate cleanup load, or production rate-limit behavior.

See [development and quality gates](docs/development/quality-gates.md) for the evidence contract and supported commands. Material issues and pull requests also follow the [DRY and guarded Strix review governance](docs/development/review-governance.md).

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
| [Google account and session ADR](docs/decisions/0005-google-oidc-account-and-session-foundation.md) | Google OIDC, internal accounts, revocable sessions, and request-perimeter boundary |
| [Quality gates](docs/development/quality-gates.md) | Supported toolchain and validation requirements |
| [Review governance](docs/development/review-governance.md) | DRY and guarded Strix issue/PR evidence contract |
| [Moderation model](docs/trust-safety/moderation-model.md) | Scanning, enforcement, evidence, and appeals |
| [DOKU evaluation](docs/payments/doku-evaluation.md) | Payment-provider fit, costs, settlement, and blockers |
| [Git workflow](docs/development/git-workflow.md) | Issue, branch, review, and merge governance |
| [Parallel coordination](docs/development/parallel-coordination.md) | Multi-session worktree, base-freshness, lifecycle single-writer, and merge-serialization protocol |
| [Changes](docs/changes.md) | Append-only material-change history |
| [Learning](docs/learning.md) | Verified learning and corrected assumptions |
| [Handoff](handoff.md) | Current cross-session resume point |

Start every continuation with `AGENTS.md`, `docs/roadmap.md`, and `handoff.md`.
