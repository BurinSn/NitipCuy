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

1. Create a hosted issue containing objective, scope, exclusions, acceptance criteria, risk, validation, and documentation impact.
2. Create a focused branch from current `main`.
3. Preserve unrelated and user-owned changes.
4. Implement code, tests, migrations, security controls, and required documentation together.
5. Run relevant local quality gates and record exact results.
6. Open a pull request using `.github/PULL_REQUEST_TEMPLATE.md`.
7. Review the complete base diff and resolve or explicitly disposition material findings.
8. Obtain fresh BurinSN product-owner approval before merge.
9. Prefer squash merge for one coherent issue.
10. Verify post-merge `main` and clean up the merged branch.

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
