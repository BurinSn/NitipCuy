#!/usr/bin/env node
// NitipCuy canonical-block guard for parallel-session coordination.
//
// Enforces one mechanical rule: an edit to a canonical (merge-turn-only) block is
// allowed only when the current branch is base-fresh (merge-base == base ref).
// This is the mechanical backstop for the single-writer policy in
// docs/development/parallel-coordination.md. It does NOT prove that the editing
// session is the designated merge-turn session -- that is policy-enforced by
// BurinSN's serialized merge. It only prevents the common dangerous case: a
// stale session rewriting canonical state it has not reconciled with main.
//
// Canonical regions are delimited by marker pairs in handoff.md and docs/roadmap.md:
//   <!-- canonical: merge-turn-only -->
//   ...canonical content...
//   <!-- /canonical: merge-turn-only -->
//
// Usage:
//   node scripts/check-canonical-blocks.mjs [base-ref]   # default origin/main
//
// Exit codes:
//   0  no canonical edit, OR canonical edit on a fresh base (allowed for merge-turn).
//   1  canonical edit on a stale base -- rebase first or restrict edits to your append row.
//   2  malformed canonical markers (unterminated, nested, or unmatched) -- fail closed.

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

export const OPEN = "<!-- canonical: merge-turn-only -->";
export const CLOSE = "<!-- /canonical: merge-turn-only -->";

// Returns inclusive 1-indexed [startLine, endLine] regions delimited by markers.
// Throws on nested open, unmatched close, or unterminated block (fail closed).
export function canonicalRegions(content) {
  const lines = String(content).split("\n");
  const regions = [];
  let inC = false;
  let start = null;
  for (let i = 0; i < lines.length; i++) {
    const ln = lines[i];
    if (ln.includes(OPEN)) {
      if (inC) throw new Error(`Nested canonical open at line ${i + 1}`);
      inC = true;
      start = i + 1; // 1-indexed
    } else if (ln.includes(CLOSE)) {
      if (!inC) throw new Error(`Unmatched canonical close at line ${i + 1}`);
      regions.push([start, i + 1]); // inclusive
      inC = false;
      start = null;
    }
  }
  if (inC) throw new Error(`Unterminated canonical block at line ${start}`);
  return regions;
}

export function overlapsAny(range, regions) {
  const [lo, hi] = range;
  return regions.some(([s, e]) => lo <= e && hi >= s);
}

// newRanges/oldRanges: arrays of inclusive 1-indexed [start,end] changed-line ranges
// parsed from `git diff --unified=0` hunk headers. Checks both new-side (edits/additions)
// and old-side (deletions) against the respective canonical regions.
export function canonicalTouched(newContent, newRanges, oldContent, oldRanges) {
  const newReg = canonicalRegions(newContent);
  const oldReg = canonicalRegions(oldContent);
  if (newRanges.some((r) => overlapsAny(r, newReg))) return true;
  if (oldRanges.some((r) => overlapsAny(r, oldReg))) return true; // catches canonical deletion
  return false;
}

const HUNK_RE = /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/;

// Parses unified-0 diff output into old and new changed-line ranges.
// A count of 0 means no lines on that side (pure insertion or deletion); it is skipped.
export function parseHunks(diffOutput) {
  const oldRanges = [];
  const newRanges = [];
  for (const line of String(diffOutput).split("\n")) {
    const m = line.match(HUNK_RE);
    if (!m) continue;
    const oldStart = Number(m[1]);
    const oldCount = m[2] === undefined ? 1 : Number(m[2]);
    const newStart = Number(m[3]);
    const newCount = m[4] === undefined ? 1 : Number(m[4]);
    if (oldCount > 0) oldRanges.push([oldStart, oldStart + oldCount - 1]);
    if (newCount > 0) newRanges.push([newStart, newStart + newCount - 1]);
  }
  return { oldRanges, newRanges };
}

// Uses execFileSync with an argument array (no shell) so a base-ref or file path
// containing shell metacharacters cannot inject commands.
function git(args) {
  return execFileSync("git", args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function gitOrEmpty(args) {
  try {
    return git(args);
  } catch {
    return "";
  }
}

export function main(argv) {
  const baseRef = (argv && argv[0]) || "origin/main";
  let baseSha;
  try {
    baseSha = git(["rev-parse", "--verify", baseRef]).trim();
  } catch {
    console.error(
      `canonical-blocks: missing base ref ${baseRef} (run: git fetch origin)`,
    );
    return 1;
  }
  let mergeBase;
  try {
    mergeBase = git(["merge-base", baseRef, "HEAD"]).trim();
  } catch {
    console.error(
      `canonical-blocks: cannot compute merge-base of ${baseRef} and HEAD`,
    );
    return 1;
  }

  const files = ["handoff.md", "docs/roadmap.md"];
  let anyTouched = false;
  for (const file of files) {
    let newContent;
    try {
      newContent = readFileSync(file, "utf8");
    } catch {
      continue; // file absent on HEAD -- nothing to check
    }
    const diff = gitOrEmpty(["diff", "--unified=0", mergeBase, "--", file]);
    if (!diff) continue; // no changes to this file vs merge-base
    const { oldRanges, newRanges } = parseHunks(diff);
    const oldContent = gitOrEmpty(["show", `${mergeBase}:${file}`]);
    let touched;
    try {
      touched = canonicalTouched(newContent, newRanges, oldContent, oldRanges);
    } catch (e) {
      console.error(
        `canonical-blocks: malformed canonical marker in ${file}: ${e.message}`,
      );
      return 2;
    }
    if (touched) anyTouched = true;
  }

  if (!anyTouched) {
    // append-only or no canonical edits -- allowed regardless of freshness
    return 0;
  }
  if (mergeBase !== baseSha) {
    console.error(
      `canonical-blocks: canonical block edited on a stale base (merge-base ${mergeBase} != ${baseRef} ${baseSha}).`,
    );
    console.error(
      `canonical-blocks: rebase onto ${baseRef} first, or restrict your edit to your per-session append row.`,
    );
    return 1;
  }
  console.error(
    `canonical-blocks: canonical edit on fresh base -- allowed for the designated merge-turn session.`,
  );
  return 0;
}

let isMain = false;
try {
  isMain =
    process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
} catch {
  isMain = false;
}
if (isMain) {
  process.exit(main(process.argv.slice(2)));
}
