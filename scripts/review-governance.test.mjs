import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  DRY_STATUS_VALUES,
  REVIEW_GOVERNANCE_MARKER,
  STRIX_APPLICABILITY_VALUES,
  STRIX_STATUS_VALUES,
  STRIX_TARGET_CLASS_VALUES,
  linkedIssueNumbers,
  validateReviewGovernance,
} from "./check-review-governance.mjs";

const HEAD = "1234567890abcdef1234567890abcdef12345678";

function issueFormOptions(source, id) {
  const lines = source.split("\n");
  const idLine = lines.findIndex((line) => line.trim() === `id: ${id}`);
  assert.notEqual(idLine, -1, `missing issue form id ${id}`);
  const optionsLine = lines.findIndex(
    (line, index) => index > idLine && line.trim() === "options:",
  );
  assert.notEqual(optionsLine, -1, `missing options for ${id}`);

  const options = [];
  for (let index = optionsLine + 1; index < lines.length; index += 1) {
    const match = /^\s{8}- (.+)$/.exec(lines[index]);
    if (match) {
      options.push(match[1]);
      continue;
    }
    if (lines[index].trim() === "validations:") {
      break;
    }
  }
  return options;
}

function issueBody({
  dryStatus = "CLEAN WITH NOTES",
  applicability = "NOT REQUIRED",
  strixStatus = "NOT APPLICABLE",
  targetClass = "NO TARGET",
} = {}) {
  return `${REVIEW_GOVERNANCE_MARKER}

## Review progress

### Review governance schema

v1

### DRY review status

${dryStatus}

### DRY review scope

Complete origin/main diff and all authority-bearing review policy.

### Strix applicability

${applicability}

### Strix review status

${strixStatus}

### Strix target class

${targetClass}

### Strix rationale

The change has no runnable application target and receives hostile source review.
`;
}

function prBody({
  dryStatus = "CLEAN WITH NOTES",
  reviewedRevision = HEAD,
  applicability = "NOT REQUIRED",
  strixStatus = "NOT APPLICABLE",
  targetClass = "NO TARGET",
  target = "NONE",
  environment = "NONE",
  testedRevision = "NOT RUN",
  mode = "NOT CREATED",
  scopeMode = "NOT CREATED",
  budget = "NOT CREATED",
  authorization = "NOT CREATED",
  plan = "NOT CREATED",
  execution = "NOT RUN",
  productionApproval = "NOT APPLICABLE",
} = {}) {
  return `${REVIEW_GOVERNANCE_MARKER}

Closes #7

## DRY review

- Status: ${dryStatus}
- Scope: Complete origin/main diff and all authority-bearing review policy.
- Reviewed revision: ${reviewedRevision}
- Findings: No actionable duplicated authority remains after complete review.
- Evidence: Review report records exact files and retained trust-boundary duplication.

## Guarded Strix security review

- Applicability: ${applicability}
- Status: ${strixStatus}
- Target class: ${targetClass}
- Target: ${target}
- Environment: ${environment}
- Tested revision: ${testedRevision}
- Mode: ${mode}
- Scope mode: ${scopeMode}
- Budget: ${budget}
- Authorization: ${authorization}
- Plan: ${plan}
- Execution: ${execution}
- Findings: No scanner finding exists; applicability rationale is recorded in issue #7.
- Evidence: Issue #7 and the hostile source review record this bounded conclusion.
- Production approval: ${productionApproval}
`;
}

test("accepts a final DRY review with justified Strix non-applicability", () => {
  const result = validateReviewGovernance({
    issueBody: issueBody(),
    issueNumber: 7,
    prBody: prBody(),
    headSha: HEAD,
  });
  assert.deepEqual(result.errors, []);
});

test("keeps issue-form status options synchronized with validator authority", async () => {
  const source = await readFile(
    new URL("../.github/ISSUE_TEMPLATE/material-change.yml", import.meta.url),
    "utf8",
  );
  assert.deepEqual(issueFormOptions(source, "dry_status"), DRY_STATUS_VALUES);
  assert.deepEqual(
    issueFormOptions(source, "strix_applicability"),
    STRIX_APPLICABILITY_VALUES,
  );
  assert.deepEqual(
    issueFormOptions(source, "strix_status"),
    STRIX_STATUS_VALUES,
  );
  assert.deepEqual(
    issueFormOptions(source, "strix_target_class"),
    STRIX_TARGET_CLASS_VALUES,
  );
});

