<!-- nitipcuy-review-governance:v1 -->

Closes #ISSUE_NUMBER

## Objective

Describe the user or system outcome.

## Scope

- Describe the bounded work included.

## Exclusions

- Describe deliberately excluded work.

## Changes

- Describe the material changes.

## Risk and security

- Describe relevant risks and controls.

## DRY review

- Status: NOT STARTED
- Scope: Describe the exact base diff and authority-bearing areas reviewed.
- Reviewed revision: HEAD_SHA
- Findings: Describe actionable findings or state why none remain.
- Evidence: Link or summarize the exact review report and intentional duplication retained.

## Guarded Strix security review

- Applicability: REQUIRED or NOT REQUIRED
- Status: NOT STARTED
- Target class: LOCAL REPOSITORY, LOCAL APPLICATION, STAGING APPLICATION, PRODUCTION APPLICATION, or NO TARGET
- Target: Exact authorized path/URL, or NONE
- Environment: LOCAL, STAGING, PRODUCTION, or NONE
- Tested revision: Full 40-character Git SHA, or NOT RUN
- Mode: QUICK, STANDARD, or NOT CREATED
- Scope mode: DIFF, FULL, or NOT CREATED
- Budget: USD amount, or NOT CREATED
- Authorization: Guard authorization ID/evidence, or NOT CREATED
- Plan: Reviewed mode/scope/budget evidence, or NOT CREATED
- Execution: Tested revision/run evidence, or NOT RUN
- Findings: Triage/remediation summary, or concrete non-applicability statement
- Evidence: Guard report and independent verification, or linked-issue rationale
- Production approval: Separate production approval evidence, or NOT APPLICABLE

## Validation

```text
command
result
```

## Documentation

- [ ] `handoff.md` updated with verified current state and exact next action
- [ ] `docs/changes.md` appended with material changes and validation
- [ ] `docs/roadmap.md` refreshed even when scope/order is unchanged
- [ ] `docs/learning.md` appended with learning, correction, failure, deferral, or explicit no-new-learning
- [ ] Relevant specialist documents
- [ ] `scripts/check-lifecycle-docs.sh origin/main` passed
- [ ] `pnpm check` passed when application or toolchain code changed
- [ ] `pnpm audit:prod` passed when dependencies or application code changed
- [ ] Review-governance issue and PR states match
- [ ] Review-governance workflow passed on the exact immutable pull-request head

## Approval

- [ ] Complete diff reviewed
- [ ] Hosted checks inspected on the exact immutable pull-request head
- [ ] Lifecycle documents reconciled against Git, GitHub, ADRs, and specialist sources
- [ ] Material findings resolved or dispositioned
- [ ] BurinSN product-owner merge approval received
