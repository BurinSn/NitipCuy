# NitipCuy Learning

## 1. Role, authority, and freshness contract

This is the append-only cumulative learning record. It preserves:

- verified facts and their evidence;
- accepted product or technical learning;
- corrected assumptions;
- failed approaches and why they failed;
- reusable procedures;
- open questions and deliberately deferred research.

This file does not define current repository state, current work, or roadmap order. Use `handoff.md` for current operational truth and `docs/roadmap.md` for current sequence and gates.

Read from oldest to newest. When entries conflict, the newest evidence-backed correction wins. Do not delete an old learning to hide a mistake. Add a newer entry that identifies what it supersedes.

## 2. Mandatory update contract

Every material session must append:

- new verified learning;
- a correction to an earlier assumption;
- a failed approach and its lesson;
- a newly opened, resolved, or deferred question; or
- an explicit statement that no new domain learning resulted.

Label claims clearly:

- `Verified`: proven from source, code, runtime, Git, provider, or primary documentation evidence.
- `Accepted`: approved product or architecture interpretation.
- `Corrected`: supersedes an earlier assumption or conclusion.
- `Failed approach`: attempted and rejected with evidence.
- `Open`: unresolved and potentially blocking.
- `Deferred`: intentionally postponed and not a current blocker.

Do not present inference, provider marketing, provisional pricing, or a future intention as verified fact.

## 3. Entry template

```markdown
## YYYY-MM-DD HH:MM WIB - Learning title

### Verified

- Claim.
  - Evidence:
  - Impact:

### Corrected / Failed approach / Open / Deferred

- Claim.
  - Supersedes:
  - Impact:
```

## 2026-07-25 - Initial product and provider learning

### Verified

- BurinSN's established related-product suffix is `Cuy`, evidenced by MampirCuy and NgantorCuy. `NitipCuy` is internally consistent; trademark and domain clearance remain separate work.
- DOKU publicly supports a Partner model with personal and corporate business registration.
- DOKU publicly documents Hold and Release and Split Settlement, including their combined use.
- DOKU applies Split Settlement to net settlement after DOKU fees.
- An invalid split can leave the transaction successful while the intended split is not executed, requiring explicit reconciliation and repair.
- DOKU's public Sub Account documentation is limited to Virtual Account flows and should not be assumed to support all payment methods.
- DOKU states H+1 business-day settlement after a release request.
- DOKU's marketplace-specific Partner, Hold, Split, reserve, and related commercial prices are not public.

### Accepted product learning

- NitipCuy's value is not merely product listing. The defensible product is structured trip discovery plus commercial clarity, identity, protected payment, evidence, delivery, moderation, dispute handling, and reputation.
- Public discussion reduces repetitive questions, but private communication remains necessary for addresses, identity, receipts, disputes, and personal order details.
- The customer must know the jastipper's relevant location and final-delivery model before commitment to estimate the true landed cost.
- Carry-my-item orders require documented declaration, pickup condition, and weight verification. A seller's price remains their commercial decision.
- Progressive enforcement should not force warning-first treatment for clearly prohibited or dangerous conduct.
- T&C defines roles and remedies but does not replace platform moderation or compliance duties.

### Corrected assumptions

- DOKU's public payment pricing is not enough to finalize NitipCuy economics because the Partner, Hold, Split, payout, reserve, and SLA terms remain unresolved.
- A successful buyer payment does not prove that a hold, split, seller bank settlement, or refund succeeded.
- Broad DOKU payment-method availability does not prove that every method supports the required Hold plus Split combination.
- Holding all buyer funds protects the transaction but creates working-capital pressure for jastippers.

### Open research at the time

- Real Threads operator and customer patterns.
- Pilot routes, categories, order values, weights, and capacities.
- Biteship pricing, coverage, evidence, webhook, claims, and exception behavior.
- Cancellation, refund, insurance, loss, damage, customs, and provider-cost allocations.
- Indonesian legal and regulatory review for the approved operating model.

## 2026-07-25 - Build sequencing correction

### Accepted

- The demonstrated existence of today's jastip market is enough to begin platform development.
- More Threads research is not a prerequisite for creating the platform.
- Threads is better used after a demonstrable product exists, as a channel for jastipper acquisition, trip promotion, feature feedback, and workflow validation.
- Payment, logistics, and legal unknowns should block real-money activation, not repository setup or marketplace development with mock provider ports.

### Reusable learning

- Separate a market-existence gate from a feature-validation loop. Once a real market is established, additional social research should not become indefinite permission to delay building.
- External-provider uncertainty is best isolated behind provider-independent contracts and simulators so core product work can continue safely.

## 2026-07-25 07:40 WIB - Lifecycle documentation hostile review

### Verified

- The four expected lifecycle files existed before issue #1.
  - Evidence: repository tree at `main` commit `6fe622733bdf457448ed0e8670ff5249ce3ca6fe`.
  - Impact: the gap was authority and freshness, not missing filenames.
- The handoff named the first baseline commit but did not clearly state the current `main` tip.
  - Evidence: handoff text compared with live local and remote Git state.
  - Impact: a future session could pin work to the wrong immutable base.
- Historical follow-up text in `docs/changes.md` can become obsolete by design.
  - Evidence: the first entry recommended Threads research, while a later accepted decision moved Threads after platform development.
  - Impact: historical change entries must never be read as current instructions.
