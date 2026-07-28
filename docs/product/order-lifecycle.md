# NitipCuy Order Lifecycle

Status: Accepted planning model

Last updated: 2026-07-28

## 1. Principles

1. A trip listing is not an order.
2. A conversation is not a commitment.
3. A seller acceptance is not a successful payment.
4. A successful payment is not proof that settlement was held or split correctly.
5. Delivery status is not final settlement while a valid dispute is open.
6. Reviews require a completed platform transaction.
7. Every financial transition is idempotent, timestamped, attributable, and reconciled.
8. A closed trip offer blocks new orders but never silently rewrites or cancels an accepted order.
9. Seller and customer dashboards are projections; authoritative trip, order, payment, evidence, logistics, and dispute states remain separate.

## 2. Trip lifecycle

Ordering availability and physical trip progress are related but not one state machine.

### Offer lifecycle

```text
DRAFT
  -> UNDER_REVIEW
  -> SCHEDULED
  -> ACCEPTING_REQUESTS
  -> REQUESTS_CLOSED
  -> ARCHIVED
```

`SCHEDULED` is publicly visible before `orderOpenAt`. `ACCEPTING_REQUESTS` requires the current exact instant to be inside the ordering window plus available capacity and an eligible jastipper and offer. `REQUESTS_CLOSED` remains publicly visible but rejects new requests and checkout. Closure occurs at `orderCloseAt` or earlier because of capacity, seller closure, cancellation, risk, or moderation.

### Physical trip milestones

```text
PLANNED
  -> SOURCE_SERVICE_ACTIVE
  -> DEPARTED_SOURCE
  -> ARRIVED_DESTINATION
  -> TRIP_COMPLETE
```

The source-service and ordering windows can overlap, and advance PO may open before source service begins. `ARCHIVED` requires `TRIP_COMPLETE` plus every related order reaching an eligible terminal state after settlement, refund, cancellation, and dispute handling; delivery alone is insufficient.

Trust-and-safety action can move an offer to `HIDDEN`, `SUSPENDED`, or `REMOVED`. Schedule changes create a visible revision and notify affected customers rather than silently replacing accepted terms. Material changes affecting accepted orders require an explicit customer remedy rather than silent replacement.

Every new-order command rechecks the authoritative current instant, eligibility, capacity, and offer state. A scheduled status update or disabled button improves presentation but is not the enforcement boundary. Capacity reservation and order creation must use one consistency boundary so the last available capacity cannot be oversold.

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

`FULFILMENT_IN_PROGRESS` has mode-specific stages:

```text
SHOP_FOR_ME
  PURCHASE_IN_PROGRESS
    -> PURCHASE_EVIDENCE_PENDING
    -> PURCHASED
    -> PACKING

CARRY_MY_ITEM
  COLLECTION_PENDING
    -> COLLECTION_EVIDENCE_PENDING
    -> WEIGHT_VARIANCE_PENDING | COLLECTED
    -> PACKING
```

The authoritative order stores the accepted commercial, schedule, evidence, and delivery snapshot. Later changes to the trip offer or seller price never silently alter it.

## 4. Shop-for-me evidence

Required minimum evidence includes:

- seller acceptance of item, variation, maximum budget, substitution, and deadline;
- successful protected payment;
- an accepted photograph of the actual purchased item before transition to `PURCHASED`;
- quantity and variation confirmation;
- packaging and condition evidence;
- route and arrival updates;
- domestic dispatch or pickup evidence;
- delivery or handover confirmation.

The purchased-item photograph is buyer-visible transaction evidence and does not disclose the seller's acquisition cost. The platform records a server-observed hash, byte length, actual type, order association, evidence classification, timestamp, verification state, and private object reference. A hash proves which bytes were accepted; it does not prove price, payment status, or authenticity by itself.

A purchase receipt is not routinely required or shown to the buyer for a fixed-price order. It may be collected privately only when the seller chose an actual-cost-plus-fee contract whose evidence rule was disclosed before commitment, or when a proportionate dispute, fraud, or compliance review requires it. Access, retention, redaction, and disclosure remain purpose-bound.

An unreadable, rejected, reused, malicious, or unverified product image leaves the order in `PURCHASE_EVIDENCE_PENDING`. A catalog screenshot is not evidence that the ordered item was purchased.

For the MVP, the jastipper funds the purchase until final release. Early reimbursement is prohibited until DOKU confirms a safe, auditable partial or staged release contract.

## 5. Carry-my-item evidence

Required minimum evidence includes:

- declared item name, category, value, dimensions, weight, photos, ownership or purchase reference, and collection point;
- jastipper acceptance of contents and capacity;
- collection photo and timestamp;
- measured collection weight;
- documented variance and customer approval when the final charge changes;
- packaging and condition evidence;
- dispatch, tracking, delivery, or handover evidence.

The seller can reject the item before commitment or collection. Discovery of prohibited or materially misdeclared contents after commitment invokes the trust-and-safety workflow and does not require the seller to continue transport.

The order cannot become `COLLECTED` until collection photographs and measured weight are accepted. A material declared-versus-measured variance enters `WEIGHT_VARIANCE_PENDING`; the customer must approve the revised charge or use an eligible cancellation or dispute path before fulfilment continues.

## 6. Seller and customer order projections

The private jastipper workspace groups work by trip, store, and actionable status without becoming the source of truth. It includes requests awaiting acceptance, payment-pending orders, paid items to buy or collect, evidence-pending items, purchased or collected items, packing, transport, arrival, pickup or dispatch, cancellation, and dispute work.

The private customer workspace maps authoritative states into a plain-language timeline:

```text
Request submitted
  -> Accepted
  -> Awaiting payment
  -> Payment protected
  -> Purchasing or collecting
  -> Purchased or collected
  -> Packing
  -> In transit
  -> Arrived
  -> Local delivery or pickup
  -> Delivered
  -> Completed
```

Each view shows the expected next step, relevant accepted evidence, estimated arrival, delivery method, tracking or resi identifier when applicable, confirmation window, and dispute entry point. The public seller profile may show completed-trip and completed-order aggregates and verified reviews, never private order rows or evidence.

## 7. Delivery completion

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

## 8. Payment and release

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

## 9. Refunds and disputes

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
