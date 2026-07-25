# ADR 0002: DOKU as Conditional Preferred Payment Provider

Status: Accepted with external gates

Date: 2026-07-25

## Context

NitipCuy needs verified marketplace sellers, buyer payment collection, held settlement, post-fulfilment release, seller and platform allocation, refund capability, and Indonesian payment rails.

DOKU publicly offers Partner onboarding, personal and corporate business registration, Hold and Release Settlement, Split Settlement, bank verification, Checkout, and relevant payment methods.

## Decision

1. Treat DOKU as the preferred payment-provider candidate.
2. Pursue a Partner/Aggregator model, not an ordinary merchant account.
3. Plan MVP payment methods around QRIS and selected Virtual Accounts.
4. Keep cards, PayLater, and convenience stores disabled until separately approved.
5. Hold settlement through fulfilment and release after buyer confirmation or an approved no-dispute expiry.
6. Keep the internal ledger and payment contract provider-independent.
7. Do not begin a production-specific integration until DOKU answers and contractually resolves the gates in `docs/payments/doku-evaluation.md`.

## Consequences

- DOKU is a shortlist decision, not proof of provider acceptance.
- Sellers require DOKU-compatible KYB and bank verification before paid activity.
- Seller payout is H+1 business day after release, subject to the provider and banking calendar.
- Seller purchase funding remains a product constraint until safe partial release is confirmed.
- The fee remains provisional because Partner, Hold, Split, reserve, and payout terms are unpublished.
- Every payment, hold, split, release, refund, chargeback, and settlement state requires independent reconciliation.