test("accepts a required local Strix review after triage", () => {
  const result = validateReviewGovernance({
    issueBody: issueBody({
      dryStatus: "CLEAN",
      applicability: "REQUIRED",
      strixStatus: "TRIAGED",
      targetClass: "LOCAL APPLICATION",
    }),
    issueNumber: 7,
    prBody: prBody({
      dryStatus: "CLEAN",
      applicability: "REQUIRED",
      strixStatus: "TRIAGED",
      targetClass: "LOCAL APPLICATION",
      target: "http://127.0.0.1:3100",
      environment: "LOCAL",
      testedRevision: HEAD,
      mode: "QUICK",
      scopeMode: "DIFF",
      budget: "USD 5",
      authorization: "strix-auth-123 reviewed for issue 7",
      plan: "quick diff mode, USD 5 budget, reviewed",
      execution: "run-123 completed against the reviewed revision",
    }),
    headSha: HEAD,
  });
  assert.deepEqual(result.errors, []);
});

test("rejects an unfinished DRY review", () => {
  const result = validateReviewGovernance({
    issueBody: issueBody({ dryStatus: "IN PROGRESS" }),
    issueNumber: 7,
    prBody: prBody({ dryStatus: "IN PROGRESS" }),
    headSha: HEAD,
  });
  assert.match(result.errors.join("\n"), /must finish as/);
});

test("rejects a DRY review pinned to a stale revision", () => {
  const result = validateReviewGovernance({
    issueBody: issueBody(),
    issueNumber: 7,
    prBody: prBody({
      reviewedRevision: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    }),
    headSha: HEAD,
  });
  assert.match(result.errors.join("\n"), /does not match/);
});

test("rejects required Strix work before triage", () => {
  const result = validateReviewGovernance({
    issueBody: issueBody({
      applicability: "REQUIRED",
      strixStatus: "PLAN REVIEWED",
      targetClass: "LOCAL APPLICATION",
    }),
    issueNumber: 7,
    prBody: prBody({
      applicability: "REQUIRED",
      strixStatus: "PLAN REVIEWED",
      targetClass: "LOCAL APPLICATION",
      target: "http://127.0.0.1:3100",
      environment: "LOCAL",
      testedRevision: HEAD,
      mode: "QUICK",
      scopeMode: "DIFF",
      budget: "USD 5",
      authorization: "strix-auth-123 reviewed for issue 7",
      plan: "quick diff mode, USD 5 budget, reviewed",
      execution: "run is awaiting separate execution approval",
    }),
    headSha: HEAD,
  });
  assert.match(result.errors.join("\n"), /must reach `TRIAGED`/);
});

test("rejects missing guarded authorization evidence", () => {
  const result = validateReviewGovernance({
    issueBody: issueBody({
      applicability: "REQUIRED",
      strixStatus: "TRIAGED",
      targetClass: "LOCAL APPLICATION",
    }),
    issueNumber: 7,
    prBody: prBody({
      applicability: "REQUIRED",
      strixStatus: "TRIAGED",
      targetClass: "LOCAL APPLICATION",
      target: "http://127.0.0.1:3100",
      environment: "LOCAL",
      testedRevision: HEAD,
      mode: "QUICK",
      scopeMode: "DIFF",
      budget: "USD 5",
      authorization: "TBD",
      plan: "quick diff mode, USD 5 budget, reviewed",
      execution: "run-123 completed against the reviewed revision",
    }),
    headSha: HEAD,
  });
  assert.match(result.errors.join("\n"), /authorization.*concrete/i);
});

test("rejects issue and PR progress drift", () => {
  const result = validateReviewGovernance({
    issueBody: issueBody({ dryStatus: "CLEAN" }),
    issueNumber: 7,
    prBody: prBody({ dryStatus: "CLEAN WITH NOTES" }),
    headSha: HEAD,
  });
  assert.match(result.errors.join("\n"), /DRY statuses must match/);
});

test("rejects inconsistent non-required Strix evidence", () => {
  const result = validateReviewGovernance({
    issueBody: issueBody(),
    issueNumber: 7,
    prBody: prBody({ environment: "LOCAL" }),
    headSha: HEAD,
  });
  assert.match(result.errors.join("\n"), /environment as `NONE`/);
});

test("requires exactly one standalone closing issue", () => {
  assert.deepEqual(linkedIssueNumbers("Closes #7\n\nFixes #8"), [7, 8]);
  const result = validateReviewGovernance({
    issueBody: issueBody(),
    issueNumber: 7,
    prBody: `${prBody()}\nFixes #8\n`,
    headSha: HEAD,
  });
  assert.match(result.errors.join("\n"), /exactly one standalone/);
});

