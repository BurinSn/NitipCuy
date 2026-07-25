# NitipCuy Changes

This file is append-only.

## 2026-07-25 - Product planning baseline created

- Products: NitipCuy
- Type: Product and commercial planning
- Status: Documentation complete; implementation not started
- Summary:
  - Established NitipCuy as a standalone BurinSN product using the verified `Cuy` naming pattern.
  - Accepted Shop for me and Carry my item as the two primary service modes.
  - Recorded trip-first discovery, public listing discussion, private order communication, address-before-commitment, seller location disclosure, pickup QR/OTP, logistics evidence, documented weight, and transaction-only reputation.
  - Accepted active marketplace risk scanning and severity-based enforcement, including immediate action for severe prohibited conduct.
  - Accepted transaction-fee monetization with no subscription and a provisional 3 percent, Rp15,000 minimum, Rp100,000 maximum fee.
  - Recorded DOKU as the conditional preferred Partner/Aggregator provider and QRIS plus selected VA as MVP rails.
  - Recorded DOKU fees, settlement, refund, chargeback, Hold, Split, seller-capital, reconciliation, and contract blockers.
  - Created the canonical roadmap, product specification, lifecycle, moderation model, DOKU evaluation, ADRs, learning record, README, contributor rules, and handoff.
- Validation:
  - Cross-checked the `Cuy` naming pattern against BCN's MampirCuy and NgantorCuy documentation.
  - DOKU facts are dated and linked to official DOKU sources.
  - No code, Git repository, provider account, external communication, payment movement, or deployment was created.
- Follow-up:
  - Prepare the DOKU questionnaire, research active Threads cases, define the pilot risk and cancellation boundaries, and evaluate Biteship.

## 2026-07-25 - Platform-first sequencing and repository creation

- Products: NitipCuy
- Type: Product sequencing and repository governance
- Status: Complete
- Summary:
  - Corrected the roadmap so platform development begins before additional Threads research.
  - Moved Threads to the public-beta acquisition, promotion, recruitment, and feature-feedback stage.
  - Established that DOKU, Biteship, legal-policy, and pilot-risk unknowns block real-money launch but do not block building against provider-independent mock ports.
  - Created the private `BurinSn/NitipCuy` GitHub repository using BurinSn's verified private-repository and `main`-branch convention.
  - Added baseline Git workflow, pull-request template, safe ignore rules, and canonical repository references.
- Validation:
  - Verified the authenticated GitHub user is `miclawrenceee`.
  - Verified all existing listed BurinSn product repositories are private and normally use `main`.
  - Verified `BurinSn/NitipCuy` did not exist before creation.
  - Initial baseline commit `70b4c96a0df486b70e626434338e0b20dec7df1f` was pushed to `main`.
  - Local `main`, local `origin/main`, GitHub `main`, and `git ls-remote` matched the exact baseline commit after push.
  - GitHub reported the canonical repository as private, unarchived, and using `main`.
- Follow-up:
  - Open the first architecture and application-scaffolding issue.