- The initial learning entry listed Threads research as open, and the later entry corrected its priority without explicitly labeling the old item deferred.
  - Evidence: chronological comparison of the two learning entries.
  - Impact: future readers need newest-correction-wins and explicit deferred status rules.
- Prose alone cannot enforce the four-file update requirement.
  - Evidence: no local or CI lifecycle freshness check existed at issue opening.
  - Impact: add a fail-closed file-presence check while retaining human content review.
- GitHub cannot currently require the lifecycle check through branch protection while the repository remains private on the current plan.
  - Evidence: the branch-protection API returned `403` with an upgrade-or-public requirement.
  - Impact: keep the repository private, run the pull-request workflow, treat missing or red lifecycle results as a policy-level merge blocker, and require explicit approval.

### Corrected

- Threads operator and customer research from the initial entry is now `Deferred`, not `Open` for Stage 1 or Stage 2.
  - Supersedes: the priority implied by `Open research at the time` in the initial entry.
  - Impact: it becomes Stage 4 acquisition and continuous-feedback work.
- The DOKU, Biteship, legal, and policy questions are `Open for Stage 3`, not blockers for platform work with mock providers.
  - Supersedes: any reading that treats provider validation as permission to begin implementation.
  - Impact: Stage 1 architecture and Stage 2 marketplace development can proceed.

### Reusable learning

- Four lifecycle documents need different jobs. Duplicating the same status across all four creates drift instead of continuity.
- Presence checks can prove that required files were touched, but cannot prove their content is truthful. Completion still requires live-state reconciliation and hostile human review.
- A CI check that fails closed is not the same as a protected branch that technically forbids bypass. Documentation must state the enforcement layer honestly.
- Current state belongs in the handoff, sequencing belongs in the roadmap, material history belongs in changes, and reusable knowledge belongs in learning.
- A historical fact can remain accurate while its follow-up is obsolete. Preserve the history and add a newer correction rather than rewriting it.

### Deferred

- Detailed Threads market-pattern research remains valuable after a demonstrable platform exists.
- Provider commercial outreach remains deferred until BurinSN separately approves external contact.

## 2026-07-25 07:48 WIB - Lifecycle pull-request state

### Verified

- Issue #1 work was committed and pushed at `db936aa94c525b8eeb2d48a20cf752eaac1dd419`.
  - Evidence: local and remote branch state.
  - Impact: pull request #2 now provides the review and CI boundary for the governance change.
- The lifecycle workflow and CodeRabbit review began automatically when pull request #2 opened.
  - Evidence: GitHub pull-request checks at 07:48 WIB.
  - Impact: their pending state is not approval and must be reconciled before any merge request.

### Reusable learning

- Creating or updating a pull request changes operational truth even when product behavior does not change. All four lifecycle documents still require a truthful update under the accepted rule.

### Failed approach

- An unverified expanded SHA was drafted from the real abbreviated commit and caught before commit.
  - Evidence: direct `git rev-parse HEAD` returned `db936aa94c525b8eeb2d48a20cf752eaac1dd419`.
  - Impact: immutable identifiers must always be copied from direct verification output, never expanded, inferred, or reconstructed.

### No new domain learning

- This state transition introduced no new jastip, payment, logistics, moderation, or commercial-model learning.

## 2026-07-25 07:50 WIB - Review and self-referential state correction

### Verified

- The lifecycle pull-request workflow passed at checkpoint `d31b39bbbf7cf70d5e48c38ec8f58c49f187f619`.
  - Evidence: GitHub pull request #2 check run.
  - Impact: the local script is CI-compatible on the repository's hosted runner.
- CodeRabbit's green status did not represent a completed review.
  - Evidence: GitHub reported `Review rate limited`.
  - Impact: record no independent review coverage and never translate a green integration status into review approval.

### Corrected

- A tracked handoff cannot truthfully embed the SHA of the commit that contains its latest state.
  - Supersedes: the earlier `Verified branch head` field.
  - Impact: record a timestamped predecessor or pushed checkpoint, then require direct live verification of the actual branch head.

### Reusable learning

- Never expand or reconstruct an abbreviated immutable identifier. Copy direct verification output.
- Never call an integration status independent review coverage without a real review object or findings.
- Avoid self-referential lifecycle claims that become stale by the act of committing them.

## 2026-07-25 11:09 WIB - Durable treatment of volatile GitHub state

### Corrected

- `Pending` and `not yet verified` are unsafe permanent wording for PR checks recorded in a tracked handoff.
  - Supersedes: the transient final-check wording found during the second hostile review.
  - Impact: PR head, checks, reviews, mergeability, and issue state must be retrieved live before action.
- A historical checkpoint may be recorded, but it must be labeled as timestamped evidence rather than current truth.
  - Supersedes: any attempt to keep a tracked handoff synchronized with its own containing commit SHA.
  - Impact: use conditional transition instructions that remain correct when external state changes.

### Accepted

- BurinSN explicitly authorized the final issue #1 correction, audit, PR handling, merge, issue handling, and branch cleanup after the missing independent review coverage and branch-protection limitation were disclosed.

### Reusable learning

- Stable lifecycle instructions describe how to resolve volatile state, not what a fast-changing external status happened to be seconds before commit.
- A merge handoff can remain current across the transition by defining both branches: what to do if the PR is still open and what to do if it is already merged.

