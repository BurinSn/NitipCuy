# NitipCuy Master Product Specification

Status: Accepted product foundation

Last updated: 2026-07-28

## 1. Objective

NitipCuy gives independent jastippers a purpose-built place to publish trips, routes, available capacity, products, request terms, fees, and fulfilment expectations, while giving customers a searchable and evidence-backed transaction experience.

The platform is not intended to become an inter-country merchant. It enables people who already want to offer jastip services to find an audience and conduct the activity with clearer terms, payment protection, fulfilment evidence, moderation, and reputation.

## 2. Primary roles

### Customer

A customer may:

- search by origin, destination, service dates, ordering-open and ordering-close times, transport departure, arrival estimate, category, delivery method, seller location, rating, and remaining capacity;
- purchase a listed product or submit an open request;
- request transport for an item they already own or have purchased;
- ask public questions on the relevant trip, product, or request;
- use private chat for personal or order-specific details;
- provide a private delivery address when committing to an order;
- pay through the platform;
- review transaction evidence, confirm delivery, open a dispute, and submit a post-completion review.

### Jastipper

A jastipper may:

- create a verified personal or business profile;
- publish a trip with origin, destination, source-service window, ordering window, transport departure, location, capacity, and estimated arrival;
- list products or declare that requests are open;
- define item, service, weight, minimum-order, maximum-capacity, pickup, and delivery terms;
- accept or reject a customer request before commitment;
- reject prohibited, unsafe, suspicious, undeclared, or impractical items;
- provide purchase, collection, weight, transport, dispatch, and delivery evidence;
- receive settlement after the release conditions are satisfied;
- build reputation from completed platform transactions.

A person may act in both roles, but permissions, evidence, balances, reviews, and disputes remain transaction-role specific.

## 3. Service modes

### Shop for me

The jastipper acquires an item on the customer's behalf. A trip can contain:

- prelisted products;
- open product requests;
- fixed or formula-based service fees;
- quantity, store, budget, variation, substitution, and purchase-deadline terms;
- a mandatory photograph of the actual purchased product before the order can be marked purchased;
- optional private receipt or store evidence only for an explicitly actual-cost-based pricing contract or a proportionate dispute, fraud, or compliance review;
- expected arrival and final local-delivery method.

The seller sets the final item price and service rate. NitipCuy does not mandate the item's selling price, jastip fee, acquisition-cost disclosure, or margin. For a fixed-price order, the customer agrees to the final price before payment and does not receive the seller's underlying receipt as routine evidence. A seller who voluntarily offers actual cost plus a service fee must disclose that formula and its cost-evidence rule before commitment.

### Carry my item

The customer already owns or has arranged the item. The jastipper may collect or receive it and carry it along the declared route.

Terms can include:

- collection point and deadline;
- declared contents, category, value, dimensions, initial weight, and photos;
- price per kilogram, volumetric or special-handling terms;
- minimum charge and maximum accepted weight or volume;
- documented reweighing and customer approval when measured values differ;
- destination handover or domestic-delivery method.

## 4. Discovery and communication

Discovery is trip-first and destination-aware. Search must answer:

- Who is going where?
- When do requests close?
- When do requests open?
- What can they buy or carry?
- How do they calculate their charge?
- Where are they located before and after the trip?
- How will the item reach the customer?
- What capacity remains?
- What evidence and protection apply?

Every trip, product, and open request can have a public discussion thread. Public discussion is for reusable questions such as availability, store access, sizing, packaging, weight rules, customs restrictions, and schedule changes.

Private chat remains available for personal information, address details, receipts containing private data, disputes, and other order-specific communication. Customer addresses and identity records are never public.

### Ordering-window and trip-history rules

A trip offer carries distinct, timezone-explicit instants:

- `serviceWindowStartAt`: when the jastipper expects to become available at the source location;
- `serviceWindowEndAt`: when source purchase or collection availability ends;
- `orderOpenAt`: when customers may begin submitting orders;
- `orderCloseAt`: when new orders stop;
- `transportDepartureAt`: when the jastipper expects to leave the source route with accepted items;
- `estimatedArrivalAt`: when the accepted items are expected at the destination.

Advance PO is supported: `orderOpenAt` may occur before `serviceWindowStartAt`. The ordering window must still close no later than the source-service cutoff and before transport departure.

New-order eligibility is server-authoritative. The platform rejects a new request or checkout when the ordering window is not open, capacity is unavailable, the jastipper or offer is ineligible, or trust-and-safety action blocks it. Disabling a button is only presentation and is never the guardrail.

Closing an offer does not delete it and does not cancel accepted orders. The offer remains publicly visible as read-only history on the jastipper profile. It can become archived only after the trip has completed and every related order is in an eligible terminal state, including dispute and settlement handling. Public history never exposes customer identities, addresses, private item details, private evidence, or order communication.

## 5. Commitment and delivery terms

