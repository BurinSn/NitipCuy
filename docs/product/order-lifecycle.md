# NitipCuy Order Lifecycle

Status: Accepted planning model

Last updated: 2026-07-25

## 1. Principles

1. A trip listing is not an order.
2. A conversation is not a commitment.
3. A seller acceptance is not a successful payment.
4. A successful payment is not proof that settlement was held or split correctly.
5. Delivery status is not final settlement while a valid dispute is open.
6. Reviews require a completed platform transaction.
7. Every financial transition is idempotent, timestamped, attributable, and reconciled.

## 2. Trip lifecycle

```text
DRAFT
  -> UNDER_REVIEW
  -> PUBLISHED
  -> REQUESTS_CLOSED
  -> IN_TRANSIT
  -> ARRIVED
  -> FULFILMENT_COMPLETE
  -> ARCHIVED
```

Trust-and-safety action can move a trip to `HIDDEN`, `SUSPENDED`, or `REMOVED`. Schedule changes create a visible revision and notify affected customers rather than silently replacing accepted terms.

## 3. Request and order lifecycle

Both service modes use one authoritative order model with mode-specific evidence.

```text
DRAFT_REQUEST
  -> SUBMITTED
  -> SELLER_ACCEPTED | SELLER_REJECTED | EXPIRED
  -> PAYMENT_PENDING
  -> PAID_HELD
  -> FULFILMENT_IN_PROGRESS
  -> READY_FOR_HANDOVER
  -> DISPATCHED | PICKUP_READY
  -> DELIVERED_OR_HANDED_OVER
  -> CONFIRMATION_WINDOW
  -> RELEASE_PENDING | DISPUTED
  -> SETTLED | REFUNDED | PARTIALLY_REFUNDED
  -> CLOSED
```

Cancellation is a reasoned transition from eligible states, not a deletion. The cancellation record preserves actor, reason, evidence, commercial allocation, provider fees, refund state, and notifications.

## 4. Shop-for-me evidence

Required evidence can include:

- seller acceptance of item, variation, maximum budget, substitution, and deadline;
- successful protected payment;
- purchase receipt or store confirmation;
- purchased-item photograph;
- quantity and variation confirmation;
- packaging and condition evidence;
- route and arrival updates;
- domestic dispatch or pickup evidence;
- delivery or handover confirmation.

For the MVP, the jastipper funds the purchase until final release. Early reimbursement is prohibited until DOKU confirms a safe, auditable partial or staged release contract.

## 5. Carry-my-item evidence

Required evidence can include:

- declared item name, category, value, dimensions, weight, photos, ownership or purchase reference, and collection point;
- jastipper acceptance of contents and capacity;
- collection photo and timestamp;
- measured collection weight;
- documented variance and customer approval when the final charge changes;
- packaging and condition evidence;
- dispatch, tracking, delivery, or handover evidence.

The seller can reject the item before commitment or collection. Discovery of prohibited or materially misdeclared contents after commitment invokes the trust-and-safety workflow and does not require the seller to continue transport.

## 6. Delivery completion

### Self-pickup

1. Jastipper marks the order `PICKUP_READY`.
2. Platform issues a short-lived QR code and OTP fallback.
3. Both parties verify the handover.
4. Platform records time, actors, method, and device or risk context.
5. The order enters the confirmation window.

### Third-party logistics

1. The selected service and cost basis are confirmed before commitment.
2. Jastipper records provider, service, tracking or resi identifier, package evidence, and dispatch time.
3. Provider events are treated as evidence, not unquestionable truth.
4. Delivered status starts the confirmation window.
5. A valid non-delivery or condition dispute pauses release.

## 7. Payment and release

Planned DOKU flow:

```text
Buyer Checkout
  -> DOKU payment confirmation
  -> NitipCuy verifies signature and transaction status
  -> held settlement reconciled
  -> fulfilment evidence completed
  -> buyer confirmation or no-dispute expiry
  -> release request
  -> split reconciliation
  -> seller and platform settlement reconciliation
```

The provisional no-dispute window is 24 hours after verified handover or delivery. This is a planning assumption, not a final policy for every category.

Release must fail closed when:

- a dispute is open;
- required evidence is missing;
- the seller or order is restricted;
- the release amount differs from the authoritative ledger;
- DOKU settlement or split status is unknown;
- the seller bank account is inactive or rejected.

## 8. Refunds and disputes

A dispute freezes automatic release and records:

- issue category;
- disputed amount;
- customer statement and evidence;
- jastipper response and evidence;
- logistics and payment-provider evidence;
- moderator decisions and audit history;
- refund, partial refund, seller release, platform-fee, and non-refundable provider-cost treatment.

The cancellation and refund matrix remains an open product decision. At minimum:

- seller cancellation before purchase: customer made whole, including the NitipCuy fee;
- prohibited or fraudulent seller conduct: hold, investigate, refund as applicable, and enforce;
- buyer change of mind after evidenced purchase: no automatic full refund promise;
- payment and refund provider costs must be explicitly allocated and disclosed;
- no review is published until the transaction reaches an eligible terminal state.
