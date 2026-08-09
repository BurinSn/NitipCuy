# NitipCuy Cross-Session Handoff

Last updated: 2026-08-09 21:15 WIB

Handoff owner: Codex

Product owner: BurinSN

## 1. Role, authority, and freshness contract

This file is the single operational resume point. It owns verified repository state, active bounded work, authority boundaries, blockers, verification, and the exact next action. Live Git and GitHub state override this timestamped record.

This handoff never grants merge, deployment, real-provider configuration, external security testing, payment movement, production action, visual approval, or product-scope authority.

## 2. Mandatory resume protocol

Before changing NitipCuy:

1. read `AGENTS.md`, `docs/roadmap.md`, this handoff, the latest `docs/changes.md`, and relevant `docs/learning.md`;
2. read the product, ADR 0005, system architecture, security, resilience, quality, Git, and review-governance authorities relevant to the request perimeter;
3. verify branch, status, local head, `origin/main`, issue #9, any pull request, reviews, and exact-head checks;
4. preserve unexpected work and reconcile stale lifecycle or specialist claims before implementation;
5. do not inspect or expose `.env*`, credentials, keys, browser sessions, private identity data, customer data, or production secrets.

Minimum live verification:

```bash
git status --short --branch
git rev-parse HEAD
git rev-parse origin/main
gh issue view 9 --repo BurinSn/NitipCuy
gh pr list --repo BurinSn/NitipCuy --state open
```

## 3. Product compass and current evidence boundary

NitipCuy is a standalone BurinSN marketplace connecting customers with independent jastippers through Shop for me and Carry my item. Jastippers set their own rates and terms; NitipCuy earns an approved transaction-protection fee direction rather than subscriptions.

The current Stage 1 slice stops before orders, addresses, private chat, real evidence, payments, logistics, disputes, provider activation, preview deployment, or production. The persisted account-to-public-Q&A path is source/build/disposable-PostgreSQL tested. It is not real-Google-, browser-, provider-, managed-database-, load-, incident-, visual-, or production-verified.

## 4. Completed repository checkpoints

### Persisted account foundation

