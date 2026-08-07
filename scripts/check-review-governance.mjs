#!/usr/bin/env node

import { appendFile, readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

export const REVIEW_GOVERNANCE_MARKER =
  "<!-- nitipcuy-review-governance:v1 -->";

export const DRY_STATUS_VALUES = Object.freeze([
  "NOT STARTED",
  "IN PROGRESS",
  "CHANGES REQUIRED",
  "CLEAN WITH NOTES",
  "CLEAN",
]);
const DRY_STATUSES = new Set(DRY_STATUS_VALUES);
const FINAL_DRY_STATUSES = new Set(["CLEAN WITH NOTES", "CLEAN"]);
export const STRIX_APPLICABILITY_VALUES = Object.freeze([
  "REQUIRED",
  "NOT REQUIRED",
]);
const STRIX_APPLICABILITY = new Set(STRIX_APPLICABILITY_VALUES);
export const STRIX_STATUS_VALUES = Object.freeze([
  "NOT STARTED",
  "AUTHORIZATION REQUIRED",
  "AUTHORIZED",
  "PLAN REVIEWED",
  "EXECUTED",
  "TRIAGED",
  "REMEDIATION VERIFIED",
  "NOT APPLICABLE",
]);
const STRIX_STATUSES = new Set(STRIX_STATUS_VALUES);
const FINAL_STRIX_STATUSES = new Set(["TRIAGED", "REMEDIATION VERIFIED"]);
export const STRIX_TARGET_CLASS_VALUES = Object.freeze([
  "LOCAL REPOSITORY",
  "LOCAL APPLICATION",
  "STAGING APPLICATION",
  "PRODUCTION APPLICATION",
  "NO TARGET",
]);
const STRIX_TARGET_CLASSES = new Set(STRIX_TARGET_CLASS_VALUES);
export const STRIX_ENVIRONMENT_VALUES = Object.freeze([
  "LOCAL",
  "STAGING",
  "PRODUCTION",
  "NONE",
]);
const STRIX_ENVIRONMENTS = new Set(STRIX_ENVIRONMENT_VALUES);
const STRIX_MODES = new Set(["QUICK", "STANDARD"]);
const STRIX_SCOPE_MODES = new Set(["DIFF", "FULL"]);
const STRIX_TARGET_ENVIRONMENTS = new Map([
  ["LOCAL REPOSITORY", "LOCAL"],
  ["LOCAL APPLICATION", "LOCAL"],
  ["STAGING APPLICATION", "STAGING"],
  ["PRODUCTION APPLICATION", "PRODUCTION"],
]);
const PLACEHOLDERS = new Set([
  "",
  "...",
  "HEAD_SHA",
  "ISSUE_NUMBER",
  "NONE",
  "NOT APPLICABLE",
  "NOT CREATED",
  "NOT RUN",
  "TBD",
  "TODO",
]);

function normalize(value) {
  return value.trim().replace(/\s+/g, " ").toUpperCase();
}

function markdownLinesOutsideFences(body) {
  let fenceCharacter;
  let fenceLength = 0;

  return body
    .replaceAll("\r\n", "\n")
    .split("\n")
    .map((line) => {
      const token = /^\s*(`{3,}|~{3,})/.exec(line)?.[1];
      if (!fenceCharacter && token) {
        fenceCharacter = token[0];
        fenceLength = token.length;
        return "";
      }
      if (fenceCharacter) {
        if (
          token?.[0] === fenceCharacter &&
          token.length >= fenceLength &&
          line.trim() === token
        ) {
          fenceCharacter = undefined;
          fenceLength = 0;
        }
        return "";
      }
      return line;
    });
}

function governedSource(body) {
  return markdownLinesOutsideFences(body)
    .join("\n")
    .replace(/<!--[\s\S]*?-->/g, "");
}

function hasMarker(body) {
  return markdownLinesOutsideFences(body).some(
    (line) => line.trim() === REVIEW_GOVERNANCE_MARKER,
  );
}

function sections(body, level, title) {
  const lines = governedSource(body).split("\n");
  const expected = `${"#".repeat(level)} ${title}`.toLowerCase();
  const starts = lines
    .map((line, index) =>
      line.trim().toLowerCase() === expected ? index : undefined,
    )
    .filter((index) => index !== undefined);

  return starts.map((start) => {
    let end = lines.length;
    for (let index = start + 1; index < lines.length; index += 1) {
      if (/^#{1,6}\s+\S/.test(lines[index].trim())) {
        end = index;
        break;
      }
    }

    return lines
      .slice(start + 1, end)
      .join("\n")
      .trim();
  });
}

function requiredSection(body, level, title, errors) {
  const values = sections(body, level, title);
  if (values.length === 0 || values[0].length === 0) {
    errors.push(`Missing or empty \`${"#".repeat(level)} ${title}\` section.`);
    return "";
  }
  if (values.length > 1) {
    errors.push(`Duplicate \`${"#".repeat(level)} ${title}\` section.`);
  }
  return values[0];
}

function parseFields(content, sectionTitle, errors) {
  const fields = new Map();
  for (const line of content.split("\n")) {
    const match = /^- ([A-Za-z][A-Za-z /-]*):\s*(.*?)\s*$/.exec(line.trim());
    if (!match) {
      continue;
    }
    const key = match[1].toLowerCase();
    if (fields.has(key)) {
      errors.push(`Duplicate \`${match[1]}\` field in ${sectionTitle}.`);
      continue;
    }
    fields.set(key, match[2]);
  }
  return fields;
}

function requiredField(fields, key, sectionTitle, errors) {
  const value = fields.get(key.toLowerCase());
  if (value === undefined || value.trim().length === 0) {
    errors.push(`Missing \`${key}\` field in ${sectionTitle}.`);
    return "";
  }
  return value.trim();
}

function requireMeaningful(value, label, errors) {
  const normalized = normalize(value);
  if (PLACEHOLDERS.has(normalized) || value.trim().length < 12) {
    errors.push(`${label} must contain concrete non-placeholder evidence.`);
  }
}

function requireOneOf(value, allowed, label, errors) {
  const normalized = normalize(value);
  if (!allowed.has(normalized)) {
    errors.push(
      `${label} has unsupported value \`${normalized.slice(0, 80) || "<empty>"}\`.`,
    );
  }
  return normalized;
}

export function linkedIssueNumbers(body) {
  const numbers = [];
  for (const line of governedSource(body).split("\n")) {
    const match = /^(?:closes|fixes|resolves)\s+#([1-9][0-9]*)\s*$/i.exec(
      line.trim(),
    );
    if (match) {
      numbers.push(Number(match[1]));
    }
  }
  return numbers;
}

export function validateIssueBody(body) {
  const errors = [];
  const schema = normalize(
    requiredSection(body, 3, "Review governance schema", errors),
  );
  if (schema !== "V1") {
    errors.push("Linked issue must use review-governance schema `v1`.");
  }

  const dryStatus = requireOneOf(
    requiredSection(body, 3, "DRY review status", errors),
    DRY_STATUSES,
    "Issue DRY review status",
    errors,
  );
  const dryScope = requiredSection(body, 3, "DRY review scope", errors);
  requireMeaningful(dryScope, "Issue DRY review scope", errors);

  const strixApplicability = requireOneOf(
    requiredSection(body, 3, "Strix applicability", errors),
    STRIX_APPLICABILITY,
    "Issue Strix applicability",
    errors,
  );
  const strixStatus = requireOneOf(
    requiredSection(body, 3, "Strix review status", errors),
    STRIX_STATUSES,
    "Issue Strix review status",
    errors,
  );
  const strixTargetClass = requireOneOf(
    requiredSection(body, 3, "Strix target class", errors),
    STRIX_TARGET_CLASSES,
    "Issue Strix target class",
    errors,
  );
  const strixRationale = requiredSection(body, 3, "Strix rationale", errors);
  requireMeaningful(strixRationale, "Issue Strix rationale", errors);

  if (strixApplicability === "NOT REQUIRED") {
    if (strixStatus !== "NOT APPLICABLE") {
      errors.push(
        "An issue with Strix applicability `NOT REQUIRED` must use status `NOT APPLICABLE`.",
      );
    }
    if (strixTargetClass !== "NO TARGET") {
      errors.push(
        "An issue with Strix applicability `NOT REQUIRED` must use target class `NO TARGET`.",
      );
    }
  }

  if (strixApplicability === "REQUIRED") {
    if (strixStatus === "NOT APPLICABLE") {
      errors.push("A required Strix review cannot be `NOT APPLICABLE`.");
    }
    if (strixTargetClass === "NO TARGET") {
      errors.push("A required Strix review must declare a target class.");
    }
  }

  return {
    errors,
    state: {
      dryStatus,
      strixApplicability,
      strixStatus,
      strixTargetClass,
    },
  };
}

export function validatePullRequestBody(body, headSha) {
  const errors = [];
  if (!hasMarker(body)) {
    errors.push("Pull request is missing the review-governance v1 marker.");
  }

  const issueNumbers = linkedIssueNumbers(body);
  if (issueNumbers.length !== 1) {
    errors.push(
      "Pull request must contain exactly one standalone `Closes #<issue>` line.",
    );
  }

  const dryContent = requiredSection(body, 2, "DRY review", errors);
  const dryFields = parseFields(dryContent, "DRY review", errors);
  const dryStatus = requireOneOf(
    requiredField(dryFields, "Status", "DRY review", errors),
    DRY_STATUSES,
    "Pull-request DRY review status",
    errors,
  );
  const dryScope = requiredField(dryFields, "Scope", "DRY review", errors);
  const reviewedRevision = requiredField(
    dryFields,
    "Reviewed revision",
    "DRY review",
    errors,
  ).toLowerCase();
  const dryFindings = requiredField(
    dryFields,
    "Findings",
    "DRY review",
    errors,
  );
  const dryEvidence = requiredField(
    dryFields,
    "Evidence",
    "DRY review",
    errors,
  );

  if (!FINAL_DRY_STATUSES.has(dryStatus)) {
    errors.push(
      "Pull-request DRY review must finish as `CLEAN` or `CLEAN WITH NOTES`.",
    );
  }
  if (!/^[0-9a-f]{40}$/.test(reviewedRevision)) {
    errors.push("DRY reviewed revision must be one full 40-character Git SHA.");
  } else if (reviewedRevision !== headSha.toLowerCase()) {
    errors.push("DRY reviewed revision does not match the immutable PR head.");
  }
  requireMeaningful(dryScope, "Pull-request DRY scope", errors);
  requireMeaningful(dryFindings, "Pull-request DRY findings", errors);
  requireMeaningful(dryEvidence, "Pull-request DRY evidence", errors);

  const strixContent = requiredSection(
    body,
    2,
    "Guarded Strix security review",
    errors,
  );
  const strixFields = parseFields(
    strixContent,
    "Guarded Strix security review",
    errors,
  );
  const strixApplicability = requireOneOf(
    requiredField(
      strixFields,
      "Applicability",
      "Guarded Strix security review",
      errors,
    ),
    STRIX_APPLICABILITY,
    "Pull-request Strix applicability",
    errors,
  );
  const strixStatus = requireOneOf(
    requiredField(
      strixFields,
      "Status",
      "Guarded Strix security review",
      errors,
    ),
    STRIX_STATUSES,
    "Pull-request Strix status",
    errors,
  );
  const strixTargetClass = requireOneOf(
    requiredField(
      strixFields,
      "Target class",
      "Guarded Strix security review",
      errors,
    ),
    STRIX_TARGET_CLASSES,
    "Pull-request Strix target class",
    errors,
  );
  const strixTarget = requiredField(
    strixFields,
    "Target",
    "Guarded Strix security review",
    errors,
  );
  const strixEnvironment = requireOneOf(
    requiredField(
      strixFields,
      "Environment",
      "Guarded Strix security review",
      errors,
    ),
    STRIX_ENVIRONMENTS,
    "Pull-request Strix environment",
    errors,
  );
  const testedRevision = requiredField(
    strixFields,
    "Tested revision",
    "Guarded Strix security review",
    errors,
  ).toLowerCase();
  const strixMode = requiredField(
    strixFields,
    "Mode",
    "Guarded Strix security review",
    errors,
  );
  const strixScopeMode = requiredField(
    strixFields,
    "Scope mode",
    "Guarded Strix security review",
    errors,
  );
  const strixBudget = requiredField(
    strixFields,
    "Budget",
    "Guarded Strix security review",
    errors,
  );
  const strixAuthorization = requiredField(
    strixFields,
    "Authorization",
    "Guarded Strix security review",
    errors,
  );
  const strixPlan = requiredField(
    strixFields,
    "Plan",
    "Guarded Strix security review",
    errors,
  );
  const strixExecution = requiredField(
    strixFields,
    "Execution",
    "Guarded Strix security review",
    errors,
  );
  const strixFindings = requiredField(
    strixFields,
    "Findings",
    "Guarded Strix security review",
    errors,
  );
  const strixEvidence = requiredField(
    strixFields,
    "Evidence",
    "Guarded Strix security review",
    errors,
  );
  const productionApproval = requiredField(
    strixFields,
    "Production approval",
    "Guarded Strix security review",
    errors,
  );

  requireMeaningful(strixFindings, "Pull-request Strix findings", errors);
  requireMeaningful(strixEvidence, "Pull-request Strix evidence", errors);

  if (strixApplicability === "NOT REQUIRED") {
    const expected = [
      [strixStatus, "NOT APPLICABLE", "status"],
      [strixTargetClass, "NO TARGET", "target class"],
      [normalize(strixTarget), "NONE", "target"],
      [strixEnvironment, "NONE", "environment"],
      [normalize(testedRevision), "NOT RUN", "tested revision"],
      [normalize(strixMode), "NOT CREATED", "mode"],
      [normalize(strixScopeMode), "NOT CREATED", "scope mode"],
      [normalize(strixBudget), "NOT CREATED", "budget"],
      [normalize(strixAuthorization), "NOT CREATED", "authorization"],
      [normalize(strixPlan), "NOT CREATED", "plan"],
      [normalize(strixExecution), "NOT RUN", "execution"],
      [normalize(productionApproval), "NOT APPLICABLE", "production approval"],
    ];
    for (const [actual, wanted, label] of expected) {
      if (actual !== wanted) {
        errors.push(
          `A non-required Strix review must record ${label} as \`${wanted}\`.`,
        );
      }
    }
  }

  if (strixApplicability === "REQUIRED") {
    if (!FINAL_STRIX_STATUSES.has(strixStatus)) {
      errors.push(
        "A required Strix review must reach `TRIAGED` or `REMEDIATION VERIFIED` before merge.",
      );
    }
    if (strixTargetClass === "NO TARGET" || strixEnvironment === "NONE") {
      errors.push(
        "A required Strix review must declare a real target class and non-`NONE` environment.",
      );
    }
    const expectedEnvironment = STRIX_TARGET_ENVIRONMENTS.get(strixTargetClass);
    if (expectedEnvironment && strixEnvironment !== expectedEnvironment) {
      errors.push(
        `Strix target class \`${strixTargetClass}\` requires environment \`${expectedEnvironment}\`.`,
      );
    }
    if (!/^[0-9a-f]{40}$/.test(testedRevision)) {
      errors.push(
        "Required Strix tested revision must be one full 40-character Git SHA.",
      );
    } else if (testedRevision !== headSha.toLowerCase()) {
      errors.push(
        "Required Strix tested revision does not match the immutable PR head.",
      );
    }
    requireOneOf(strixMode, STRIX_MODES, "Pull-request Strix mode", errors);
    requireOneOf(
      strixScopeMode,
      STRIX_SCOPE_MODES,
      "Pull-request Strix scope mode",
      errors,
    );
    const budgetMatch = /^USD\s+([0-9]+(?:\.[0-9]{1,2})?)$/i.exec(
      strixBudget.trim(),
    );
    const budget = budgetMatch ? Number(budgetMatch[1]) : Number.NaN;
    if (!Number.isFinite(budget) || budget <= 0 || budget > 25) {
      errors.push(
        "Required Strix budget must use `USD <amount>` and be greater than 0 and at most 25.",
      );
    }
    requireMeaningful(strixTarget, "Pull-request Strix target", errors);
    requireMeaningful(
      strixAuthorization,
      "Pull-request Strix authorization",
      errors,
    );
    requireMeaningful(strixPlan, "Pull-request Strix plan", errors);
    requireMeaningful(strixExecution, "Pull-request Strix execution", errors);
    if (strixEnvironment === "PRODUCTION") {
      requireMeaningful(
        productionApproval,
        "Pull-request production Strix approval",
        errors,
      );
    } else if (normalize(productionApproval) !== "NOT APPLICABLE") {
      errors.push(
        "A non-production Strix review must record production approval as `NOT APPLICABLE`.",
      );
    }
  }

  return {
    errors,
    state: {
      issueNumbers,
      dryStatus,
      reviewedRevision,
      strixApplicability,
      strixStatus,
      strixTargetClass,
      strixEnvironment,
      testedRevision,
      strixMode: normalize(strixMode),
      strixScopeMode: normalize(strixScopeMode),
      strixBudget,
    },
  };
}

export function validateReviewGovernance({
  issueBody,
  issueNumber,
  prBody,
  headSha,
}) {
  const issue = validateIssueBody(issueBody);
  const pullRequest = validatePullRequestBody(prBody, headSha);
  const errors = [...issue.errors, ...pullRequest.errors];

  if (
    pullRequest.state.issueNumbers.length === 1 &&
    pullRequest.state.issueNumbers[0] !== issueNumber
  ) {
    errors.push(
      "Fetched issue does not match the pull request's closing issue.",
    );
  }
  if (issue.state.dryStatus !== pullRequest.state.dryStatus) {
    errors.push("Issue and pull request DRY statuses must match.");
  }
  if (issue.state.strixApplicability !== pullRequest.state.strixApplicability) {
    errors.push("Issue and pull request Strix applicability must match.");
  }
  if (issue.state.strixStatus !== pullRequest.state.strixStatus) {
    errors.push("Issue and pull request Strix statuses must match.");
  }
  if (issue.state.strixTargetClass !== pullRequest.state.strixTargetClass) {
    errors.push("Issue and pull request Strix target classes must match.");
  }

  return {
    errors,
    state: {
      issueNumber,
      ...pullRequest.state,
    },
  };
}

function parseArguments(argv) {
  const argumentsByName = new Map();
  for (let index = 0; index < argv.length; index += 2) {
    const name = argv[index];
    const value = argv[index + 1];
    if (!name?.startsWith("--") || value === undefined) {
      throw new Error("Arguments must be provided as `--name value` pairs.");
    }
    argumentsByName.set(name, value);
  }
  return argumentsByName;
}

async function fetchIssue(repository, issueNumber, token) {
  const apiUrl = process.env.GITHUB_API_URL ?? "https://api.github.com";
  const response = await fetch(
    `${apiUrl}/repos/${repository}/issues/${issueNumber}`,
    {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "X-GitHub-Api-Version": "2022-11-28",
      },
    },
  );
  if (!response.ok) {
    throw new Error(`GitHub issue lookup failed with HTTP ${response.status}.`);
  }
  return response.json();
}

