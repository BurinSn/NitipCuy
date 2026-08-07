# NitipCuy Cross-Session Handoff

Last updated: 2026-08-07 13:23 WIB

Handoff owner: Codex

Product owner: BurinSN

## 1. Role, authority, and freshness contract

This file is the single operational resume point. It owns verified repository state, active bounded work, authority boundaries, blockers, verification, and the exact next action. Live Git and GitHub state override this timestamped record.

This handoff never grants merge, deployment, real-provider configuration, external security testing, payment movement, production action, visual approval, or product-scope authority.

## 2. Mandatory resume protocol

Before changing NitipCuy:

1. Read `AGENTS.md`, `docs/roadmap.md`, this handoff, the latest `docs/changes.md`, and relevant `docs/learning.md`.
2. Read the master specification, system architecture, ADR 0005, security architecture, scalability/resilience, quality gates, and Git workflow for issue #5 work.
3. Verify branch, status, local head, `origin/main`, issue #5, pull request, reviews, and exact-head checks.
4. Preserve unexpected work and reconcile every stale lifecycle claim before implementation.
5. Do not inspect or expose `.env*`, credentials, keys, browser sessions, private identity data, customer data, or production secrets.

Minimum local verification:

```bash
git status --short --branch
git rev-parse HEAD
git rev-parse origin/main
git log --oneline --decorate -5
```

## 3. Product compass

NitipCuy is a standalone BurinSN marketplace connecting customers with independent jastippers. It supports Shop for me and Carry my item. Jastippers set their own prices and terms; NitipCuy earns an approved transaction-protection fee direction rather than subscriptions. Public trip discussion is reusable and contains no private address, identity, order, evidence, or payment data.

The current Stage 1 slice deliberately stops before orders, addresses, private chat, real evidence, payments, logistics, disputes, real provider activation, or production deployment.

## 4. Accepted issue #5 direction