### No new domain learning

- This correction changes documentation governance only. It does not change the jastip, fee, payment, logistics, moderation, delivery, or platform-first product model.

## 2026-07-25 11:14 WIB - GitHub context must not be interpolated into shell commands

### Corrected

- The lifecycle workflow inserted `github.base_ref` directly inside a `run` command.
  - Supersedes: the initial workflow transport for the pull-request base ref.
  - Impact: expose the context value as a step environment variable and use a quoted shell variable instead.

### Verified

- The correction preserves the workflow's pull-request trigger, read-only permission, full-history checkout, and lifecycle script behavior.
  - Evidence: workflow diff and local YAML and shell validation.
  - Impact: security hardening does not broaden permissions or change the merge policy.

### Reusable learning

- Treat GitHub context values as data. Move them through `env` before referencing them in shell, even when the currently expected value is a trusted branch name.

### No new domain learning

- The correction does not change the NitipCuy product, fee, provider, logistics, moderation, or delivery model.

## 2026-07-25 11:17 WIB - Workflow actions require immutable references

### Verified

- Official `actions/checkout` tag `v4` resolved to verified commit `11d5960a326750d5838078e36cf38b85af677262` during the final audit.
  - Evidence: GitHub repository API for `actions/checkout`.
  - Impact: pin that exact commit while retaining the major-version comment for maintenance.

### Corrected

- The initial lifecycle workflow used the moving `actions/checkout@v4` tag.
  - Supersedes: the workflow action reference introduced earlier in issue #1.
  - Impact: future workflow dependency updates must appear as explicit immutable commit changes.

### Reusable learning

- A trusted publisher does not make a mutable tag immutable. Pin CI actions to verified commits and update them deliberately.

### No new domain learning

- The correction changes workflow supply-chain posture only.

## 2026-07-25 11:18 WIB - A green workflow can still expose a runtime blocker

### Verified

- Lifecycle run `30143787972` passed but warned that checkout v4 targets deprecated Node.js 20 and was being force-run on Node.js 24.
  - Evidence: GitHub Actions job annotation on the exact pull-request head.
  - Impact: a green conclusion does not excuse a material compatibility warning.
- Official `actions/checkout` release v7.0.1 was the latest release and resolved to verified commit `3d3c42e5aac5ba805825da76410c181273ba90b1`.
  - Evidence: GitHub release, tag, and commit APIs on 2026-07-25.
  - Impact: upgrade and pin the supported release.

### Corrected

- The immutable v4 pin removed tag mutability but retained the deprecated runtime.
  - Supersedes: treating the v4 pin alone as the completed supply-chain correction.
  - Impact: dependency review must cover compatibility annotations as well as immutability.

### Reusable learning

- Audit hosted-runner annotations, not only job conclusions. A successful workflow may still disclose an imminent compatibility failure.

### No new domain learning

- The correction changes CI compatibility only.

## 2026-07-25 15:02 WIB - Architecture and dependency foundation learning

### Verified

- The newest individually published tool versions did not form a supported dependency graph.
  - Evidence: TypeScript-ESLint rejected TypeScript 7 and transitive Next.js lint plugins rejected ESLint 10 during the exact installation.
  - Impact: pin the newest mutually supported graph, keep peer checking fail-closed, and re-evaluate major upgrades as one compatibility change.
- Next.js `16.2.11` resolved production `postcss` and `sharp` versions with known advisories.
  - Evidence: `pnpm audit:prod` identified three high-severity findings in the initial production graph.
  - Impact: exact workspace overrides to patched `postcss` `8.5.18` and `sharp` `0.35.3` are required for this baseline and must retain build, runtime, and audit evidence until Next.js publishes a supported patched graph.
- Selecting the newest patched package can conflict with the package manager's minimum-release-age policy.
  - Evidence: `postcss` `8.5.23` required a newly generated age exception, while patched `8.5.18` satisfied both advisories without an exception.
  - Impact: use the oldest adequate patched release when it avoids bypassing supply-chain age policy and still passes the full graph.
- Date-only trip departure is insufficient for cross-border deadline and arrival rules.
  - Evidence: the first model compared a foreign trip date against hard-coded Jakarta midnight; offsets could produce the wrong ordering near a date boundary.
  - Impact: preserve the origin-local date for display and filtering, pair it with an exact timezone-bearing timestamp, and compare business rules as instants.
- Lexical ISO timestamp comparison is unsafe when timestamps carry different offsets.
  - Evidence: `2026-08-10T09:30:00+08:00` sorts lexically after `2026-08-10T09:00:00+07:00` but represents an earlier instant.
  - Impact: parse timestamps before chronological validation and keep a cross-offset regression test.