Before a paid commitment:

- the jastipper discloses their relevant location;
- the customer provides a private destination address or confirms pickup;
- the platform presents the agreed seller charge, estimated domestic delivery charge or calculation basis, payment fee, platform fee, deadlines, cancellation rules, and evidence requirements;
- fixed-price Shop for me terms do not imply acquisition-cost or margin disclosure;
- both parties see whether fulfilment ends by self-pickup or third-party logistics.

Self-pickup uses a platform-generated QR code with OTP fallback. Third-party delivery records the provider, service, tracking or resi identifier, dispatch evidence, and delivery status. Biteship is the preferred integration candidate but remains unapproved until a separate commercial and technical evaluation.

## 6. Order workspaces and progress

The jastipper receives a private order workspace grouped by trip, store, and actionable status. It must make requests awaiting acceptance, payment-pending orders, paid items to buy or collect, evidence-pending items, purchased or collected items, packing, transport, arrival, pickup, delivery, cancellation, and dispute work easy to distinguish.

For Shop for me, an order cannot move from purchase in progress to purchased until the platform accepts a photograph of the actual purchased product associated with that order. The photograph records the item, quantity, variation, visible condition, platform timestamp, and server-observed evidence identity. A catalog screenshot or reused listing image is not valid purchase evidence.

For Carry my item, an order cannot move to collected until the platform accepts collection photographs and measured weight. A material weight, condition, or charge variance enters a pending state and requires customer approval or an eligible cancellation or dispute path.

The customer receives a private order workspace showing a plain-language timeline, expected next action, evidence made available to them, arrival estimate, pickup or delivery method, tracking or resi identifier when applicable, confirmation controls, and dispute controls.

Customer-facing progress may summarize detailed internal states, but it cannot invent success. `Purchased`, `Collected`, `Dispatched`, `Delivered`, and `Completed` require their corresponding authoritative transition and evidence.

## 7. Commercial model

- No buyer or seller subscription.
- Jastippers independently set their rates.
- NitipCuy earns a platform protection fee on platform transactions.
- The provisional fee is 3 percent, minimum Rp15,000 and maximum Rp100,000 per protected order.
- Third-party payment, payout, insurance, and logistics charges are pass-through costs, not NitipCuy revenue, unless BurinSN later approves a different disclosed model.
- Off-platform payment is not protected and cannot generate a verified transaction review.

The provisional platform fee is valid for planning only. It must be revalidated after DOKU provides Partner, Hold, Split, reserve, and payout pricing and after pilot support and dispute costs are measured.

## 8. Trust, evidence, and reputation

- Payment requires an active verified seller.
- Identity, liveness, bank ownership, contact verification, device and risk signals, and seller history contribute to trust status.
- Listings and requests are scanned before publication and throughout the order lifecycle.
- Purchase, collection, weight, dispatch, pickup, delivery, cancellation, refund, and dispute events produce timestamped evidence.
- A file hash proves the identity and integrity of accepted evidence bytes; it does not by itself prove purchase authenticity, price, payment status, ownership, or legal contents.
- Only participants in a completed platform order can review each other.
- Ratings must separate useful dimensions such as communication, accuracy, condition, timeliness, and overall experience.
- Reviews may be challenged for fraud, harassment, irrelevance, or prohibited content, but not merely because they are negative.

The binding enforcement model is in `docs/trust-safety/moderation-model.md`.

## 9. Payment direction

DOKU is the conditional preferred provider through its Partner/Aggregator, Hold and Release, and Split Settlement capabilities.

MVP payment rails are QRIS and selected Virtual Accounts. Cards, PayLater, and convenience-store payments remain disabled until their cost, refund, chargeback, settlement, and Hold plus Split behavior is explicitly approved.

The internal financial model must be provider-independent and use an auditable ledger. A successful browser redirect or payment webhook is not proof that the correct split, release, refund, or seller settlement completed.

## 10. Explicit non-goals for the first release

- Becoming the legal merchant or importer for goods sold by jastippers.
- Providing customs brokerage or guaranteeing customs clearance.
- Setting a mandatory market price for a product, kilogram, trip, or service.
- Subscription plans, paid listing boosts, or advertising monetization.
- Unprotected cash or off-platform settlement.
- International remittance to foreign seller accounts.
- Supporting every DOKU payment method.
- Automatically deciding complex legal or customs classifications without human review.
- Releasing purchase principal early before a documented and provider-supported partial-release model exists.

## 11. Open product decisions

- Exact category and route launch scope.
- Maximum protected order value and seller capacity by trust tier.
- Cancellation allocations after purchase evidence exists.
- Buyer confirmation and auto-release windows by delivery method.
- Insurance requirements and liability caps.
- Biteship commercial and technical fit.
- DOKU Partner contract, maximum hold duration, supported Hold plus Split channels, partial release, reserve, and custom fees.
- Pilot geography, participant count, and operational support hours.