test("rejects duplicate closing lines for the same issue", () => {
  const result = validateReviewGovernance({
    issueBody: issueBody(),
    issueNumber: 7,
    prBody: `${prBody()}\nFixes #7\n`,
    headSha: HEAD,
  });
  assert.match(result.errors.join("\n"), /exactly one standalone/);
});

test("ignores closing references hidden inside fenced code", () => {
  const fenced = prBody().replace("Closes #7", "```text\nCloses #7\n```");
  assert.deepEqual(linkedIssueNumbers(fenced), []);
  const result = validateReviewGovernance({
    issueBody: issueBody(),
    issueNumber: 7,
    prBody: fenced,
    headSha: HEAD,
  });
  assert.match(result.errors.join("\n"), /exactly one standalone/);
});

test("rejects duplicate governed headings", () => {
  const result = validateReviewGovernance({
    issueBody: `${issueBody()}\n### DRY review status\n\nCLEAN\n`,
    issueNumber: 7,
    prBody: prBody(),
    headSha: HEAD,
  });
  assert.match(result.errors.join("\n"), /Duplicate `### DRY/);
});

test("rejects a Strix target and environment mismatch", () => {
  const result = validateReviewGovernance({
    issueBody: issueBody({
      applicability: "REQUIRED",
      strixStatus: "TRIAGED",
      targetClass: "STAGING APPLICATION",
    }),
    issueNumber: 7,
    prBody: prBody({
      applicability: "REQUIRED",
      strixStatus: "TRIAGED",
      targetClass: "STAGING APPLICATION",
      target: "https://staging.example.invalid",
      environment: "LOCAL",
      testedRevision: HEAD,
      mode: "QUICK",
      scopeMode: "DIFF",
      budget: "USD 5",
      authorization: "strix-auth-123 reviewed for issue 7",
      plan: "quick diff mode, USD 5 budget, reviewed",
      execution: "run-123 completed against the reviewed revision",
    }),
    headSha: HEAD,
  });
  assert.match(result.errors.join("\n"), /requires environment `STAGING`/);
});

test("rejects a Strix budget above the guard ceiling", () => {
  const result = validateReviewGovernance({
    issueBody: issueBody({
      applicability: "REQUIRED",
      strixStatus: "TRIAGED",
      targetClass: "LOCAL APPLICATION",
    }),
    issueNumber: 7,
    prBody: prBody({
      applicability: "REQUIRED",
      strixStatus: "TRIAGED",
      targetClass: "LOCAL APPLICATION",
      target: "http://127.0.0.1:3100",
      environment: "LOCAL",
      testedRevision: HEAD,
      mode: "QUICK",
      scopeMode: "DIFF",
      budget: "USD 25.01",
      authorization: "strix-auth-123 reviewed for issue 7",
      plan: "quick diff mode, USD 25.01 budget, reviewed",
      execution: "run-123 completed against the reviewed revision",
    }),
    headSha: HEAD,
  });
  assert.match(result.errors.join("\n"), /at most 25/);
});

test("rejects required Strix evidence pinned to a stale revision", () => {
  const result = validateReviewGovernance({
    issueBody: issueBody({
      applicability: "REQUIRED",
      strixStatus: "TRIAGED",
      targetClass: "LOCAL APPLICATION",
    }),
    issueNumber: 7,
    prBody: prBody({
      applicability: "REQUIRED",
      strixStatus: "TRIAGED",
      targetClass: "LOCAL APPLICATION",
      target: "http://127.0.0.1:3100",
      environment: "LOCAL",
      testedRevision: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      mode: "QUICK",
      scopeMode: "DIFF",
      budget: "USD 5",
      authorization: "strix-auth-123 reviewed for issue 7",
      plan: "quick diff mode, USD 5 budget, reviewed",
      execution: "run-123 completed against the reviewed revision",
    }),
    headSha: HEAD,
  });
  assert.match(
    result.errors.join("\n"),
    /Strix tested revision does not match/,
  );
});

test("rejects a missing issue schema", () => {
  const result = validateReviewGovernance({
    issueBody: issueBody().replace("v1\n\n### DRY", "\n### DRY"),
    issueNumber: 7,
    prBody: prBody(),
    headSha: HEAD,
  });
  assert.match(result.errors.join("\n"), /schema/);
});
