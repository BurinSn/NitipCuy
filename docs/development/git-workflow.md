# NitipCuy Git and GitHub Workflow

Status: Accepted

Last updated: 2026-07-25

## Repository

- Canonical remote: `https://github.com/BurinSn/NitipCuy`
- Visibility: private
- Default branch: `main`
- Product owner: BurinSN

## Initial baseline

BurinSN explicitly authorized creation of the standalone repository on 2026-07-25. The initial documentation and governance package may be committed and pushed directly as the one-time repository baseline.

This exception does not authorize later direct feature work on `main`.

## Material work

1. Create a hosted issue with the material-change form, including objective, scope, exclusions, acceptance criteria, risk, validation, documentation impact, DRY scope/progress, and guarded-Strix applicability/progress.
2. Create a focused branch from current `main`.
3. Preserve unrelated and user-owned changes.
4. Implement code, tests, migrations, security controls, and required documentation together.
5. Update `handoff.md`, `docs/changes.md`, `docs/roadmap.md`, and `docs/learning.md` in every material pull request.
6. Run `scripts/check-lifecycle-docs.sh origin/main` plus all relevant local gates from `docs/development/quality-gates.md` and record exact results. When another session is active, also run `./scripts/check-base-freshness.sh origin/main merge` and `node scripts/check-canonical-blocks.mjs origin/main`.
7. Open a pull request using `.github/PULL_REQUEST_TEMPLATE.md`.
8. Review the complete base diff, finish the exact-head DRY review as `CLEAN` or `CLEAN WITH NOTES`, and resolve or explicitly disposition material findings.
9. Reconcile the linked issue and pull-request guarded-Strix state. A required assessment must reach `TRIAGED` or `REMEDIATION VERIFIED`; a non-required assessment needs a concrete rationale and the explicit not-applicable evidence state.
10. Verify hosted review-governance, lifecycle, and application-quality workflows on the exact immutable PR head as applicable.
11. Obtain fresh BurinSN product-owner approval after all review states, evidence, limitations, and hosted checks are visible.
12. Prefer squash merge for one coherent issue.
13. Verify post-merge `main` and clean up the merged branch.

## Branch names

Use a short type and hosted issue number:

```text
feat/<issue>-<slug>
fix/<issue>-<slug>
sec/<issue>-<slug>
docs/<issue>-<slug>
chore/<issue>-<slug>
```

## Commit and PR language

- Describe the technical or product change.
- Do not mention agents or who discovered an issue.
- Keep one coherent purpose per commit or squash result.
- Record verification honestly. Build success is not runtime, browser, payment, security, legal, or visual approval.

## Prohibited operations

- No force-push to `main`.
- No destructive reset or cleanup of unexpected work.
- No secrets in Git, issue bodies, pull requests, logs, or fixtures.
- No bypass of branch protection or required checks.
- No merge based solely on passing automation.
- No production deployment or external-provider activation implied by merge approval.

## Current repository-control limitation

GitHub returned `403` for branch-protection access because private-repository branch protection is unavailable on the current plan. Keep the repository private. Until that capability changes:

- the lifecycle workflow still runs on pull requests;
- a missing, skipped, or failed lifecycle result blocks merge by project policy;
- a missing, skipped, or failed review-governance result blocks merge by project policy;
- merge-button availability does not override the policy;
- fresh explicit BurinSN approval remains required after all checks and findings are visible;
- the handoff must record the exact check and approval state before merge.

## Parallel sessions

When two or more AI or human sessions work this repository at the same time on different issues, follow `docs/development/parallel-coordination.md` in addition to this document. Its non-negotiable rules:

- each session works in its own git worktree on its own branch (never two sessions in one working tree);
- each session owns exactly one issue and one branch with a disjoint file footprint where possible;
- a session rebases onto `origin/main` before requesting merge and re-records the exact-head DRY review on the new head;
- `handoff.md` and `docs/roadmap.md` are split into a canonical (merge-turn-only) block and a per-session append-only zone; only the designated merge-turn session edits the canonical block, after rebasing;
- agents never merge; BurinSN is the sole merge authority and merges one pull request at a time;
- after each merge, every other active session runs the rebase cascade and re-verifies.

The `check-base-freshness.sh` and `check-canonical-blocks.mjs` gates enforce the base-freshness and canonical-edit rules; the hosted lifecycle workflow runs both on the exact PR head.
