// Unit + integration tests for the canonical-block guard.
// Pure-function cases run on any Node with no git; the main() integration cases
// build a throwaway git repo in the OS temp dir. No pnpm engine gate is involved.
// Run: node --test scripts/check-canonical-blocks.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  OPEN,
  CLOSE,
  canonicalRegions,
  overlapsAny,
  canonicalTouched,
  parseHunks,
  main,
} from "./check-canonical-blocks.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCRIPT_PATH = join(__dirname, "check-canonical-blocks.mjs");

function wrap(inner) {
  return `${OPEN}\n${inner}\n${CLOSE}\n`;
}

// --- canonicalRegions --------------------------------------------------------

test("canonicalRegions: one contiguous block", () => {
  // wrap("a\nb\nc") -> OPEN / a / b / c / CLOSE  = lines 1..5
  const regions = canonicalRegions(wrap("a\nb\nc"));
  assert.deepEqual(regions, [[1, 5]]);
});

test("canonicalRegions: marker lines are inclusive endpoints", () => {
  // OPEN on line 1, content line 2, CLOSE on line 3
  const regions = canonicalRegions(`${OPEN}\nx\n${CLOSE}\n`);
  assert.deepEqual(regions, [[1, 3]]);
});

test("canonicalRegions: multiple blocks", () => {
  const content = `${OPEN}\nx\n${CLOSE}\nbetween\n${OPEN}\ny\n${CLOSE}\n`;
  assert.deepEqual(canonicalRegions(content), [
    [1, 3],
    [5, 7],
  ]);
});

test("canonicalRegions: no markers returns empty", () => {
  assert.deepEqual(canonicalRegions("just prose\nno markers here\n"), []);
});

test("canonicalRegions: unterminated block throws", () => {
  assert.throws(() => canonicalRegions(`${OPEN}\nx\n`), /Unterminated/);
});

test("canonicalRegions: nested open throws", () => {
  assert.throws(
    () => canonicalRegions(`${OPEN}\n${OPEN}\nx\n${CLOSE}\n`),
    /Nested/,
  );
});

test("canonicalRegions: unmatched close throws", () => {
  assert.throws(() => canonicalRegions(`x\n${CLOSE}\n`), /Unmatched/);
});

// --- overlapsAny -------------------------------------------------------------

test("overlapsAny: overlap and non-overlap", () => {
  const regions = [
    [10, 20],
    [30, 40],
  ];
  assert.equal(overlapsAny([12, 18], regions), true);
  assert.equal(overlapsAny([5, 9], regions), false);
  assert.equal(overlapsAny([20, 25], regions), true); // boundary touch
  assert.equal(overlapsAny([21, 29], regions), false);
});

// --- parseHunks --------------------------------------------------------------

test("parseHunks: standard hunk with counts", () => {
  const { oldRanges, newRanges } = parseHunks("@@ -10,5 +12,7 @@\n context\n");
  assert.deepEqual(oldRanges, [[10, 14]]);
  assert.deepEqual(newRanges, [[12, 18]]);
});

test("parseHunks: omitted count means 1", () => {
  const { oldRanges, newRanges } = parseHunks("@@ -10 +12 @@\n");
  assert.deepEqual(oldRanges, [[10, 10]]);
  assert.deepEqual(newRanges, [[12, 12]]);
});

test("parseHunks: zero count side is skipped", () => {
  const { oldRanges, newRanges } = parseHunks("@@ -10,0 +11,5 @@\n+added\n");
  assert.deepEqual(oldRanges, []); // pure insertion: no old lines
  assert.deepEqual(newRanges, [[11, 15]]);
});

test("parseHunks: multiple hunks", () => {
  const diff = "@@ -1,2 +1,2 @@\n a\n-b\n+c\n@@ -9,3 +9,1 @@\n-d\n-e\n-f\n+g\n";
  const { oldRanges, newRanges } = parseHunks(diff);
  assert.deepEqual(oldRanges, [
    [1, 2],
    [9, 11],
  ]);
  assert.deepEqual(newRanges, [
    [1, 2],
    [9, 9],
  ]);
});

test("parseHunks: ignores non-hunk lines", () => {
  const { oldRanges, newRanges } = parseHunks(
    "diff --git a b\nindex abc..def 100644\n--- a\n+++ b\n@@ -5,1 +5,1 @@\n-x\n+y\n",
  );
  assert.deepEqual(oldRanges, [[5, 5]]);
  assert.deepEqual(newRanges, [[5, 5]]);
});

// --- canonicalTouched --------------------------------------------------------

test("canonicalTouched: hunk inside canonical -> touched", () => {
  const newContent = wrap("state v2");
  const oldContent = wrap("state v1");
  // new range [2,2] inside canonical region [1,3]
  assert.equal(
    canonicalTouched(newContent, [[2, 2]], oldContent, [[2, 2]]),
    true,
  );
});

test("canonicalTouched: hunk in append zone -> not touched", () => {
  const content = `${wrap("state v1")}## Append\n- row\n`;
  // append zone is lines 5+; canonical region is [1,3]
  assert.equal(canonicalTouched(content, [[5, 6]], content, []), false);
});

test("canonicalTouched: hunk on a marker line -> touched", () => {
  const newContent = wrap("state v1");
  assert.equal(
    canonicalTouched(newContent, [[1, 1]], newContent, [[1, 1]]),
    true,
  ); // OPEN marker line
});

