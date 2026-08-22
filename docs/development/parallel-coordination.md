# NitipCuy Parallel Session Coordination

Status: Accepted project policy

Last reviewed: 2026-08-22

## 1. Purpose and authority

This document owns the protocol for two or more AI or human sessions working the NitipCuy repository **in parallel on different issues**. It supplements `docs/development/git-workflow.md` and `docs/development/review-governance.md`; it does not weaken either. When this protocol conflicts with a softer habit, this protocol wins.

The problem this protocol solves is **not code conflicts** — git resolves those mechanically. The hard problem is `handoff.md` and `docs/roadmap.md`: mutable single-writer "current state" files that two sessions would both rewrite, where a squash-merge can silently discard one session's state narrative. `docs/changes.md` and `docs/learning.md` are append-only logs and are naturally parallel-safe.

## 2. When this protocol applies

- **Two or more sessions are active** on the repository at the same time, each on its own issue.
- A single session working alone is unchanged by this protocol; it still follows `git-workflow.md` and the existing lifecycle discipline.
- The protocol is opt-in per in-flight session count. If you are the only active session, skip to `git-workflow.md`.

## 3. Layer 1 — Worktree isolation

Each session works in its **own git worktree** (or a separate clone) on its own branch. Never run two sessions in the same working tree — they would clobber each other's edits at the filesystem level.

```bash
git fetch origin
git worktree add -b <type>/<issue>-<slug> ../NitipCuy-<issue> origin/main
cd ../NitipCuy-<issue>
pnpm install --frozen-lockfile   # per worktree; pnpm's store makes this cheap
```

Cleanup after merge:

```bash
git worktree remove ../NitipCuy-<issue>
```

## 4. Layer 2 — One issue, one branch, one session

- Each session owns **exactly one hosted issue** and **one focused branch**. No two sessions work the same issue.
- Claim the work by adding a row to `handoff.md` §6 "Active sessions" and `docs/roadmap.md` §13 "Parallel work items" (the per-session append-only zones).
- Assign issues with **disjoint file footprints where possible**. When two features must touch the same non-lifecycle file, flag the pair `overlap-risk` and **sequence** them — do not parallelize. An `overlap-risk` pair may ship an explicit **integration PR** (a temporary branch stacking the two features) before either merges.

## 5. Layer 3 — Base-freshness gate

A session is **base-fresh** when `git merge-base origin/main HEAD` equals `git rev-parse origin/main` — that is, no other session has merged to `main` since this branch's base.

```bash
./scripts/check-base-freshness.sh origin/main commit   # before committing: WARN only
./scripts/check-base-freshness.sh origin/main merge    # before requesting merge: BLOCK
```

- **At commit time**: WARN only. A commit on a stale branch is harmless; it just means a later rebase.
- **At merge-request time**: BLOCK. The PR must be rebased onto current `origin/main` before it is declared merge-ready.
- A stale session may continue appending to its own per-session row, but **must not edit canonical blocks** and **must not request merge** until it has rebased and re-verified.

The commit-time WARN is delivered by running the script before committing (an `AGENTS.md` instruction), **not** by a pre-commit hook — a hard hook would fire on single-session work too and add friction. The hard BLOCK is enforced in hosted CI at PR time.

## 6. Layer 4 — Lifecycle single-writer (the spine)

`handoff.md` and `docs/roadmap.md` are split into two zones by marker pairs:

```markdown
<!-- canonical: merge-turn-only -->
...shared truth: current state, stage status, last merge, owner authority...
<!-- /canonical: merge-turn-only -->

## Per-session append-only zone
<!-- per-session: append-only -->
...each session updates ONLY its own row/subsection...
<!-- /per-session: append-only -->
```

- **Canonical block** — single-writer. Rewritten **only by the designated merge-turn session**, and only **after rebasing onto latest `main`** so it reflects the integrated world.
- **Per-session append-only zone** — each session edits **only its own row or subsection**. Different lines never collide; a rebase auto-merges them.
- `docs/changes.md` and `docs/learning.md` remain append-only; each session appends its own entry, ordered by merge order.

The mechanical guard `scripts/check-canonical-blocks.mjs` enforces one rule: **a canonical-block edit is allowed only when the branch is base-fresh.**

```bash
node scripts/check-canonical-blocks.mjs origin/main
```

Exit codes: `0` no canonical edit, or canonical edit on a fresh base; `1` canonical edit on a stale base (rebase first or restrict your edit to your append row); `2` malformed markers (fail closed).

### Honest limitation of the guard

Base-freshness is **necessary but not sufficient** for canonical-write authority. It does not prevent two concurrent base-fresh sessions both editing canonical before either merges — that is not mechanically enforceable without branch protection or a server-side lock, and this private repository has no branch protection. The gap is closed by **policy + merge serialization**, not by the guard alone:

- **Policy**: only the session BurinSN designates as the next to merge edits canonical blocks. All other sessions append only.
- **Merge serialization**: BurinSN merges one PR at a time (Layer 5). The first merge advances `main`; every other session is now stale, so any speculative canonical edit they made fails the guard at re-verification and is forced into the take-main rebase rule below.

The guard is the mechanical backstop for the common dangerous case (a stale session rewriting canonical state it has not reconciled). It is not a claim that single-writer is fully enforced.

## 7. Layer 5 — Merge serialization

- **BurinSN is the sole merge authority.** Agents — Claude, Codex, or any other — **never merge**, never push to `main`, and never force-push `main`. This restates `git-workflow.md` and is non-negotiable under parallel work.
- **One PR merges at a time.** After each merge, every other active session runs the rebase cascade (§8).
- Agents hand BurinSN a rebase-fresh, evidence-complete PR. BurinSN reviews and merges in roughly FIFO order to minimize cascade depth.