Issue [#5](https://github.com/BurinSn/NitipCuy/issues/5) owns this vertical slice:

```text
verified Google OIDC proof
  -> internal account
  -> revocable base-assurance session
  -> owned jastipper profile
  -> owned trip draft
  -> privileged moderation decision
  -> published safe projection
  -> anonymous bounded search/detail
  -> authenticated public question
  -> trip-owner answer
```

ADR 0005 records the binding choices:

- Google OIDC is the only MVP sign-in adapter; no username/password, magic-link, SMS, or email-password fallback.
- `openid-client` `6.8.4` owns discovery, signature, issuer, audience, lifetime, state, nonce, and S256 PKCE verification.
- Exact issuer plus immutable subject maps to an opaque account. Verified email is required transiently but is not persisted or used for linking.
- NitipCuy owns digest-only opaque PostgreSQL sessions, rotation, revocation, expiry, account versioning, and the `__Host-` cookie contract.
- Google login mints only `BASE` assurance. No live privileged step-up or recovery adapter exists; moderation therefore remains fail-closed through the production HTTP composition.
- Protected use cases re-check the exact persisted session, account version, assurance, account state, ownership, and capability inside their serializable transaction.
- Prisma is isolated in the adapter package; PostgreSQL is authoritative.

The same decision is approved in Global Brain as `stage1.identity-security-quality-direction`, memory ID `9b046273-8175-483c-8e98-2d4d496a77af`, version 1.

## 5. Verified repository and GitHub state

Verified 2026-08-07 before this lifecycle edit:

| Field | State |
|---|---|
| Local project | `/Users/miclawrencee/Workspace/NitipCuy` |
| Canonical remote | `https://github.com/BurinSn/NitipCuy` |
| Visibility / default branch | Private / `main` |
| `main`, `origin/main`, and branch base | `f100b03e0352bad3f969efc7d42a91f46c64f864` |
| Prior slice | Pull request #4 squash-merged; issue #3 closed |
| Active issue | #5, open |
| Active branch | `feat/5-persisted-google-account-slice` |
| Current reviewed checkpoint | `912bdd3404327cf2615c2033ddc045c354bf3de3`, pushed and matched the remote branch before this lifecycle edit |
| Pull request | #6, open, not draft, GitHub-mergeable with 59 changed files at the reviewed checkpoint |
| Current worktree | Clean at the reviewed checkpoint; this final review-state reconciliation is pending commit |
| Deployment / providers | None deployed; no Google client configured; no production provider activated |
| Merge authority | None; a future pull request requires exact-head checks, complete review, and fresh BurinSN approval |

## 6. Implemented working-tree scope

### Identity and sessions

- `openid-client` authorization-code adapter with minimum scopes, exact issuer/audience/callback, nonce, state, S256 PKCE, token lifetime/signature validation, and generic callback failure.
- One-use OAuth attempts store digests of both random state and a separate 256-bit browser-binding cookie plus versioned AES-256-GCM ciphertext for nonce and verifier. A callback initiated in another browser fails closed; safe local return paths reject external, protocol-relative, encoded-slash, backslash, control-character, and fragment inputs.
- Account mapping uses exact issuer and subject. Same subject resolves the same account; same email with a different subject creates a different account. Email is not persisted.
- Opaque 256-bit sessions persist only an HMAC-SHA-256 digest and implement base-only minting, idle/absolute expiry, rotation, rotated-family reuse revocation, logout, active-session listing, per-session revocation, and account-wide invalidation.
- Protected commands revalidate the exact session in their database transaction. Forged assurance and revoked sessions fail closed.

### Marketplace persistence

- Prisma `7.9.1`, PostgreSQL driver adapter, reviewed additive migration, and schema for accounts, external identities, capabilities, sessions, OAuth attempts, profiles, authoritative trips, moderation decisions, public Q&A, audit, and outbox.
- Composite database foreign key binds a trip's owner to its jastipper profile owner.
- Domain and application use cases implement profile creation, trip draft, moderation submission, privileged approval/rejection, publication, question, and owner answer.
- One serializable transaction context binds authoritative writes, success audit, and required outbox messages. A three-attempt bounded retry handles PostgreSQL serialization and unique-race conflicts; optimistic version checks reject stale updates.
- Public projection excludes account IDs, identity data, moderation reasons, and internal records.
- Published search is indexed, bounded to 1-50 rows, and cursor-paginated.

### Delivery and quality

- Dynamic routes cover Google start/callback, logout, session inspection, profile, trip draft, submit, moderate, public question/answer, and anonymous persisted trip search/detail.
- State-changing routes require exact origin, `Sec-Fetch-Site: same-origin`, JSON content type, and an 8 KiB body ceiling.
- Missing runtime configuration fails closed. No real credential or provider call is present in fixtures or documentation.
- The dependency gate explicitly excludes only ignored generated Prisma output and continues scanning every hand-written source root.
- Native install scripts allow Prisma engine/CLI only; optional native test-container dependencies remain denied.

## 7. Verification checkpoint

Passed locally on exact Node.js `24.18.0` and pnpm `11.17.0` after the final source review:

- dependency installation and Prisma generation;
- adapter, application, and web type checks;
- deterministic Google protocol tests for scopes, state, nonce, PKCE, issuer, audience, signature, expiry, and invalid claims;
- disposable PostgreSQL 18 clean migration plus seven integration scenarios covering the full persisted flow, rollback, stale and concurrent identity conflicts, database ownership, pagination, session lifecycle, OAuth cross-browser binding/replay/expiry/ciphertext failure, hidden-question denial, missing capability, email/password absence, forged assurance, and revoked-session denial;
- `pnpm check`: formatting, lint, a four-project scan covering 61 source files and 193 module references, strict types, all 21 boundary tests, all 104 package/web tests, and the production Next.js build;
- route build output includes all issue #5 auth and marketplace endpoints.
- frozen install and peer validation, production audit with zero findings at every severity, lifecycle participation, 33 local links across 20 documents, high-confidence credential and unsafe-source scans, core-network and identity-schema scans, and diff hygiene;
- the production server without persistence or provider configuration returned `200` for the existing public shell, `503` for Google start and persisted trip discovery, and `401` for anonymous session inspection with only generic error bodies.

This evidence is source-tested, production-build-tested, and local disposable-database-runtime-tested. It is not real-Google-verified, browser-verified, hosted-workflow-verified, managed-database-verified, load-tested, guarded-security-tested, provider-verified, incident-tested, visually approved, or production-ready.

Final post-documentation exact-toolchain verification, zero-advisory audit, lifecycle participation, link, secret/static, diff-hygiene, DRY, hostile-security, and missing-configuration runtime checks pass locally. Hosted workflow evidence remains pending until the branch is committed, pushed, and opened as a pull request.

## 8. Review and approval boundaries

- The user approved implementation of issue #5 and the Google-only/no-password direction.
- After the exact pull-request scope, final head `f64b2b6c77bde0284c22163f9740d46408ea1a43`, green hosted runs, zero annotations, absent review objects, and remaining non-claims were presented, BurinSN gave fresh explicit direction to proceed. This authorizes squash-merging pull request #6 only after the approval-state documentation head passes both required hosted workflows and the pull-request description is reconciled.
- The required `review-code-dryness` pass on all 59 changed files is **CLEAN WITH NOTES**. It corrected duplicated transaction budgets, browser-cookie policy/options, session actor mapping, and multiple clock samples for one atomic event. Separate application, provider, and database validations remain intentionally repeated across trust boundaries.
- Guarded Strix doctor passed earlier: binary installed, Docker ready, pinned sandbox present, no active authorizations. No authorization, dry-run plan, or scan exists.
- Strix requires a new explicit exact local or staging target, environment, modes, expiry, and maximum budget. Scan execution needs a separate instruction after the plan; production would require another approval.
- No real Google client creation/configuration, deployment, paid service, external message, provider onboarding, public launch, or merge is authorized.
- At reviewed head `912bdd3404327cf2615c2033ddc045c354bf3de3`, application run `31152304569` and lifecycle run `31152304528` passed with zero annotations. GitHub reported the PR open and mergeable with zero review objects and no review decision.
- CodeRabbit's status succeeded only with a Free-plan walkthrough. Its comment states that the review limit was reached, so no CodeRabbit line review or independent approval exists.

## 9. Remaining blockers and exact next action

Remaining governed work:

1. commit and push this owner-approval state record;
2. inspect both hosted workflows and annotations on the resulting immutable head;
3. reconcile the pull-request description with the final head and approval state;
4. squash-merge pull request #6, then verify `main`, issue #5 closure, and branch cleanup.

The first exact next action is to commit and push this owner-approval state record, then wait for and inspect both required workflows on that exact new head before squash-merging pull request #6.