test("canonicalTouched: pure deletion of canonical content -> touched (old-side)", () => {
  const oldContent = wrap("state v1");
  const newContent = `prose only\n`; // canonical removed entirely
  // new ranges empty (deletion); old range [1,3] overlaps old canonical [1,3]
  assert.equal(canonicalTouched(newContent, [], oldContent, [[1, 3]]), true);
});

test("canonicalTouched: hunk entirely outside any region -> not touched", () => {
  const content = `preamble\n${wrap("state v1")}trailer\n`;
  assert.equal(canonicalTouched(content, [[1, 1]], content, [[1, 1]]), false); // preamble line
});

test("canonicalTouched: no markers present -> not touched (graceful no-op)", () => {
  const content = "just prose, no markers\n";
  assert.equal(canonicalTouched(content, [[1, 1]], content, [[1, 1]]), false);
});

// --- main() integration: freshness matrix via throwaway git repo --------------

function git(cwd, ...args) {
  return execFileSync("git", args, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function runScript(cwd, baseRef) {
  // Returns the exit code of the script run in cwd.
  try {
    execFileSync("node", [SCRIPT_PATH, baseRef], {
      cwd,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    return 0;
  } catch (e) {
    return e.status ?? 1;
  }
}

function freshRepo() {
  const root = mkdtempSync(join(tmpdir(), "nc-canon-"));
  git(root, "init", "-q", "-b", "main");
  git(root, "config", "user.email", "test@example.com");
  git(root, "config", "user.name", "test");
  return root;
}

test("main: stale + canonical edit is blocked (exit 1), fresh + canonical allowed (exit 0)", () => {
  const root = freshRepo();
  try {
    writeFileSync(
      join(root, "handoff.md"),
      `${OPEN}\n## Canonical\nstate v1\n${CLOSE}\n## Append\n- row\n`,
    );
    git(root, "add", "handoff.md");
    git(root, "commit", "-q", "-m", "base");

    git(root, "branch", "feat/x");
    // advance main (append-zone only) so feat/x becomes stale
    writeFileSync(
      join(root, "handoff.md"),
      `${OPEN}\n## Canonical\nstate v1\n${CLOSE}\n## Append\n- row\n- main-row\n`,
    );
    git(root, "add", "handoff.md");
    git(root, "commit", "-q", "-m", "main advance");

    git(root, "checkout", "-q", "feat/x");
    // edit canonical on a stale base, then commit so the tree is clean for rebase
    writeFileSync(
      join(root, "handoff.md"),
      `${OPEN}\n## Canonical\nstate v2-edited\n${CLOSE}\n## Append\n- row\n`,
    );
    git(root, "add", "handoff.md");
    git(root, "commit", "-q", "-m", "feat canonical edit");
    assert.equal(runScript(root, "main"), 1, "stale + canonical must block");

    // rebase onto main: canonical and append edits are disjoint regions -> clean
    git(root, "rebase", "-q", "main");
    assert.equal(
      runScript(root, "main"),
      0,
      "fresh + canonical must be allowed",
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("main: stale + append-only edit is allowed (exit 0)", () => {
  const root = freshRepo();
  try {
    writeFileSync(
      join(root, "handoff.md"),
      `${OPEN}\n## Canonical\nstate v1\n${CLOSE}\n## Append\n- row\n`,
    );
    git(root, "add", "handoff.md");
    git(root, "commit", "-q", "-m", "base");
    git(root, "branch", "feat/y");
    // advance main (canonical rewrite by the merge-turn session)
    writeFileSync(
      join(root, "handoff.md"),
      `${OPEN}\n## Canonical\nstate v1-merged\n${CLOSE}\n## Append\n- row\n`,
    );
    git(root, "add", "handoff.md");
    git(root, "commit", "-q", "-m", "main canonical rewrite");

    git(root, "checkout", "-q", "feat/y");
    // feat/y only appends to its own row (stale base, but no canonical edit)
    writeFileSync(
      join(root, "handoff.md"),
      `${OPEN}\n## Canonical\nstate v1\n${CLOSE}\n## Append\n- row\n- feat-y-row\n`,
    );
    assert.equal(
      runScript(root, "main"),
      0,
      "stale + append-only must be allowed",
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("main: malformed marker fails closed (exit 2)", () => {
  const root = freshRepo();
  try {
    // base with valid markers
    writeFileSync(
      join(root, "handoff.md"),
      `${OPEN}\n## Canonical\nstate v1\n${CLOSE}\n## Append\n- row\n`,
    );
    git(root, "add", "handoff.md");
    git(root, "commit", "-q", "-m", "base");
    git(root, "branch", "feat/z");
    git(root, "checkout", "-q", "feat/z");
    // introduce an unterminated marker on the branch (creates a diff so the file is examined)
    writeFileSync(
      join(root, "handoff.md"),
      `${OPEN}\n## Canonical\nstate v1\n## Append\n- row\n`,
    );
    git(root, "add", "handoff.md");
    git(root, "commit", "-q", "-m", "malformed");
    assert.equal(
      runScript(root, "main"),
      2,
      "malformed markers must fail closed",
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

// Sanity: main() is importable and returns 0/1/2 (does not throw) even with no git context.
test("main: returns a numeric exit code (does not throw)", () => {
  // In this repo worktree the script runs against the real tree; we only assert it
  // does not throw and returns a number in {0,1,2}.
  const code = main(["origin/main"]);
  assert.ok([0, 1, 2].includes(code));
});