## 8. Rebase cascade (after BurinSN merges another session's PR)

Every other active session runs:

1. `git fetch origin && git rebase origin/main`
2. Resolve conflicts by region (below).
3. Re-run gates: `./scripts/check-lifecycle-docs.sh origin/main`, `./scripts/check-base-freshness.sh origin/main merge`, `node scripts/check-canonical-blocks.mjs origin/main`, and `pnpm check` + `pnpm audit:prod` when application or toolchain code changed.
4. **Re-record the DRY review on the new head.** A rebase changes the PR-head SHA and invalidates the pinned exact-head DRY verdict (see `review-governance.md`); the hosted review-governance workflow fails until a new SHA is recorded. A clean rebase (byte-identical diff) is a **re-pin** of the same verdict; a conflict rebase is a **scoped re-review** of only the conflict-resolved delta.
5. `git push --force-with-lease` to the feature branch (force-push to a feature branch is allowed; **never** to `main`).
6. Re-pin the linked issue and PR bodies with the new head.

### Conflict resolution by region

- **Per-session append zone** (`handoff.md` §6 / `docs/roadmap.md` §13): keep both rows, ordered deterministically by issue number. Never delete the merged session's row.
- **Canonical block**: **take `main`'s version** (during `git rebase`, `--ours` is the new base = `main`). Because one file mixes canonical and append regions, resolve line-aware: take `main` for lines inside `<!-- canonical -->` markers; keep both for lines in the append zone; keep your own append row. If you are **not** the next merge-turn session, **discard your speculative canonical edit entirely** — you should not have made it.
- **`docs/changes.md` / `docs/learning.md`**: union, ordered by merge order (the merged session's entry is now in `main`; yours goes after).
- **Application code**: normal git resolution; then `pnpm check` + `pnpm audit:prod`.

### Bounding the DRY re-review cost

The exact-head DRY pin makes every rebase invalidate the recorded SHA. This is unavoidable under the existing review-governance contract and is the price of review integrity under parallelism. The protocol bounds it: cascade count is at most N−1 per in-flight window (N = parallel sessions); keep PRs short-lived; merge roughly FIFO; non-merge sessions defer canonical edits so their rebase is clean (re-pin only, no scoped re-review).

## 9. Cross-feature functional guarantee — and its honest limit

The guarantee: two sessions never edit the same non-lifecycle file (a protocol violation if they do), so the only coordination surface is the lifecycle docs — and the markers + append zones make lifecycle edits either conflict-free or mechanically resolvable. Every merged feature is then tested against the integrated world by the rebase + full `pnpm check` (format, lint, boundaries, typecheck, 249+ tests, build, perimeter runtime) on the new head.

The honest limit: **tests only prove what they cover.** If two features each pass in isolation and after rebase, but their *interaction* is not exercised by any test, the integration hole is invisible. Each feature must test its own contract. For `overlap-risk` feature pairs, ship an explicit integration PR before either merges.

## 10. Toolchain note

The supported toolchain is Node `24.18.0` and pnpm `11.17.0` (see `quality-gates.md`). `pnpm check` enforces these via the engine gate. A session whose ambient Node/pnpm do not match **cannot run `pnpm check` locally** and therefore cannot locally resolve application-code rebase conflicts or produce local app-code evidence.

- **Docs, governance, and bash-script parallel work is unblocked today** — `node --test scripts/check-canonical-blocks.test.mjs` runs on any recent Node with no pnpm, and the bash gates need no pnpm.
- **Application-code parallel sessions require each session to align its toolchain** (via `nvm`/`corepack` to the pinned versions), or rely on hosted CI only — which is unsafe for local rebase conflict resolution in app code.
- Hosted CI always runs the pinned toolchain, so PR-level proof is unaffected.

## 11. Codex parity

This protocol is tool-agnostic. Codex follows `AGENTS.md` identically: the same gates, the same lifecycle discipline, the same merge-never rule, the same canonical/append zones. Each session records a stable identity (`claude` or `codex`) in its per-session rows in `handoff.md` §6 and `docs/roadmap.md` §13. There is no tool-specific exception.

## 12. Edge cases and failure modes

- **Bootstrap (this protocol's own merge).** The governance PR creates the markers and the guard and edits canonical blocks. It passes its own guard because it branches from `origin/main` and is base-fresh (nothing else merges meanwhile).
- **No markers present.** `check-canonical-blocks.mjs` is a no-op when no markers exist — graceful deployment.
- **Concurrent fresh-base canonical edits.** Not prevented pre-merge by the guard. Caught no later than the first post-collision merge: the non-merged session is stale, fails the guard, and takes `main`'s canonical block on rebase.
- **Rebased but not next to merge.** A rebased session is base-fresh; the guard cannot tell it from the merge-turn session. Policy + BurinSN's designation resolve this; the guard only ensures any canonical edit is at least reconciled with `main`.
- **Marker conflicts.** Malformed markers (unterminated, nested, unmatched) fail closed with exit 2 — they never pass silently.

## 13. Verification

- `node --test scripts/check-canonical-blocks.test.mjs` — the guard's unit and integration suite (runs on ambient Node, no pnpm).
- `./scripts/check-base-freshness.sh origin/main commit` before committing; `merge` before requesting merge.
- `node scripts/check-canonical-blocks.mjs origin/main` before requesting merge.
- The hosted `lifecycle-documentation.yml` workflow runs both gates on the exact PR head; a failed gate blocks merge by project policy.
- A passed gate does not prove the review was competent, that canonical state is correct, or that the application is production-ready. Exact artifacts and claims still receive hostile review before owner approval, as in `review-governance.md`.