Issue [#5](https://github.com/BurinSn/NitipCuy/issues/5) and pull request [#6](https://github.com/BurinSn/NitipCuy/pull/6) delivered Google OIDC proof, internal accounts, revocable base-assurance sessions, owned profiles and trips, privileged moderation gates, published projections, bounded discovery, and authenticated public Q&A. Pull request #6 squash-merged as `f38cdaf144ff3c22c39e7a28544363fdb0fd0a19` after exact-head application and lifecycle workflows passed with zero annotations.

### Review-evidence governance

Issue [#7](https://github.com/BurinSn/NitipCuy/issues/7) and pull request [#8](https://github.com/BurinSn/NitipCuy/pull/8) added the versioned DRY and guarded-Strix issue/PR contract, adversarial validator, and read-only hosted workflow. BurinSN approved the exact reviewed scope. Pull request #8 squash-merged as `d09747b1a8072eaafe23f7bc604b82bb7eae5bf3` on 2026-08-07 14:29 WIB; issue #7 closed and both feature branches were removed. The authoritative final review-governance run `31156985538` passed at PR head `1039486232fd361933a03338be3e4ec3f8e70174` with zero annotations. CodeRabbit supplied a walkthrough only, not an independent review object.

## 5. Active issue #9

Issue [#9](https://github.com/BurinSn/NitipCuy/issues/9) is the first bounded protected-preview security slice.

Included:

- one canonical request-perimeter authority for exact application origin, proxy mode, forwarding metadata, edge proof, downstream canonical context, CSP, and browser headers;
- explicit loopback-only `LOCAL_DIRECT` mode;
- HTTPS-only `TRUSTED_PROXY` mode with exact forwarded host/protocol/port, bounded timing-safe edge proof, and removal of forwarding/proof metadata before routes execute;
- Google callback reconstruction from server-owned canonical context;
- fresh nonce CSP, dynamic rendering, anti-framing, content-type, permissions, referrer, cross-origin, HSTS, and private auth/API cache headers;
- unit, hostile, build, and automated built-runtime tests in local-direct and simulated trusted-proxy modes.

Excluded:

- real edge/provider configuration, deployment, domain, Google provider activation, production secrets or data;
- shared rate limits, WAF/bot controls, observability backend, KMS, privileged step-up/recovery, browser automation, load, payment, order, upload, and public-cache implementation;
- Strix authorization, plan, execution, or external-AI source disclosure; issue #9 now uses a documented non-applicability path.

## 6. Verified live repository state

Verified 2026-08-09 before the current documentation reconciliation:

| Field | State |
|---|---|
| Local project | `/Users/miclawrencee/Workspace/NitipCuy` |
| Canonical remote | `https://github.com/BurinSn/NitipCuy` |
| Visibility / default branch | Private / `main` |
| `main` and `origin/main` base | `d09747b1a8072eaafe23f7bc604b82bb7eae5bf3` |
| Active issue | #9, open |
| Active branch | `sec/9-browser-session-perimeter` |
| Pull request | None yet |
| Worktree | Issue #9 implementation commit `f6d63e25426f705fd38ed01d0ca5242ea12014b2` is pushed; expected governance/lifecycle reconciliation is in progress with no unrelated dirty files observed |
| Deployment / providers | None deployed; no provider configured or activated |
| Strix issue state | `NOT REQUIRED` / `NOT APPLICABLE`, target class `NO TARGET` |
| Strix authority | None; no target, authorization record, plan, budget, execution, report, or external-AI provider approval exists |
| Merge authority | None; a future exact-head PR requires complete evidence and fresh BurinSN approval |

## 7. Working-tree implementation state

- `apps/web/src/server/request-perimeter-core.ts` owns configuration, canonical request decisions, timing-safe proof validation, canonical downstream headers, callback URL reconstruction, CSP, response headers, and generic failure headers.
- `apps/web/src/proxy.ts` applies the perimeter to every relevant page, auth, and API request without request-header matcher bypasses. It retains the shared-ID early rewrite needed for a real unknown-trip `404` after nonce CSP forced dynamic rendering.
- Hostile authority responses are generic, non-redirecting `421` responses and force `no-store` even when the requested path would otherwise be public.
- `apps/web/src/server/runtime.ts` no longer owns a second origin parser.
- The Google callback supplies `openid-client` a URL reconstructed from the canonical downstream origin rather than request-controlled authority.
- Root layout is forced dynamic because Next.js can attach a request nonce only during dynamic rendering.
- `scripts/check-request-perimeter-runtime.mjs` starts isolated built servers with deterministic non-secret configuration and no live database or Google dependency.
- `package.json` includes the runtime probe in `pnpm check` after the production build.
- `pnpm-workspace.yaml` now resolves transitive Nano ID to exact patched `3.3.17` after the current production audit found `3.3.16` through Next.js -> PostCSS.

## 8. Verification state

Rejected and excluded from evidence:

- the ambient Node.js `26.0.0` / pnpm `9.15.0` attempt stopped at the engine gate before tests;
- the first ad-hoc runtime script contained a Node module-format mistake and did not exercise the application;
- early runtime probes exposed and then helped correct the prefetch matcher bypass, nonce/static-render mismatch, proxy rewrite re-entry, and soft-404 behavior.

Passed using exact Node.js `24.18.0` and pnpm `11.17.0`:

- focused web tests: 30 passed across proxy, request-perimeter, and existing mutation-boundary suites;
- web strict typecheck;
- production build with every application route reported dynamic;
- automated `pnpm check:perimeter-runtime` in loopback-direct and simulated trusted-proxy modes:
  - canonical root `200`, unauthenticated session API `401`, unknown trip `404`;
  - hostile host, forwarding, prefetch-bypass, missing proof, and wrong forwarded host returned `421` without redirect;
  - CSP nonce matched rendered HTML and changed per request;
  - production CSP contained neither `unsafe-inline` nor `unsafe-eval`;
  - private and hostile-denial responses were `no-store`;
  - HTTPS policy emitted HSTS and did not disclose the edge proof.
- `pnpm why nanoid --prod --recursive` reported one production Nano ID version, `3.3.17`, through PostCSS and Next.js;
- peer-dependency validation passed and the fresh production audit reported no known vulnerabilities after the narrow lockfile override.

Still required before a pull request can become merge-ready:

- final issue/PR evidence reconciliation, hosted exact-head checks, and fresh BurinSN merge approval.

Complete local candidate review:

- the exact-toolchain frozen install, peer validation, `pnpm check`, production audit, lifecycle participation, local-link, workflow-YAML, diff-hygiene, and high-confidence credential gates passed;
- complete base-to-candidate DRY verdict: `CLEAN WITH NOTES`; origin parsing and runtime trusted-proxy fixtures have one owner, while boundary validation, generic configuration-failure headers, framework-status handling, unit/runtime assertions, and canonical documentation remain intentionally repeated at distinct trust or evidence boundaries;
- hostile source/runtime review corrected attacker-controlled prefetch bypass, static nonce mismatch, rewrite re-entry/soft `200`, downstream proxy-metadata leakage, cacheable public-path `421`, and whitespace-normalized proxy mode; no unresolved actionable source finding remains.

## 9. Authority and non-claims

- BurinSN authorized implementation of the bounded inbound browser/session perimeter issue.
- This permits the governed issue, branch, code, tests, documentation, local deterministic runtime probes, verification, push, and pull-request workflow normally required for the change.
- BurinSN selected the zero-external-AI security-review path for issue #9. Strix is `NOT REQUIRED` / `NOT APPLICABLE` for this pull request because no hosted model is approved to receive project context and no verified local Strix model is configured; the bounded perimeter instead retains complete hostile source review and deterministic local runtime evidence.
- This does not authorize a Strix target, external AI provider, guard authorization, dry-run plan, scan execution, external preview, provider configuration, real Google, production testing, deployment, public launch, payment movement, or merge.
- The trusted-proxy runtime is simulated. It does not prove an actual edge strips attacker headers, injects edge proof, restricts origin ingress, supplies TLS, or blocks alternate domains.
- A nonce CSP and successful local probes do not make NitipCuy generally secure or production-ready.
- No AI-driven penetration test, real browser, Google account, hosting edge, WAF/rate limit, private data, load, incident, staging, or production environment was tested, and no NitipCuy code was sent to an external AI model for this review.

## 10. Exact next action

Finish this non-applicability reconciliation, run the exact-toolchain and governance gates, commit and push the resulting documentation head, repeat the exact-head DRY review, then open and verify the focused issue #9 pull request without merging.