- App Router `notFound()` can render the correct page with HTTP `200` after a streamed response begins.
  - Evidence: the first production HTTP probe returned the not-found content with `200`, consistent with [Next.js streaming status semantics](https://nextjs.org/docs/14/app/api-reference/file-conventions/not-found); `dynamicParams = false` produced `404` but logged an internal fallback error for an unknown path.
  - Impact: the static architecture probe publishes only generated fixture paths and rejects unknown fixture slugs through the route proxy before rendering; a persisted dynamic route must replace this fixture allowlist and retain explicit `404` runtime coverage.

### Accepted

- A modular monolith is the appropriate starting boundary for one product, one web client, and one operating developer.
  - Evidence: no measured independent scaling, availability, ownership, or security boundary requires distributed services.
  - Impact: keep one deployable and explicit internal packages; require a new ADR and measured trigger before extraction.
- The architecture proof should remain public and read-only.
  - Evidence: combining identity selection, persistence, protected mutation, moderation, and experience design into issue #3 would make the first review too broad.
  - Impact: prove dependency direction and discovery first; implement the persisted account-to-public-Q&A slice in the next governed issue.
- Provider unknowns belong behind ports rather than inside domain behavior.
  - Evidence: deterministic payment and logistics mocks exercise platform intent without claiming DOKU or Biteship compatibility.
  - Impact: DOKU, Biteship, identity, and hosting validation can change adapters without rewriting marketplace rules.

### Failed approach

- Declaring production audit success before running the dedicated audit.
  - Evidence: the full format, lint, type, test, and build gate passed while the separate production audit still found vulnerable transitive packages.
  - Impact: keep `pnpm audit:prod` as an explicit independent gate in local guidance and hosted CI.
- Placing pnpm overrides in the root `package.json`.
  - Evidence: pnpm `11.17.0` warned that `pnpm.overrides` there is ignored and requires workspace configuration.
  - Impact: keep workspace-wide resolution policy in `pnpm-workspace.yaml` and fail on package-manager warnings.

### Deferred

- Production identity-provider, Prisma, Neon, Vercel, DOKU, Biteship, and object-storage proofs remain separate governed work.
- Visual design and browser-automation approval remain outside the architecture probe.
- No new DOKU commercial, payment-method, settlement, or onboarding conclusion resulted from issue #3.

## 2026-07-25 16:36 WIB - Pull-request review checkpoint

### Verified

- Opening pull request #4 started the lifecycle, application-quality, and CodeRabbit checks on implementation checkpoint `e1d0669e80430c3abc1f4ca4e94637c827bc3f37`.
  - Evidence: live GitHub pull-request state at 16:36 WIB.
  - Impact: updating lifecycle truth creates a newer head, so the first checkpoint's results cannot be reused as final exact-head evidence.

### Reusable learning

- Treat each lifecycle-state commit as a new review checkpoint. Wait for and inspect hosted evidence on the resulting immutable head rather than copying a result from its predecessor.

### No new domain learning

- Opening the pull request does not change the NitipCuy service modes, seller-rate rights, fee model, payment direction, logistics direction, moderation duties, or platform-first sequence.

## 2026-07-25 16:39 WIB - Hosted verification coverage

### Verified

- Lifecycle and application-quality workflows passed without annotations on checkpoint `7623526f1058d67f53ff82076330bc6c9f6afed0`.
  - Evidence: GitHub check runs `30153108867` and `30153108868`.
  - Impact: the exact architecture graph reproduces in hosted CI using the frozen lockfile.
- CodeRabbit's success state did not represent a review.
  - Evidence: its comment states that the review limit was reached; GitHub contains no CodeRabbit review object or findings.
  - Impact: disclose zero independent automated review coverage and retain root hostile review plus fresh owner approval as separate gates.

### Reusable learning

- Hosted check conclusions and annotations are separate evidence. Inspect both.
- A third-party status named `success` can still mean no work was performed; inspect the underlying comment and review objects.

### No new domain learning

- Hosted verification changes evidence only. It does not change NitipCuy product, commercial, payment, logistics, moderation, delivery, or launch boundaries.

## 2026-07-25 17:07 WIB - Runtime domain boundaries require adversarial proof

### Verified

- TypeScript unions do not validate delivery, persistence, or provider data at runtime.
  - Evidence: `createPublishedTrip` accepted the runtime value `UNSUPPORTED` while the public type declared only Shop for me and Carry my item.
  - Impact: security and business enums require runtime allowlists at the domain boundary.
- `Date.parse` acceptance is not strict calendar validation.
  - Evidence: Node.js `24.18.0` normalized `2026-02-30` and the previous domain accepted it.
  - Impact: validate the date shape and round-trip the parsed UTC calendar value before accepting it.
- Valid ISO timestamp strings cannot be sorted chronologically by lexical text when offsets differ.
  - Evidence: `09:30+08:00` is an earlier instant than `09:00+07:00`, but the previous question sort placed it later.
  - Impact: compare parsed instants and retain a cross-offset ordering regression test.
- Public question identity is a trip-level invariant.
  - Evidence: duplicate normalized question IDs were previously accepted and would also produce duplicate presentation keys.
  - Impact: enforce uniqueness before freezing and exposing the public projection.

### Corrected assumption

- The earlier correction and learning covered answer-before-question validation across offsets but did not correct public-question sorting.
  - Evidence: answer validation used parsed instants while the collection sort still used `localeCompare`.
  - Impact: do not generalize one fixed timestamp comparison into a claim that every chronology path was corrected.

### Failed approach

- Invoking cached pnpm `11.17.0` through a Node `24.18.0` executable did not automatically propagate that toolchain into nested package-script commands.
  - Evidence: the outer frozen install, peer check, and audit used the requested versions, while `pnpm check` resolved ambient Node `26.0.0` and pnpm `9.15.0` and failed `engine-strict`.
  - Impact: run the full task graph through the exact Node and pnpm wrapper so child processes inherit the supported executable path; record the failed invocation separately.

### Deferred

- The correction does not resolve the identity mapping, dependency enforcement, transaction scope, payment lifecycle, idempotency, evidence integrity, or domain-versus-projection findings.
- IANA trip timezone identity and viewer-facing timezone labels remain separate model and experience work.

## 2026-07-25 17:15 WIB - Acceptance criteria must distinguish direction from implementation

### Verified

- Issue #3's identity implementation checkbox contradicted its own scope and exclusions.
  - Evidence: the issue requested identity and deny-by-default authorization direction without activating a provider, excluded real identity verification, and deferred the account vertical slice, while its checked criterion claimed identity subjects were already mapped to domain accounts.
  - Impact: acceptance language must state whether a capability is selected, documented, contract-modeled, simulated, persisted, provider-verified, or production-enabled.
- ADR 0003 already contained the correct identity sequence.
  - Evidence: it selects external standards-based identity mapped to an internal account, separates login from seller verification and bank ownership, and states that the public architecture shell uses no login adapter.
  - Impact: preserve that direction and implement mapping with the first persisted account slice rather than broadening issue #3.

### Accepted

- Identity mapping implementation remains deferred while its architecture direction stays binding.
  - Evidence: BurinSN explicitly approved correcting the acceptance criterion instead of introducing account persistence into the architecture probe.
  - Impact: issue #3 now checks documented direction only; the later account slice must implement provider-subject uniqueness, internal `AccountId`, assurance metadata, session revocation, and deny-by-default authorization.

### Reusable learning

- A checked acceptance criterion must never use present-tense implementation language for a future slice.
- When a hostile review reopens material work, final-check and lifecycle-complete checkboxes must be reopened until the final corrective head exists.

### No product-model change

- The correction does not change NitipCuy's roles, service modes, rates, transaction fee, payment direction, logistics direction, moderation duties, or platform-first sequence.

## 2026-07-27 17:10 WIB - Security and scale require layered, measurable evidence

### Verified

- OWASP ASVS 5.0.0 is the current stable ASVS release and provides a requirements basis for testing web-application security controls.
  - Evidence: [OWASP ASVS project](https://owasp.org/www-project-application-security-verification-standard/) checked 2026-07-27.
  - Impact: target Level 2 for the complete NitipCuy production web application and apply additional risk-based review to high-impact flows; do not claim current verification.
- Parameterized queries are the primary SQL-injection defense, while string-built queries, untrusted dynamic identifiers, unsafe raw APIs, and excessive database privilege remain independent risks.
  - Evidence: [OWASP SQL Injection Prevention](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html) and [Prisma raw-query documentation](https://www.prisma.io/docs/orm/prisma-client/using-raw-sql/raw-queries), checked 2026-07-27.
  - Impact: generated Prisma operations are the default, unsafe raw APIs are forbidden, and exceptional raw SQL requires tagged parameterization, allowlists, focused tests, review, and least-privilege roles.
- Session protection requires more than an authenticated page or signed cookie.
  - Evidence: [OWASP Session Management](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html) and [Next.js authentication guidance](https://nextjs.org/docs/app/guides/authentication), checked 2026-07-27.
  - Impact: require opaque secure cookies, rotation, idle and absolute expiry, server-side revocation, step-up, a central data-access boundary, and command-level authorization.
- Credential attacks must be controlled across independent dimensions rather than only one IP-and-account pair.
  - Evidence: [OWASP Credential Stuffing Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Credential_Stuffing_Prevention_Cheat_Sheet.html) and [Bot Management and Anti-Automation](https://cheatsheetseries.owasp.org/cheatsheets/Bot_Management_and_Anti-Automation_Cheat_Sheet.html), checked 2026-07-27.
  - Impact: combine shared network, account, session or device, action, target, challenge, step-up, anomaly, and spending controls while avoiding permanent lockout as the only response.
- Edge-provider DDoS mitigation does not remove application resource, database, provider-quota, or cost-exhaustion risk.
  - Evidence: [Vercel DDoS mitigation](https://vercel.com/docs/vercel-firewall/ddos-mitigation), [Vercel Firewall](https://vercel.com/docs/vercel-firewall), [OWASP denial-of-service guidance](https://cheatsheetseries.owasp.org/cheatsheets/Denial_of_Service_Cheat_Sheet.html), and [OWASP API4:2023](https://owasp.org/API-Security/editions/2023/en/0xa4-unrestricted-resource-consumption/), checked 2026-07-27.
  - Impact: require edge protection plus shared multi-axis limits, bounded payloads and queries, circuit breakers, provider-spend ceilings, alerts, and kill switches.
- A pooled serverless database can accept many clients without having capacity to execute the same number of simultaneous operations.
  - Evidence: [Neon connection-pooling guidance](https://neon.com/docs/connect/connection-pooling), checked 2026-07-27.
  - Impact: size web and worker connection budgets from active database capacity, query latency, working set, and contention rather than an advertised client-connection ceiling.

### Accepted

- Start with a stateless modular monolith, not microservices.
  - Evidence: NitipCuy has one product, one web client, one developer, and no measured independently scaled or isolated workload.
  - Impact: use horizontal web instances, pooled PostgreSQL, shared control state, private object storage, and a durable worker; extract only after measured evidence and a new ADR.
- Security and scale requirements travel with the feature that creates the risk.
  - Evidence: deferring sessions, upload safety, callbacks, transaction integrity, or resource bounds until launch would allow unsafe contracts to harden.
  - Impact: the first persisted and protected slices must implement and test their applicable controls while production-only provider and load evidence remains a later activation gate.

### Corrected

- Dependency-boundary enforcement is necessary but cannot establish application security.
  - Supersedes: any implication that mechanically correct imports would cover SQL injection, session compromise, DDoS, brute force, browser threats, uploads, callbacks, or operational recovery.
  - Impact: keep dependency enforcement as the next issue #3 code correction and maintain separate security, runtime, provider, load, and incident gates.
- “Support many users” is not a capacity target.
  - Supersedes: an unbounded qualitative scalability claim.
  - Impact: approve explicit concurrency, request mix, latency, availability, data, provider-quota, recovery, and cost targets before testing or making capacity claims.

### Deferred

- Exact pilot concurrency, traffic, latency, availability, data volume, provider quotas, cost ceilings, RPO, and RTO remain open until the closed pilot is bounded.
- Actual Vercel plan controls, Neon compute and pooling, identity provider, shared limiter or session store, object storage, scanner, worker, monitoring, and security-testing tools remain selection and runtime-verification work. Their documentation availability is not provider configuration evidence.

### Hosted evidence

- Required hosted application-quality and lifecycle workflows passed without annotations at architecture-amendment head `7522bf8d2076101cdc78245f390818eb6125252f`.
  - Evidence: GitHub Actions runs `30256384832` and `30256384917`.
  - Impact: the committed documentation reproduces under project CI, but this remains source and governance evidence rather than runtime security or capacity evidence.
- A third-party review marked “in progress” is not review coverage.
  - Evidence: CodeRabbit run `fe94a2a4-4776-497f-b797-caae88ce6a39` remained pending after the bounded wait and created no review object or finding by 17:10 WIB.
  - Impact: disclose the pending state and continue to require direct hostile review; never translate status presence into approval.

### No product-model change

- The security and scale baseline does not change NitipCuy's roles, Shop for me and Carry my item services, seller-defined rates, platform fee direction, DOKU conditional preference, logistics direction, moderation responsibilities, or platform-first sequence.

## 2026-07-27 18:27 WIB - Security controls need explicit failure and lifecycle contracts

### Verified

- Encryption at rest is not a complete sensitive-data protection or key-management design.
  - Evidence: [OWASP Cryptographic Storage](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html) and [OWASP Key Management](https://cheatsheetseries.owasp.org/cheatsheets/Key_Management_Cheat_Sheet.html), checked 2026-07-27, require threat-modelled encryption placement plus key generation, storage, rotation, backup, compromise, recovery, and decommissioning controls.
  - Impact: NitipCuy now separates provider encryption, application envelope encryption, data-encryption keys, key-encryption keys, secrets, protected data, encrypted backups, restore, retention, and deletion.
- High-impact accounts and actions cannot depend on whether a provider happens to offer stronger authentication.
  - Evidence: [OWASP MFA guidance](https://cheatsheetseries.owasp.org/cheatsheets/Multifactor_Authentication_Cheat_Sheet.html), checked 2026-07-27, recommends MFA for administrative and high-privilege users and identifies passkeys as phishing-resistant.
  - Impact: provider capability is now a selection gate for protected assurance and recovery, not an optional enhancement.
- Reverse-proxy deployment requires an application-owned trust boundary.
  - Evidence: [Next.js self-hosting guidance](https://nextjs.org/docs/app/guides/self-hosting), checked 2026-07-27, recommends a reverse proxy for malformed requests, slow attacks, payload limits, and rate limiting.
  - Impact: NitipCuy additionally binds trusted proxy sources, forwarding-header overwrite, canonical host/origin/client-IP interpretation, direct-origin denial, and forged-header tests.
- Safe zero-downtime database change requires application-version compatibility, not only a reversible migration file.
  - Evidence: [Prisma expand-and-contract guidance](https://www.prisma.io/docs/guides/database/data-migration), checked 2026-07-27, separates additive expansion, data migration, and later contraction.
  - Impact: old and new web and worker versions, backfills, queued payloads, rollback, forward-fix, and destructive-cleanup timing are now part of the deployment contract.

### Corrected

- “Passkeys, MFA, or step-up where the provider supports the risk tier” was too weak.
  - Supersedes: the conditional language in the first security baseline.
  - Impact: mandatory protected-flow assurance now constrains provider selection and cannot silently downgrade during recovery or outage.
- “Define dependency criticality and failure behavior” was not an actionable outage policy.
  - Supersedes: the generic availability bullet in the first scalability baseline.
  - Impact: the architecture now names the exact public-read degradation boundary and the protected actions that fail closed when session, authorization, rate-limit, risk, audit, or idempotency guarantees are unavailable.
- A public/private cache split did not by itself address cache poisoning, cache deception, concurrent misses, hot keys, unsafe staleness, or origin stampede.
  - Supersedes: treating cache eligibility and invalidation as the whole cache-safety contract.
  - Impact: cache keys, response classification, fill concurrency, staleness, invalidation, failure, and load evidence are now binding requirements.

### Reusable learning

- Name the failure mode for every shared security dependency. “Highly available” is not a substitute for deciding whether each route rejects, pauses, queues, serves approved stale public data, or falls back to bounded authority.
- Encryption requirements must cover the data lifecycle and the key lifecycle together. Rotation without restore and deletion evidence is incomplete.
- Rolling deployments create a temporary distributed system even inside a modular monolith: schema, web, worker, messages, and retries can run at different versions.
- Cache design is part of both security and capacity engineering because a poisoned key or synchronized miss can create privacy failure, incorrect content, or a database denial of service.

### Deferred

- Exact identity, proxy/edge, shared control-state, KMS, encryption format, cache, database, and deployment-provider selections remain future governed work.
- The correction reaches the designed evidence level only. Implementation, source tests, runtime configuration, load evidence, provider verification, and incident exercises remain required with the features and environments that create those risks.

### Hosted evidence

- The complete six-gap documentation correction reproduced on the supported hosted toolchain.
  - Evidence: application-quality run `30262412048` and lifecycle run `30262412059` passed with zero annotations at exact checkpoint `609c23b8bf96be995a9c9347a442d8abaca59ff6`.
  - Impact: this is source and governance evidence only; it does not raise any of the six controls above the designed level.
- No independent automated review covered the correction.
  - Evidence: pull request #4 has no review object or review decision, and CodeRabbit's only current record remains the earlier rate-limited run `86ff3d62-b1f7-4429-839e-e07fd4402c20`.
  - Impact: retain direct hostile review and fresh BurinSN approval as separate gates; do not infer review coverage from workflow success.

### No product-model change

- This correction does not change NitipCuy's roles, Shop for me and Carry my item services, seller-defined rates, platform fee direction, delivery model, moderation responsibility, or platform-first sequence.

## 2026-07-28 06:56 WIB - Price evidence and fulfilment evidence are different contracts

### Accepted

- A fixed-price Shop for me order requires an actual-product photograph before `PURCHASED`, but does not routinely require the seller's receipt to be shown to the buyer.
  - Evidence: direct BurinSN product decision on 2026-07-28.
  - Impact: the buyer agrees to the final seller price before payment; the platform protects evidence of item acquisition without converting the order into mandatory cost-plus pricing or exposing the seller's margin.
- A receipt may be private evidence only when the seller explicitly chose actual cost plus a service fee, or a proportionate dispute, fraud, or compliance review requires it.
  - Evidence: direct BurinSN alignment plus the existing private-evidence boundary.
  - Impact: acquisition-cost evidence has a disclosed purpose, access boundary, retention rule, and pricing consequence rather than becoming a routine upload.
- Carry my item requires collection photographs and measured weight before `COLLECTED`; a material variance requires customer approval before fulfilment continues.
  - Evidence: direct BurinSN product decision on 2026-07-28.
  - Impact: collection and charge changes become evidence-gated rather than seller-declared status changes.
- A trip's ordering window is independent from its source-service and physical-travel milestones.
  - Evidence: the approved example allows a 2–8 August ordering window within a 1–10 August trip and also allows advance PO before the trip.
  - Impact: model exact source-service start and end, order open and close, transport departure, and estimated arrival instead of one ambiguous trip date.

### Corrected

- “Purchase receipt or store confirmation” was too broad as a routine Shop for me evidence rule.
  - Supersedes: the optional but undifferentiated receipt item in the first order lifecycle.
  - Impact: actual-product photo is the normal buyer-visible gate; receipt handling now depends on the accepted pricing model or a private exceptional purpose.
- Closing a trip only after all orders are delivered would keep stale checkout open too long.
  - Supersedes: conflating request acceptance, physical travel, fulfilment, and archival.
  - Impact: close new orders at the authoritative order cutoff or earlier ineligibility, continue accepted orders separately, and archive only after trip completion plus eligible terminal order states.
- A public `PublishedTrip` cannot be the future transaction authority.
  - Supersedes: the previously underspecified relationship between the issue #3 model and a persisted trip.
  - Impact: future `TripOffer` owns mutable eligibility and capacity; `PublishedTrip`, public history, and private dashboards are rebuildable projections.

### Reusable learning

- Price transparency means the customer understands and accepts the final charge and formula; it does not always mean exposing the seller's cost or margin.
- A cryptographic hash identifies exact evidence bytes. It does not establish authenticity, price, payment status, ownership, or legality without surrounding controls.
- Time-based UI states are advisory. Every protected command must evaluate the authoritative current instant, status, capacity, and eligibility again.
- When two activities overlap, use separate state dimensions. Offer availability, physical travel, and order fulfilment cannot be represented safely as one linear status.

### Deferred

- Authoritative trip persistence, capacity reservation, order workspaces, evidence upload and verification, private receipt handling, and evidence-gated status transitions remain later governed implementation.
- Exact actual-cost receipt redaction, retention, reviewer access, and dispute rules remain category and policy work before those flows activate.

### Hosted evidence

- Implementation checkpoint `f4b635abba9fcdf548441254d3da5e29a645e492` reproduced on the supported hosted toolchain.
  - Evidence: application-quality run `30316681999` and lifecycle run `30316681979` passed with zero annotations.
  - Impact: the public projection and its tests have source, build, local-runtime, and hosted-workflow evidence; the deferred authoritative order and evidence flows remain unimplemented.
- A tracked lifecycle file cannot truthfully contain the SHA or hosted run IDs of the commit that contains that same text.
  - Evidence: a commit identifier is calculated only after its content is fixed, and hosted runs exist only after push.
  - Impact: record the immutable implementation predecessor in the lifecycle reconciliation, then verify the reconciliation commit live and place its exact evidence in the pull request without creating an endless self-referential commit loop.

## 2026-07-28 13:38 WIB - Dependency rules need syntax and manifest enforcement

### Accepted

- The architecture gate validates both declared dependencies and actual parsed module edges.
  - Evidence: package manifests alone did not prevent an allowed-direction or forbidden-direction cross-package relative path.
  - Impact: a change must satisfy the manifest graph, public workspace exports, and source-edge rules together.
- Unverifiable module loading fails closed in governed source.
  - Evidence: a computed dynamic import or `require` target cannot be assigned to a trusted layer during static review.
  - Impact: module specifiers must be static strings; intentional runtime plugin loading would require a separately designed allowlist and boundary.

### Corrected

- Regular-expression import scanning was rejected as the enforcement design.
  - Supersedes: the earlier manual stale-language and dependency-direction scans used only as review evidence.
  - Impact: the gate uses the pinned TypeScript parser to cover imports, exports, type expressions, triple-slash references, dynamic imports, and require forms without treating comments as module edges.
- Treating every client application reference as a runtime violation was too broad.
  - Evidence: delivery may legitimately consume application contracts as types, while runtime use cases still belong behind the server composition boundary.
  - Impact: type-only application contracts remain allowed; runtime application/adapters and server-source imports from client modules fail.

### Reusable learning

- Architecture tests need positive cases as well as rejection fixtures; otherwise a “secure” rule can quietly make the accepted dependency direction unusable.
- Deep workspace imports are a boundary bypass even when they point inward because they avoid the package's reviewed public export.
- A source symlink can defeat lexical path checks, so governed source roots reject symlinks rather than following them.
- A production runtime import declared only in `devDependencies` can pass a development install but disappear from a production install, so runtime edges require a runtime dependency section.

### Deferred

- The checker does not claim runtime authorization, transaction, provider, data-flow, or deployment security.
- Any future plugin system, generated source outside the governed roots, new workspace package, or new alias requires an explicit architecture-gate update and adversarial tests.

### Hosted evidence

- Implementation checkpoint `330b10a85adbd83c151eafdfc0a5ca6d0f36e9ae` reproduced on the supported hosted toolchain.
  - Evidence: application-quality run `30336136426` and lifecycle run `30336136464` passed with zero annotations.
  - Impact: dependency enforcement is implemented and source-tested in both local and hosted quality paths; it does not raise unrelated transaction, payment, idempotency, evidence, or production controls above their actual evidence levels.

## 2026-07-28 18:21 WIB - A callback boundary is not transaction evidence

### Accepted

- The architecture probe exposes no transaction port until a persisted write slice can supply transaction-scoped resources.
  - Evidence: the removed `execute(work)` callback supplied no repository, ledger, audit, inbox, or outbox scope and the adapter only invoked the callback.
  - Impact: issue #3 no longer suggests that callback nesting provides commit, rollback, isolation, shared connection use, or concurrency control.
- The first persisted write slice must introduce a database-backed transaction-scoped unit of work.
  - Evidence: NitipCuy consistency-critical commands require authoritative state, balanced ledger entries, success audit, and required outbox records to commit or roll back together.
  - Impact: the callback receives only writers bound to one PostgreSQL transaction; independently constructed write adapters cannot be mixed into the consistency boundary.
- Provider and object-storage network calls stay outside the database transaction.
  - Evidence: a network timeout or ambiguous provider result cannot be rolled back by PostgreSQL and holding locks across remote latency harms correctness and capacity.
  - Impact: use explicit pending, inbox, outbox, worker, and reconciliation states around short database transactions.

### Corrected

- `PassthroughTransaction` was not a safe deterministic transaction adapter.
  - Supersedes: treating successful execution of an arbitrary asynchronous callback as a transaction contract.
  - Impact: the interface, adapter, export, and misleading test are removed rather than preserved as unused future scaffolding.
- An in-memory replacement in issue #3 would create unjustified confidence.
  - Evidence: this slice has no authoritative write aggregate, ledger, shared transactional repository set, or database adapter on which to prove atomicity and contention.
  - Impact: defer implementation while making the future proof obligations explicit and reviewable.

### Reusable learning

- An abstraction should be removed when it advertises a guarantee its implementations cannot enforce.
- Transaction scope is a resource-ownership rule, not merely a callback shape.
- Success audit and outbox records belong to the same commit as the state they describe. Failed or denied attempt reporting may occur after rollback through an explicitly separate path, but it must never claim successful mutation.
- Unit tests can validate orchestration rules, but commit, rollback, locking, isolation, and concurrent last-capacity behavior require integration tests against a disposable real database.

### Deferred

- The database-backed transaction-scoped unit of work, PostgreSQL adapter, ledger, authoritative write repositories, and transaction integration tests belong to the first persisted write slice.
- Exact Prisma transaction mechanics, isolation level, retry classification, and repository scope shape remain implementation decisions within the binding atomicity and timeout requirements.

### No product-model change

- This correction does not change NitipCuy's roles, service modes, seller-set pricing, platform fee, trip timelines, fulfilment evidence, payment direction, logistics direction, moderation duties, or platform-first delivery sequence.
