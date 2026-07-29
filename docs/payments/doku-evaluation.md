# DOKU Evaluation for NitipCuy

Status: Conditional preferred provider

Verified: 2026-07-25 against public DOKU documentation

## 1. Decision

DOKU is NitipCuy's preferred payment candidate because its public platform capabilities align with the required flow:

- Partner/Aggregator onboarding;
- personal and corporate seller business registration;
- seller bank-account verification;
- Checkout payment collection;
- Hold and Release Settlement;
- Split Settlement;
- refunds and payouts.

This is not final provider approval. NitipCuy requires a DOKU Partner/Aggregator contract, not an ordinary merchant account. Provider-specific production design remains blocked until DOKU confirms the commercial, legal, channel, hold, release, reserve, and failure terms in writing.

Primary sources:

- [Partner API](https://developers.doku.com/partnership/partner-api)
- [Business Registration API](https://developers.doku.com/partnership/partner-api/business-registration-api)
- [Hold and Release Settlement](https://developers.doku.com/accept-payments/finance-and-settlement/hold-and-release-settlement)
- [Split Settlement](https://developers.doku.com/accept-payments/finance-and-settlement/split-settlement)
- [Supported payment methods](https://developers.doku.com/accept-payments/doku-checkout/supported-payment-methods)
- [Pricing](https://www.doku.com/en-us/pricing)
- [Settlement time](https://docs.doku.com/accept-payments/finance-and-settlement/settlement-time)
- [Refund and chargeback](https://docs.doku.com/accept-payments/finance-and-settlement/refund-and-chargeback/refund-and-chargeback)

## 2. Seller onboarding

DOKU's public Partner flow supports `PERSONAL` and corporate businesses. Personal onboarding includes KTP, identity number, owner liveness, address, contact details, and settlement bank account. Corporate onboarding supports Indonesian business entities and associated registration documents.

Published service levels are:

- KYB review: up to 2 x 24 hours;
- payment-service activation: up to 5 x 24 hours.

NitipCuy may let a pending seller prepare a profile and draft listings, but only an active verified seller can accept protected payment.

## 3. Planned money flow

```text
Buyer
  -> DOKU Checkout
  -> verified paid and held settlement
  -> NitipCuy fulfilment and dispute controls
  -> DOKU Release API
  -> DOKU Split Settlement
  -> verified seller bank plus NitipCuy settlement
```

The order ledger independently records:

- seller item or transport entitlement;
- seller service charge;
- domestic delivery and insurance;
- DOKU payment cost;
- NitipCuy protection fee;
- refund and dispute allocations;
- expected and actual release;
- expected and actual seller and platform settlement.

DOKU deducts its fee before applying the split. NitipCuy must use channel-aware calculations and reconciliation instead of assuming a percentage split produces the promised seller amount.

## 4. Payment methods

DOKU publicly lists Virtual Accounts, QRIS, cards, convenience stores, e-wallets, PayLater, direct debit, digital banking, and related Indonesian payment channels.

MVP recommendation:

- enable QRIS and selected Virtual Accounts;
- consider DANA, ShopeePay, and OVO only after written Hold plus Split confirmation;
- disable cards, PayLater, and convenience stores initially.

The MVP recommendation limits chargebacks, refund complexity, slow settlement, and payment costs. A payment method being listed by DOKU does not prove it supports the exact combined Partner plus Hold plus Split configuration.

## 5. Published pricing

Public prices below exclude VAT and may not represent Partner/Aggregator pricing.

| Capability | Published price |
|---|---:|
| QRIS | 0.7 percent |
| Virtual Account | Rp4,000 |
| DANA or DOKU Wallet | 1.5 percent |
| OVO | 2 to 3.18 percent |
| ShopeePay | 2 to 4 percent |
| Credit card | 2.8 percent + Rp2,000 |
| PayLater | 1.5 to 2.3 percent + Rp2,000 |
| Alfa Group | Rp5,000 |
| Indomaret | Rp6,500 |
| BI-FAST transfer | Rp1,500 |
| Auto-routed transfer | Rp3,000 |
| Bank-account validation | Rp500 |

Unpublished and unresolved:

- Partner/Aggregator account fee;
- personal or corporate submerchant KYB fee;
- Hold and Release fee;
- Split Settlement fee;
- whether Split direct-to-bank settlement replaces or adds a transfer fee;
- minimum volume or monthly commitment;
- implementation, support, or SLA fee;
- required deposit, rolling reserve, or chargeback collateral.

## 6. Provisional unit economics

The accepted planning fee is 3 percent with a Rp15,000 minimum and Rp100,000 maximum.

Illustrations below assume an 11 percent tax on DOKU's fee and use the published Rp1,500 BI-FAST transfer as a placeholder. They exclude unpublished Partner, Hold, Split, reserve, refund, dispute, support, insurance, and fraud costs.

| Protected order | Rail | Platform fee | Approximate payment plus placeholder payout | Approximate contribution before other costs |
|---|---:|---:|---:|---:|
| Rp200,000 | QRIS | Rp15,000 | Rp3,300 | Rp11,700 |
| Rp500,000 | QRIS | Rp15,000 | Rp5,700 | Rp9,300 |
| Rp1,000,000 | VA | Rp30,000 | Rp6,100 | Rp23,900 |
| Rp500,000 | Card | Rp15,000 | approximately Rp19,900 | negative |

Conclusion: the provisional platform fee can support a QRIS and VA pilot if custom DOKU charges are low. It does not safely absorb cards. DOKU payment costs should be shown separately and passed through at cost rather than disguised as platform revenue.

## 7. Timing

Published aggregator settlement eligibility:

| Channel | Published timing |
|---|---:|
| QRIS | T+1 working day |
| Most Virtual Accounts | T+1 |
| BCA and DOKU VA | T+2 |
| E-wallets | T+1 or T+2 |
| Cards | T+2 or T+3 |
| Convenience stores | T+4 |

DOKU states that release settles H+1 business day after the Release API call. NitipCuy must not promise instant seller payout.

Expected customer-to-seller cycle:

```text
payment
  + purchase or trip duration
  + domestic fulfilment
  + buyer confirmation or no-dispute window
  + H+1 business-day release settlement
```

Weekends, public holidays, bank rejection, provider review, dispute, or reconciliation failure extend the cycle.

## 8. Refund and chargeback exposure

Public DOKU terms indicate:

- bank refunds may take up to 10 business days;
- DOKU Wallet refunds may take up to 3 business days;
- card refunds may appear in 7 to 14 business days;
- original MDR and other transaction costs are not returned;
- non-card refund fees can apply;
- DOKU may deduct chargebacks from current or future NitipCuy settlement;
- insufficient settlement may require NitipCuy to reimburse DOKU within 7 business days;
- the issuing bank or acquirer, not NitipCuy, determines a card chargeback.

NitipCuy needs an operating refund and dispute reserve. The initial reserve policy must at least cover the largest active protected order plus expected refunds and provider costs, then be recalibrated from pilot data.

## 9. Hostile findings

1. **Approval risk**: DOKU can reject the jastip marketplace model or impose additional conditions.
2. **Unknown unit economics**: the most marketplace-specific fees are unpublished.
3. **Hold-duration risk**: the maximum hold and auto-release behavior are unpublished, while jastip trips can last weeks.
4. **Partial-release risk**: public documentation does not establish safe repeated or staged releases.
5. **Silent split failure**: DOKU documents that an invalid split can leave the payment successful while routing funds to the default primary account.
6. **Net-of-fee split**: naive percentage splitting underpays the seller.
7. **Refund liquidity**: DOKU fees remain spent and NitipCuy can owe refunds or chargebacks before recovering from a seller.
8. **Business-day delay**: release is not instant and weekends or holidays extend the cycle.
9. **Sub Account limitation**: public Sub Account documentation is limited to Virtual Account flows and cannot be assumed to support every MVP rail.
10. **Legal ambiguity**: marketing use of escrow language does not establish contractual fund segregation, insolvency treatment, dispute authority, or treatment during an account freeze.
11. **Operational dependency**: webhook success must be signature-verified, idempotent, polled or reconciled, and matched to reports. Redirect success is insufficient.
12. **Seller capital**: holding the entire settlement makes the seller fund purchases until release unless a safe partial-release model is contracted.

## 10. Written DOKU gates

DOKU must answer:

1. Will it approve NitipCuy as a Partner/Aggregator serving personal jastippers?
2. Which payment channels support Hold and Split simultaneously?
3. What are the maximum hold duration, auto-release behavior, and extension rules?
4. Can NitipCuy make multiple or partial releases, and can a release be reversed?
5. How does refund work before release and while settlement is held?
6. What are all Partner, KYB, Hold, Split, payout, support, and minimum-volume charges?
7. What deposit, rolling reserve, or chargeback collateral is required?
8. What webhook signature, retry, idempotency, reconciliation, and SLA commitments apply?
9. What happens on invalid split, rejected seller bank, platform suspension, provider freeze, or DOKU outage?
10. How are customer funds held, segregated, and treated if NitipCuy or DOKU becomes insolvent or restricted?

Until the written answers are accepted, implementation must use a provider-independent payment port and an internal authoritative ledger rather than embedding DOKU assumptions into the domain.

The issue #3 provider-neutral contract follows that boundary. It assigns every initiation a stable internal payment-attempt ID so an ambiguous response remains inspectable without a returned provider reference. It distinguishes accepted, rejected, and unknown request submissions from later provider observations; represents customer redirect, QR, and Virtual Account instructions without DOKU types; and observes collection, hold, release, refund, settlement, and chargeback separately, including exact collected and held amounts. Provider signals only trigger inspection. This is an architecture contract and deterministic mock, not evidence that DOKU supports the modeled combination or that any provider integration, ledger, reconciliation worker, or money movement exists.