function summary(result) {
  const safe = (value) => String(value || "UNKNOWN").replaceAll("|", "\\|");
  return [
    "## DRY and guarded Strix review governance",
    "",
    "| Evidence | State |",
    "| --- | --- |",
    `| Linked issue | #${safe(result.state.issueNumber)} |`,
    `| DRY review | ${safe(result.state.dryStatus)} |`,
    `| Reviewed revision | \`${safe(result.state.reviewedRevision)}\` |`,
    `| Strix applicability | ${safe(result.state.strixApplicability)} |`,
    `| Strix review | ${safe(result.state.strixStatus)} |`,
    `| Strix target class | ${safe(result.state.strixTargetClass)} |`,
    `| Strix environment | ${safe(result.state.strixEnvironment)} |`,
    `| Strix tested revision | \`${safe(result.state.testedRevision)}\` |`,
    `| Strix mode / scope | ${safe(result.state.strixMode)} / ${safe(result.state.strixScopeMode)} |`,
    `| Strix budget | ${safe(result.state.strixBudget)} |`,
    "",
    result.errors.length === 0
      ? "Result: PASS"
      : `Result: FAIL (${result.errors.length} finding${result.errors.length === 1 ? "" : "s"})`,
    ...result.errors.map((error) => `- ${error}`),
    "",
    "This workflow validates declared evidence only. It never invokes Strix and does not prove security.",
    "",
  ].join("\n");
}

