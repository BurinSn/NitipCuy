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

## Approval

- [ ] Complete diff reviewed
- [ ] Hosted checks inspected on the exact immutable pull-request head
- [ ] Lifecycle documents reconciled against Git, GitHub, ADRs, and specialist sources
- [ ] Material findings resolved or dispositioned
- [ ] BurinSN product-owner merge approval received
