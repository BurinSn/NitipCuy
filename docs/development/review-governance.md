# NitipCuy DRY and Guarded Strix Review Governance

Status: Accepted project policy

Last reviewed: 2026-08-07

## 1. Purpose and authority

This document owns the review-evidence contract for material NitipCuy issues and pull requests. It makes two different review streams visible without pretending that they provide the same evidence:

- DRY review inspects duplicated authority, business knowledge, schemas, security policy, and behavior in the exact code or documentation change.
- Guarded Strix review performs authorized adversarial testing against one exact owned local or staging target when the issue's attack surface warrants it.

Neither stream replaces the complete-diff review, normal tests, dependency audit, lifecycle review, owner approval, provider review, runtime verification, or production approval.

## 2. One versioned evidence contract

Every material issue records `Review governance schema: v1`. Every pull request uses the marker:

```text
<!-- nitipcuy-review-governance:v1 -->
```

The material-change issue form is the starting record. A pull request must contain exactly one standalone `Closes #<issue>` line so the read-only workflow can retrieve and compare its governed issue.

The issue and pull request must agree on:

- DRY review status;
- Strix applicability;
- Strix review status;
- Strix target class.

The executable status vocabulary in `scripts/check-review-governance.mjs` is authoritative. Adversarial tests require the issue-form options to match it exactly; the templates and this document present that same contract for humans.

Editing a PR body reruns the workflow. If the code head changes, the DRY review's full 40-character reviewed revision becomes stale and the workflow fails until the exact new head is reviewed and recorded.

Editing only the linked issue does not attach a new check to the pull request. Update the issue first, then edit or re-save the PR body so the workflow revalidates the pair. Before owner approval, inspect both live bodies even when the last check is green.

## 3. DRY review gate

Every material pull request receives a `review-code-dryness` pass over the complete base diff. Trace changed authority-bearing symbols to nearby callers, schemas, tests, configuration, and parallel implementations. Generated code, immutable migrations, vendored code, snapshots, and fixtures are excluded from clone detection unless the issue explicitly includes them, but their contracts still remain review context.

Classify repeated code by risk:

1. duplicated authority;
2. duplicated knowledge;
3. duplicated behavior;
4. structural duplication;
5. textual duplication.

Separate validation at application, adapter, provider, and database trust boundaries may remain intentionally duplicated. Reducing line count is not a reason to weaken defense in depth.

Issue progress states:

- `NOT STARTED`
- `IN PROGRESS`
- `CHANGES REQUIRED`
- `CLEAN WITH NOTES`
- `CLEAN`

Only `CLEAN WITH NOTES` and `CLEAN` are merge-eligible. The PR records:

- exact reviewed scope;
- the immutable 40-character PR-head SHA;
- concrete findings or the clean conclusion;
- report/evidence and important intentional duplication retained.

A new commit invalidates the recorded review revision. Material findings are fixed or explicitly dispositioned before the final verdict; `CHANGES REQUIRED` never passes.

A rebase onto a moved `main` also invalidates the recorded 40-character PR-head SHA and fails this workflow until the new head is reviewed and recorded. Under parallel work, the rebase cascade, the re-pin (clean rebase) versus scoped re-review (conflict rebase) procedure, and the cascade-cost bounds live in `docs/development/parallel-coordination.md`; this document does not duplicate them.

## 4. Strix applicability gate

Strix is not a routine build command and is never launched by GitHub Actions. The issue owner classifies it:

- `REQUIRED`: the change creates or materially changes an executable attack surface where guarded adversarial testing is proportionate, and the selected exact owned target can exercise it.
- `NOT REQUIRED`: the change has no meaningful runnable target for Strix, or narrower hostile source/static review is proportionate. The issue must explain why.

Examples that normally require Strix consideration include authentication and recovery, authorization, private-data access, uploads, provider callbacks, payments, administrative or moderation actions, externally reachable parsing, and deployment/security-boundary changes. Documentation-only, template-only, or pure policy changes commonly remain `NOT REQUIRED`, but never by default or without a rationale.

Target classes are `LOCAL REPOSITORY`, `LOCAL APPLICATION`, `STAGING APPLICATION`, `PRODUCTION APPLICATION`, or `NO TARGET`. A target class is planning metadata, not authority to test a target.

## 5. Guarded Strix lifecycle

When Strix is required, progress uses:

```text
NOT STARTED
  -> AUTHORIZATION REQUIRED
  -> AUTHORIZED
  -> PLAN REVIEWED
  -> EXECUTED
  -> TRIAGED
  -> REMEDIATION VERIFIED
```

`TRIAGED` and `REMEDIATION VERIFIED` are the only merge-eligible required-review states. `TRIAGED` may be final when the guarded run has no confirmed finding or all findings are safely dispositioned. Use `REMEDIATION VERIFIED` when confirmed findings required fixes and independent verification.

Execution rules remain non-negotiable:

1. use only `/Users/miclawrencee/Workspace/ProTools/security/strix-guard/guard.ts` through the `use-strix-security-testing` skill;
2. establish the exact owned target, project, environment, allowed modes, expiry, and maximum budget;
3. obtain current explicit authority before creating the narrow authorization record;
4. show and review the guard's dry-run plan;
5. execute only after a separate instruction to run;
6. obtain a second current approval for production;
7. independently reproduce and classify every finding;
8. never auto-apply Strix-generated commands, PoCs, patches, or fixes.

The PR records the authorization ID, plan evidence, mode, scope mode, budget, tested revision, execution/run reference, findings and triage, report path, independent verification, and separate production approval when applicable. The tested revision must match the exact PR head. Target class and environment must agree, and the declared budget must be greater than USD 0 and no more than the guard's USD 25 ceiling. Never record credentials, tokens, cookies, private data, or secrets.

When Strix is not required, the final issue and PR combination is:

```text
Applicability: NOT REQUIRED
Status: NOT APPLICABLE
Target class: NO TARGET
Target: NONE
Environment: NONE
Tested revision: NOT RUN
Mode: NOT CREATED
Scope mode: NOT CREATED
Budget: NOT CREATED
Authorization: NOT CREATED
Plan: NOT CREATED
Execution: NOT RUN
Production approval: NOT APPLICABLE
```

The rationale, hostile source review, and other security evidence still remain mandatory.

As verified against GitHub's primary documentation on 2026-08-07, [issue forms remain public preview](https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/syntax-for-issue-forms) and [form-level `required` enforcement applies only to public repositories](https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/syntax-for-githubs-form-schema). NitipCuy is private, so the pull-request validator is the fail-closed enforcement point for missing or contradictory issue fields; maintainers must still inspect the issue when it is created.

## 6. Automated enforcement and limits

The `Review governance` pull-request workflow:

- uses read-only contents, issue, and pull-request permissions;
- tests the dependency-free validator;
- loads only the single linked issue through the GitHub API;
- checks required fields, status consistency, final review states, and exact DRY review head;
- writes the parsed progress to the GitHub step summary;
- never invokes Strix, creates authorization, handles credentials, or changes an issue or PR.

The workflow validates declared evidence, not its truth. A green result does not prove that the review was competent, that a Strix report is genuine, that findings are correctly triaged, or that the application is secure. Exact artifacts and claims still receive human hostile review before owner approval.