async function main() {
  const argumentsByName = parseArguments(process.argv.slice(2));
  const eventPath = argumentsByName.get("--event");
  if (!eventPath) {
    throw new Error("Use `--event <GITHUB_EVENT_PATH>`.");
  }

  const event = JSON.parse(await readFile(eventPath, "utf8"));
  const prBody = event.pull_request?.body ?? "";
  const headSha = event.pull_request?.head?.sha ?? "";
  const repository = event.repository?.full_name ?? "";
  const issueNumbers = linkedIssueNumbers(prBody);
  if (issueNumbers.length !== 1) {
    const result = validatePullRequestBody(prBody, headSha);
    const combined = {
      errors: result.errors,
      state: { issueNumber: "UNKNOWN", ...result.state },
    };
    if (process.env.GITHUB_STEP_SUMMARY) {
      await appendFile(process.env.GITHUB_STEP_SUMMARY, summary(combined));
    }
    throw new Error(combined.errors.join("\n"));
  }

  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error("GITHUB_TOKEN is required for linked-issue validation.");
  }

  const issueNumber = issueNumbers[0];
  const issue = await fetchIssue(repository, issueNumber, token);
  const result = validateReviewGovernance({
    issueBody: issue.body ?? "",
    issueNumber,
    prBody,
    headSha,
  });
  if (issue.pull_request) {
    result.errors.push(
      "The closing reference must point to an issue, not another PR.",
    );
  }
  if (issue.state !== "open") {
    result.errors.push(
      "The linked issue must remain open until this PR merges.",
    );
  }

  if (process.env.GITHUB_STEP_SUMMARY) {
    await appendFile(process.env.GITHUB_STEP_SUMMARY, summary(result));
  }
  if (result.errors.length > 0) {
    throw new Error(result.errors.join("\n"));
  }
  console.log(
    `Review governance passed for issue #${issueNumber} at ${headSha}.`,
  );
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main().catch((error) => {
    console.error(`Review governance failed:\n${error.message}`);
    process.exitCode = 1;
  });
}
