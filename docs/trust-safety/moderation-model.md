# NitipCuy Trust and Safety Moderation Model

Status: Accepted direction, taxonomy and legal review pending

Last updated: 2026-07-25

## 1. Objective

NitipCuy must actively prevent the platform from becoming a discovery, payment, or coordination channel for prohibited, dangerous, fraudulent, or materially misdeclared transactions.

This control protects customers, jastippers, payment and logistics partners, BurinSN, and the platform's long-term reputation. It does not guarantee that an item is lawful for every route, jurisdiction, carrier, airline, port, or customs authority.

## 2. Detection layers

Risk scanning occurs at:

1. account registration and re-verification;
2. trip creation and material schedule or route changes;
3. product listing and open-request submission;
4. public discussion and private transaction communication;
5. seller acceptance;
6. payment attempt;
7. collection and purchase evidence upload;
8. weight, package, dispatch, tracking, delivery, refund, and dispute events;
9. user report and post-transaction review.

Signals may include structured category declarations, text and image classification, OCR, price and quantity anomalies, route restrictions, duplicate images, prohibited keywords, repeated reports, account links, bank and device risk, prior enforcement, and conflicting weight or package evidence.

Automated detection supports human review. It does not silently determine guilt for ambiguous cases.

## 3. Enforcement ladder

### Ambiguous or low-severity concern

- temporarily hide the content;
- warn the user;
- request a clearer declaration, receipt, photo, ownership evidence, or correction;
- restore only after the risk is resolved.

### Repeated or material violation

- issue an account strike;
- restrict listing, accepting orders, payment, withdrawal, or new-trip privileges;
- hold affected settlement while the transaction is investigated;
- suspend the account for a defined period;
- require re-verification or a corrective action.

### Severe or clearly prohibited conduct

- immediately remove content;
- stop payment or freeze release when legally and operationally permitted;
- suspend the user without waiting for earlier warnings;
- preserve relevant evidence and audit history;
- permanently ban the account for severe or repeated conduct;
- report or respond to competent authorities when legally required or justified by the incident.

An arbitrary monetary fine is not part of the accepted model. Administrative recovery, forfeiture, offset, or damages require explicit contractual and legal authority before implementation.

## 4. Due process

- Every enforcement action has a reason code, severity, evidence reference, actor, timestamp, duration, and affected capabilities.
- Users receive an understandable notice unless disclosure would compromise an investigation or legal obligation.
- Users can appeal within a defined window.
- Appeals are reviewed by a person who did not make the original discretionary decision when practical.
- Reversals remain in the audit record.
- Permanent bans include linked-account and re-entry controls, subject to proportionality and data-protection rules.

## 5. Transaction handling

Moderation distinguishes listing safety from financial allocation. Removing a listing does not automatically decide who receives held funds.

An affected order enters manual review. The resolution may include:

- release to the customer as a refund;
- release to the jastipper for a proven lawful and completed portion;
- partial allocation;
- continued hold where provider, legal, or dispute conditions require it;
- evidence preservation and escalation.

No moderator can alter the authoritative ledger without a reasoned, auditable financial command.

## 6. Policy work still required

- Route-aware prohibited and restricted-item taxonomy.
- Category-specific evidence requirements.
- Payment-provider and logistics-partner acceptable-use alignment.
- Maximum values, quantities, weights, and capacity by trust tier.
- Data-retention and disclosure rules.
- Emergency and competent-authority response procedure.
- Reviewer training and quality audit.
- False-positive, appeal, and repeat-offender metrics.
- Indonesian legal review of platform duties, consumer protection, electronic systems, payments, data protection, import, customs, and dangerous goods.
