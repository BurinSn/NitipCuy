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

### Hosted evidence

- Implementation checkpoint `bf564436bf54815782501bc10280074f16a23fa9` reproduced on the supported hosted toolchain.
  - Evidence: application-quality run `30354861825` and lifecycle run `30354861680` passed with zero annotations.
  - Impact: the false transaction capability is removed and the deferral contract is source- and hosted-workflow-verified; PostgreSQL transaction atomicity remains unimplemented and unverified.
- A green integration status is not a review object.
  - Evidence: CodeRabbit was green on the implementation checkpoint but pull request #4 still had no review object, review decision, or CodeRabbit finding.
  - Impact: retain direct hostile review and fresh BurinSN approval as separate merge gates.

## 2026-07-29 17:51 WIB - Payment requests are not financial outcomes

### Accepted

- Payment submission, customer action, provider observation, and internal reconciliation are distinct facts.
  - Evidence: an API can accept a request before the customer pays, and a timeout can leave the provider outcome unknown.
  - Impact: initiation, release, and refund return accepted-for-processing, rejected, or unknown receipts; later inspection determines observed financial state.
- Collection, hold, release, refund, settlement, and chargeback are separate dimensions.
  - Evidence: collection may succeed while hold fails, and settlement or chargeback activity may occur after an earlier valid hold.
  - Impact: avoid one giant optimistic status and preserve contradictory evidence for reconciliation.
- Provider callbacks are wake-up signals, not mutation commands.
  - Evidence: callback delivery can be duplicated, delayed, replayed, forged, or out of order.
  - Impact: authenticate and deduplicate future callbacks, then inspect and reconcile provider state before any authoritative transition.

### Corrected

- Payment initiation no longer returns an immediately held payment.
  - Supersedes: the earlier `createHeldPayment` contract and mock that returned `HELD`.
  - Impact: payment protection requires exact collected-amount and confirmed-hold observations with no contradictory activity.
- Accepted release and refund requests no longer imply completion.
  - Supersedes: `void` release and refund methods that could not represent rejection, timeout, pending work, or reconciliation.
  - Impact: callers retain a non-terminal operation receipt and must observe the later result.
- The payment mock no longer has a successful default.
  - Evidence: an unconfigured financial mock can make missing test setup look like successful payment behavior.
  - Impact: every payment response or observation used by a test must be configured explicitly.

### Reusable learning

- Use the sequence `requested -> accepted or rejected or unknown -> observed -> reconciled -> authoritative transition`; never skip directly from requested to completed.
- A confirmed collection plus failed hold is not ordinary payment failure because customer money may already have moved; it requires reconciliation.
- Exact amount comparison belongs in protection assessment. A payment status alone cannot prove that the correct order amount was protected.
- A provider payment reference cannot be the only lookup key because a timed-out initiation may have succeeded without returning it. Create a stable internal payment-attempt ID before the external call and retain it through inspection and signals.
- Reconciliation must compare the observed payment-attempt ID to the expected attempt; a valid payment of the same amount for another order is not protection for this order.
- A confirmed hold label without a held amount is insufficient. Protection requires the exact expected amount in both collected and held evidence.
- A confirmed collection and hold still require a retained provider payment reference; otherwise later inspection, release, refund, and support recovery are unsafe.
- Reconciliation compares status fields with amount fields. A non-null refunded or settled amount cannot be ignored merely because its paired status still says not requested or not started.
- Customer instructions such as a redirect, QR payload, or Virtual Account number are delivery details for completing payment, not evidence of payment.
- Unknown and contradictory financial evidence must fail closed without erasing the evidence or blindly retrying.

### Deferred

- Idempotency-key storage and replay semantics, callback authentication and durable inbox handling, retry scheduling, ledger posting, order mutation, and complete release/refund/settlement assessment remain governed future work.
- Provider-specific URL, QR, Virtual Account, signature, expiry, error, and status mapping belongs in an approved adapter after the DOKU gates are answered.

### No product-model change

- This correction does not change NitipCuy's roles, Shop for me or Carry my item behavior, seller-set pricing, platform fee, trip timelines, fulfilment evidence, logistics direction, moderation duties, or platform-first sequence.

### Hosted evidence

- Implementation checkpoint `fae92e55fc1117b1b78fc7add244e8ccb940c2e3` reproduced on the supported hosted toolchain.
  - Evidence: application-quality run `30446270570` and lifecycle run `30446270568` passed with zero annotations.
  - Impact: the asynchronous payment contract is source-tested and hosted-workflow-verified without implying DOKU compatibility, callback processing, ledger correctness, real money movement, or complete release/refund/settlement reconciliation.
- External issue and pull-request text must distinguish a green integration from independent review.
  - Evidence: pull request #4 was mergeable and clean and CodeRabbit was green, but no review object, review decision, or CodeRabbit finding existed.
  - Impact: retain direct hostile review, final complete-base-diff review, and fresh BurinSN approval as separate merge gates.

## 2026-07-31 09:20 WIB - Safe idempotency is more than storing a key

### Accepted

- Idempotency identity is `authorization scope + operation + caller key + canonical payload fingerprint`.
  - Evidence: a globally keyed result cache can collide across accounts, orders, or endpoint semantics.
  - Impact: authorize first, scope payment and dispatch to their order aggregate, scope evidence to its owner account, and never use replay as an ownership check.
- Exact completed duplicates replay the stored result; changed payloads conflict.
  - Evidence: executing an exact duplicate repeats a side effect, while silently accepting a changed payload hides a caller defect or attack.
  - Impact: fingerprint every semantic field and reject key reuse with a different fingerprint.
- Concurrent and ambiguous duplicates are different states.
  - Evidence: a matching command may still be executing, or it may have thrown after a provider accepted it.
  - Impact: active duplicates fail as in-progress; unexpected execution failures become recovery-required and cannot be blindly retried.
- Expected provider ambiguity is a result, not an exception.
  - Evidence: a timeout may yield an `UNKNOWN` receipt that remains inspectable through the stable payment-attempt ID.
  - Impact: store and replay `UNKNOWN`, then reconcile; reserve recovery-required for unclassified failures.

### Corrected

- Removed automatic claim release after execution errors.
  - Supersedes: the first local implementation, which released any thrown execution for immediate retry.
  - Impact: a provider or storage action that may have succeeded cannot be duplicated merely because the local response path failed.
- Added explicit idempotency scopes.
  - Supersedes: the first local store key of only `operation + key`.
  - Impact: stored results cannot replay across the tested account or order boundary.
- Moved deterministic validation before claim creation.
  - Evidence: invalid metadata and missing mock configuration are known before any external side effect.
  - Impact: invalid local input does not create a false ambiguous-operation record.

### Reusable learning

- Never release an idempotency claim after a generic exception unless the system can prove no side effect occurred.
- Do not let stale in-progress or recovery-required financial records silently expire into permission to execute again.
- Store a clone of the result and return a clone on replay so caller mutation cannot corrupt later responses.
- Start completed-result retention when completion is durably recorded, not when execution begins.
- Fingerprints must be canonical, stable across instances, bounded, and cover semantic binary content as well as visible metadata.
- Canonical fingerprint encodings need explicit type tags and plain-object restrictions; reserved-looking object keys must not collide with encoded `bigint`, bytes, arrays, or primitives.
- An unavailable idempotency authority is a fail-closed dependency for protected mutations.
- Process-local maps can prove contract semantics but cannot prove multi-instance safety, persistence, bounded resource use, atomic database behavior, or operational recovery.

### Deferred

- A production implementation needs authenticated scope derivation, shared durable atomic state, sensitive-result protection, cleanup, monitoring, operator recovery, and disposable-database concurrency tests.
- Provider-native idempotency behavior and retention must be verified against the selected DOKU and logistics contracts.
- Callback replay protection remains a separate signed inbox and reconciliation concern.

### No product-model change

- This correction changes retry safety only. It does not change roles, seller-defined pricing, service modes, trip timelines, platform fees, evidence requirements, logistics choices, or order-state UX.

### Hosted evidence

- Idempotency implementation checkpoint `115ecfeb7f4b0876f56ae43d71cfa378f26497fe` reproduced on the supported hosted toolchain.
  - Evidence: application run `30599067671` and lifecycle run `30599067251` passed with zero annotations.
  - Impact: the scoped replay, conflict, concurrency, recovery, expiry, authority-outage, and cross-scope contracts are source- and hosted-workflow-verified without implying authenticated, shared, persistent, provider-native, or production idempotency.
- GitHub integration status remains separate from review coverage.
  - Evidence: pull request #4 was clean, but no review object, review decision, review thread, or line finding existed; CodeRabbit was paused and limited to its Free-plan summary/walkthrough.
  - Impact: retain direct hostile review, evidence-integrity correction, final exact-head review, and fresh BurinSN approval as separate gates.
- The idempotency lifecycle reconciliation also reproduced on the supported hosted toolchain.
  - Evidence: lifecycle head `abe7cd0bdecfd4df3565cfd0e968f4ab461f39f0` passed application run `30599264338` and lifecycle run `30599264345` with zero annotations.
  - Impact: evidence-storage integrity, final complete-base-diff review, and fresh owner approval—not idempotency documentation—are now the active issue #3 merge gates.

## 2026-08-05 14:00 WIB - A passing severity-threshold audit is not a zero-advisory audit

### Verified

- The exact PostCSS `8.5.18` override became vulnerable after GitHub published `GHSA-fxqj-rqcc-2cmp` for all releases through `8.5.22`.
  - Evidence: the 2026-08-05 exact-toolchain production audit reported one moderate advisory on `apps__web>next>postcss`; the JSON result identified `8.5.23` as the first patched version.
  - Impact: the override and lockfile now select exact PostCSS `8.5.23`.
- `pnpm audit:prod` returned success while still printing the moderate advisory.
  - Evidence: the script uses `--audit-level high`, which controls failure severity rather than suppressing or eliminating lower-severity findings.
  - Impact: inspect audit content and vulnerability counts separately from the process exit code before claiming no known vulnerabilities.

### Corrected

- PostCSS `8.5.18` is no longer treated as the current fully patched override.
  - Supersedes: the 2026-07-25 conclusion that `8.5.18` satisfied the then-known PostCSS advisories and release-age constraint.
  - Impact: time-stamped dependency evidence remains historical; current merge evidence must use a fresh advisory database and exact lockfile.

### Reusable learning

- An exact security override is an expiring decision, not a permanent safe version.
- A hosted workflow that passed before an advisory database update does not prove that the same lockfile remains advisory-free later.
- Audit exit thresholds and zero-vulnerability claims are different contracts. Record both the exit result and the severity counts.

### Deferred

- The documentation-only lifecycle checkpoint, external reconciliation, and its hosted exact-head verification remain pending; the implementation passed complete local and hosted exact-head gates.
- Removing the override entirely remains dependent on a reviewed Next.js dependency graph that resolves patched PostCSS without weakening compatibility.

### No product-model change

- This dependency correction changes no role, service mode, pricing rule, trip behavior, evidence requirement, payment direction, provider choice, or roadmap stage order.

### Hosted evidence

- Implementation checkpoint `a086dcf2b9060394756b2bf4ddc57994d7b158c8` reproduced on the supported hosted toolchain.
  - Evidence: application run `30983580593` and lifecycle run `30983580611` passed with zero annotations.
  - Impact: the exact PostCSS override is advisory-free under the current audit database and source/build verified without changing product behavior or activating production infrastructure.

## 2026-08-05 14:19 WIB - Evidence identity must be observed outside the application command

### Accepted

- The application command carries authorization-scoped identity and opaque references, not raw file content or client-declared file truth.
  - Evidence: the removed storage command let a caller supply content, MIME, byte length, and SHA-256 together, so equality checks could establish only internal consistency between untrusted claims.
  - Impact: upload bytes and client claims now enter only the external quarantine fixture; the application sees the upload intent and server observation.
- Promotion requires both server-observed metadata and a clean scanner result bound to the same digest.
  - Evidence: a clean label without byte identity could describe a different object, while a matching digest without a clean result says nothing about scanner disposition.
  - Impact: pending, unavailable, rejected, and digest-mismatched scanner states all fail closed before acceptance.
- Upload intent, quarantine object, accepted object, and retention deletion are distinct lifecycle references.
  - Evidence: one generic storage reference cannot safely express short-lived write authority, quarantined bytes, accepted private evidence, and deletion authority.
  - Impact: each transition verifies the server-generated reference that belongs to its current state.

### Corrected

- A promoted upload reference is terminal even after quarantine bytes are removed from the in-memory record.
  - Supersedes: the first local adapter version, which cleared quarantine bytes at acceptance but would then accept another upload through the still-known upload reference.
  - Impact: replacement and post-acceptance upload are denied, and scanner writes cannot resume after acceptance.
- Client MIME and digest claims are not retained merely to prove that the adapter ignores them.
  - Evidence: adversarial tests can pass false claims while accepted metadata remains derived exclusively from copied bytes.
  - Impact: fixture state does not accidentally become a future source of caller-trusted truth.
- Accepted evidence preserves its scanner reference after promotion.
  - Evidence: a digest without the decision reference loses the provenance needed to investigate which scan accepted the bytes.
  - Impact: accepted metadata keeps both the server-observed byte identity and the bound clean-scan reference.
- Runtime boundaries validate classifications, scan statuses, and media policy values rather than trusting TypeScript unions.
  - Evidence: JSON, configuration, and adapter inputs do not receive compile-time guarantees.
  - Impact: unsupported values fail with deterministic validation before creating lifecycle state.

### Reusable learning

- Do not put bytes, a claimed digest, and a claimed byte length in the same trusted application command and call their agreement server verification.
- A scanner result must name the exact observed bytes, not only the object key or an unbound status.
- Copy mutable byte buffers at the storage boundary and make a quarantine object write-once.
- When promotion clears or moves content, preserve a terminal consumed state; `content === null` must not mean the upload slot is reusable.
- Idempotency prevents duplicate commands, but it does not replace ownership checks, lifecycle-state checks, object-reference binding, or retention policy.
- A file digest proves byte identity only. Authenticity, order relevance, price, legality, and duplicate-image disposition need separate evidence and policy controls.

### Deferred

- Production needs authenticated owner and case scope, signed direct-to-quarantine upload, robust decoding and dimensions, malware scanning, safe re-encoding where suitable, duplicate-image review, durable metadata, rejected-object cleanup, accepted-object retention, backup expiry, deletion verification, metrics, and operational recovery.
- Order association and evidence-gated order transitions remain outside issue #3 and must be implemented with the persisted order slice.
- The deterministic adapter is source evidence only; it provides no storage-provider, scanner-provider, runtime-upload, load, incident, or production-deletion proof.

### No product-model change

- This correction implements the accepted evidence boundary without changing who may sell, the two service modes, seller-defined prices, the transaction-fee direction, required evidence classes, or roadmap order.

### Hosted evidence

- Evidence implementation checkpoint `f57ef166db9bf6d71e7b2b5b9505f8c71cf38b84` reproduced on the supported hosted toolchain.
  - Evidence: application run `30985369642` and lifecycle run `30985369587` passed with zero annotations; the pull request remained open, clean, and mechanically mergeable with no review object or approval.
  - Impact: the evidence lifecycle is source- and hosted-workflow-verified without implying authenticated upload, real storage or scanning, durable state, order integration, production deletion, independent review, or owner approval.
- Evidence lifecycle reconciliation checkpoint `44359cea5c23cc62bc0ef065682c052613ca0ef1` also reproduced on the supported hosted toolchain.
  - Evidence: application run `30985575000` and lifecycle run `30985575004` passed with zero annotations; issue comment `5188962019` and pull-request comment `5188964841` were posted and read back.
  - Impact: all issue #3 acceptance claims are reconciled, but clean checks and mechanical mergeability still do not grant BurinSN approval.

## 2026-08-06 07:16 WIB - Technical readiness and merge authority are separate gates

### Accepted

- A direct owner instruction given after the exact pull-request scope, immutable head, and hosted evidence are presented can resolve the merge-authority gate even when GitHub has no formal review object.
  - Evidence: final review-state head `893e46b30718368f1260e837d12147ee5edab005` passed application run `30985838757` and lifecycle run `30985838654` with zero annotations; BurinSN then explicitly directed Codex to proceed.
  - Impact: record the conversation approval in the lifecycle documents, but still verify the resulting documentation-only head before using that authority.
- Approval does not make a changed head self-validating.
  - Evidence: recording approval changes the pull-request head even though it changes no application behavior.
  - Impact: rerun both required hosted gates and inspect annotations before merge; a material finding or implementation drift requires renewed review.

### No product-model change

- This governance checkpoint changes no role, service mode, pricing rule, evidence rule, provider direction, architecture boundary, or roadmap order, and grants no deployment, provider, production, payment, or visual authority.

## 2026-08-07 12:38 WIB - Persisted identity authority must remain narrower than identity proof

### Accepted

- Google issuer plus immutable subject, not email, is the external-identity key.
  - Evidence: two verified Google proofs with the same email but different subjects create separate internal accounts, while repeated proof for one issuer and subject resolves the same account.
  - Impact: verified email is checked transiently and is neither persisted nor an account-linking authority.
- A successful Google login establishes base assurance only.
  - Evidence: the normal session-creation API no longer accepts a caller-selected assurance value, while moderation requires both a persisted privileged capability and a persisted phishing-resistant session.
  - Impact: the production HTTP composition cannot perform moderation until a separately governed privileged step-up and recovery flow exists.
- Session validation at the delivery boundary is insufficient for protected mutation.
  - Evidence: revocation can occur after a request first resolves its actor and before its database write begins.
  - Impact: every protected use case revalidates the exact persisted session, account version, assurance, state, ownership, and capability inside its serializable transaction.
- Identity data minimization is an application invariant, not only a privacy-policy promise.
  - Evidence: the schema stores provider, issuer, subject, and whether the email claim was verified, but no email address.
  - Impact: the first slice cannot accidentally query, display, or link by an email it never retained.

### Corrected

- Do not let a generic session factory accept arbitrary assurance.
  - Supersedes: the first local adapter form, where a caller could pass `PHISHING_RESISTANT` into normal session creation.
  - Impact: privileged assurance can only be represented by controlled persisted fixtures until a real step-up adapter is approved and implemented.
- Do not consume one-use OAuth state before verifying the callback destination.
  - Supersedes: the first callback ordering, which validated the callback URL after consuming the attempt.
  - Impact: an invalid callback request cannot destroy a legitimate pending login attempt.
- Do not leave undecryptable OAuth-attempt ciphertext in an apparently live state.
  - Supersedes: returning a generic failure while retaining the pending expiry.
  - Impact: corrupt sealed material is marked terminal and cannot become a persistent retry surface.
- Do not treat globally persisted OAuth state as browser binding.
  - Supersedes: the first local callback form, where any browser presenting the valid pending state could consume the attempt and receive the resulting NitipCuy session.
  - Impact: a second 256-bit value is kept only in a short-lived host-only cookie and matched by digest during atomic consumption, so a callback prepared in another browser fails closed.
- Do not duplicate operational transaction constants or clock samples across one atomic event.
  - Evidence: review found three copies of the same serializable transaction budget and separate state/audit/outbox timestamps.
  - Impact: one transaction-options authority and one sampled event time now keep operational policy and emitted facts consistent.

### Failed approach

- The ambient shell used Node.js `26.0.0` and pnpm `9.15.0`, so the initial Prisma command failed and was excluded from evidence.
  - Recovery: execute the repository commands through exact Node.js `24.18.0` and pnpm `11.17.0`, then record only those results.
- Waiting on the first PostgreSQL readiness indication in the disposable-container test caused an early connection reset.
  - Recovery: wait for the later server-ready log emitted after initialization restarts before applying the clean migration.

### Reusable learning

- Identity proof, internal account identity, session authority, assurance, and authorization are separate layers; combining them makes privilege escalation and revocation races easier to miss.
- A duplicated validation is intentional when it protects a different trust boundary. DRY applies to repeated policy and implementation, not to removing domain, adapter, and database defense in depth.
- One-use encrypted OAuth state needs confidentiality, integrity, expiry, replay prevention, browser-initiator binding, and deterministic terminal handling for corruption.
- Disposable database tests should fail rather than fall back to a development or production database when containers are unavailable.
- Immutable issuer-subject uniqueness still needs a bounded transaction-conflict policy: two valid first logins can race after both observe no identity. Retry only known serialization or unique conflicts, rerun the whole database transaction, and keep all provider calls outside it.

### Deferred

- Real Google client configuration and callback verification, browser behavior, phishing-resistant step-up and recovery, managed encryption-key custody and rotation, multi-axis rate limits, trusted-proxy handling, observability and redaction, guarded Strix execution, managed-database compatibility, load, incident, and production evidence remain separate gates.

### No product-model change

- This slice implements the already accepted marketplace path and Google-only access direction. It does not change roles, seller-defined pricing, the two service modes, transaction-fee direction, order/evidence rules, payment/provider choices, or roadmap stage order.

## 2026-08-07 12:56 WIB - Pull-request creation produced no new product learning

### Verified

- Pull request #6 accurately exposed the locally verified issue #5 scope and kept hosted-check and owner-approval boxes unchecked.
- Recording the PR number creates a newer documentation head, so the workflow results on implementation head `815414662f509f7ae960f44917e0bddfbc7cf4ef` cannot be reused as final exact-head evidence.

### No new product or architecture learning

- This checkpoint changes only GitHub and lifecycle state. The Google-only identity direction, persisted marketplace boundary, security controls, Stage 1 order, and all exclusions remain unchanged.

## 2026-08-07 13:00 WIB - Summary status is not independent review

### Verified

- CodeRabbit returned a successful status and a high-level walkthrough, but its own comment says the line-review limit was reached.
- GitHub contained zero pull-request review objects, zero review comments, and no review decision at reviewed head `912bdd3404327cf2615c2033ddc045c354bf3de3`.

### Reusable learning

- Treat a review integration's own limitation text as authoritative for what it did. A successful summary status does not become an independent code review or product-owner approval.

### No product-model change

- Hosted verification and review-state reconciliation change no NitipCuy product, identity, security, architecture, or roadmap decision.

## 2026-08-07 13:23 WIB - Pull request #6 merge authority is explicit and bounded

### Accepted

- BurinSN's direction to proceed, given after the final PR purpose, exact head, hosted checks, review limitations, and exclusions were presented, resolves the product-owner merge-authority gate for pull request #6.
- Recording that authority creates a new documentation head. Both required workflows must pass on that approval-state head before the approved squash merge is executed.

### Reusable learning

- Owner approval applies to the reviewed scope and merge operation; it does not authorize Google provider configuration, guarded Strix, deployment, production activation, payment movement, or another external action.

### No product-model change

- This governance record changes no identity, marketplace, security, architecture, commercial, provider, or roadmap decision.

## 2026-08-07 13:41 WIB - Review visibility must not become scanner authority

### Accepted

- Every material issue now declares the intended DRY scope and whether guarded Strix is required; every PR exposes the matching final state.
- An exact-head DRY verdict is merge-eligible only as `CLEAN` or `CLEAN WITH NOTES`.
- Required Strix work is merge-eligible only after independent triage or verified remediation. Non-required work must record a concrete rationale rather than silently omitting the scanner.

### Reusable learning

- Review progress, authorization, and execution are different facts. A visible `REQUIRED` state cannot create permission to scan, and a CI token cannot substitute for exact-target user authority.
- Exact-head evidence is safest in an editable PR record: a new commit invalidates the recorded SHA without requiring a self-referential documentation commit.
- A policy validator can make omissions and contradictions fail closed, but it cannot prove review competence or evidence truth. Human hostile review remains the authority for findings and claims.
- DRY and security review overlap around duplicated permission and security rules, but they are not interchangeable. DRY finds competing authority; adversarial testing exercises an authorized runnable target.

### Corrected

- The lifecycle and specialist documents still described pull request #6 as pending after its verified merge. Issue #7 reconciles that stale snapshot with live Git and GitHub state before adding new governance claims.
- A parser that finds only the first heading or deduplicates issue numbers can falsely pass contradictory governance text. Duplicate governed headings and closing lines now fail, and fenced or commented content cannot supply evidence.
- A required scanner state without exact revision, target/environment consistency, mode, scope mode, and bounded budget can describe the wrong assessment while appearing complete. Those fields are now fail-closed and the budget cannot exceed USD 25.
- GitHub issue forms reserve `none` as a dropdown option and document `required` enforcement as public-repository-only. A private repository therefore needs a later validator gate rather than trusting the form UI to enforce completion.

### Deferred

- No Strix target is authorized for issue #7. Future issues that classify Strix as required must separately establish the exact owned target, environment, modes, expiry, budget, reviewed guard plan, execution instruction, and production approval when applicable.

### No product-model change

- The review-governance slice changes no product role, service mode, commercial rule, identity model, provider choice, transaction rule, or roadmap stage order.

## 2026-08-07 14:08 WIB - The review-governance check passed its first real pair

### Verified

- Hosted run `31156499668` loaded issue #7, parsed pull request #8, matched both review states, checked DRY revision `fcf9628241dd12a2e0a04dc88225a6a776243a19`, and completed with zero annotations.
- The workflow used only read permissions and did not invoke Strix or mutate the issue or PR.

### Reusable learning

- Synthetic parser fixtures and a real hosted event prove different things. The first real pair verified GitHub event shape, token scope, issue API access, checked-out validator execution, and step-summary compatibility.
- Recording that proof in lifecycle documents creates a newer head, so the earlier exact-head DRY pin and hosted run cannot be reused as final merge evidence.

### No product-model change

- Pull-request creation and hosted governance verification change no NitipCuy product, architecture, identity, transaction, provider, or stage decision.

## 2026-08-08 11:50 WIB - Request authority must survive framework behavior, not only pure tests

### Accepted

- Canonical origin is security authority, not formatting configuration.
  - Evidence: the proxy, protected mutation checks, Google client redirect URI, callback completion URL, and safe redirects all need the same exact origin for different enforcement boundaries.
  - Impact: one request-perimeter module parses the value and supplies server-owned downstream context; delivery code may repeat enforcement but may not invent another parser or trust request host/forwarding values directly.
- A trusted-proxy claim needs both application and provider halves.
  - Evidence: the application can require an HTTPS canonical origin, exact overwritten forwarding values, and timing-safe edge proof, but only the real edge can prove it strips attacker headers, injects proof, restricts ingress, and blocks alternate origins.
  - Impact: issue #9 may claim source-tested and simulated local-runtime behavior only. Provider-verified direct-origin denial remains a later activation gate.
- Nonce CSP changes rendering and caching architecture.
  - Evidence: Next.js attaches proxy-generated nonces only during dynamic rendering; the first production build still classified trip pages as static.
  - Impact: the root layout now forces dynamic rendering, and the runtime gate verifies that CSP and rendered HTML use the same fresh nonce. Public HTML caching must be redesigned rather than silently re-enabled.
- Runtime probes belong in the normal quality path when framework integration is the subject of the change.
  - Evidence: unit tests passed before live `next start` revealed rewrite re-entry and soft-404 behavior.
  - Impact: `pnpm check` now runs a deterministic post-build perimeter probe in direct and simulated trusted-proxy modes.
- A security audit is current evidence, not a property inherited from an unchanged direct manifest.
  - Evidence: the issue #9 production audit found Nano ID `3.3.16` through Next.js -> PostCSS even though this slice added no direct runtime package; `GHSA-2v37-7h3g-55p8` identifies `3.3.17` as patched.
  - Impact: one exact workspace override now resolves `3.3.17`, the lockfile records the only production path, and dependency overrides remain subject to fresh audit plus peer/build/runtime validation on every pull request.

### Corrected

- Do not copy a CSP-only prefetch matcher exclusion into a security perimeter.
  - Supersedes: the initial matcher followed Next.js CSP guidance and skipped requests carrying prefetch headers.
  - Evidence: an attacker controls those headers and could have bypassed host/proxy validation for matching application routes.
  - Impact: relevant page, auth, and API requests always traverse the decision regardless of prefetch markers.
- Do not forward validated proxy metadata deeper into the application.
  - Supersedes: the initial successful path removed only the edge-proof header.
  - Impact: edge proof, standard forwarding fields, and equivalent original-host/original-URL headers are stripped; downstream routes receive only server-owned canonical-origin and nonce metadata.
- Do not remove the early unknown-trip rewrite merely because the page calls `notFound()`.
  - Supersedes: the first DRY cleanup removed the proxy check after centralizing demo-trip IDs.
  - Evidence: forced dynamic rendering returned a streamed soft `200`; restoring the rewrite without excluding the internal target re-entered the proxy and returned `421`.
  - Impact: the proxy derives its check from the existing shared trip-ID source, returns a real `404`, and excludes only the framework's internal `/_not-found` path. This is intentional enforcement duplication at a framework boundary, not a second data authority.
- Local-direct request validation cannot assume Next.js preserves the external host inside `request.url`.
  - Evidence: the built server may normalize its internal URL host while retaining the exact direct `Host` header.
  - Impact: local-direct mode validates the request scheme plus exact canonical `Host`; non-local operation remains forbidden outside trusted-proxy mode.
- A hostile request decision must also be a cache decision.
  - Supersedes: the first implementation applied `no-store` according to auth/API path only, so a rejected public-path request returned `421` without an explicit cache prohibition.
  - Impact: every authority denial now forces the same centralized private no-store policy, preventing a future shared edge from retaining an attacker-shaped denial for an otherwise public URL.
- Security-critical deployment modes are exact values, not user-facing input.
  - Supersedes: the first parser trimmed proxy-mode whitespace before validation.
  - Impact: missing, unknown, or whitespace-padded modes all fail configuration closed; operational configuration must match the documented enum exactly.

### DRY review disposition

- Exact origin parsing, mode selection, callback reconstruction, CSP/header construction, and runtime trusted-proxy fixture values each have one code authority in the candidate.
- Static configuration-failure headers remain separately literal because the normal policy cannot be constructed on that path; sharing a configurable builder would weaken the fallback boundary.
- The proxy's shared-ID unknown-trip check remains alongside page-level `notFound()` because it owns the actual HTTP status after dynamic streaming, while the shared trip-ID source prevents a second data authority.
- Unit tests, built-runtime probes, ADR/security requirements, and lifecycle evidence intentionally restate critical outcomes for different audiences and evidence levels; they do not make policy decisions independently.

### Failed or rejected evidence

- The ambient Node.js `26.0.0` / pnpm `9.15.0` command was rejected by engine policy before tests and is not verification.
- The first inline runtime-probe program mixed CommonJS `require` with top-level `await`; Node rejected it before application requests and it is not verification.
- Intermediate `421`/soft-`200` results were useful defect evidence but do not count as passed runtime behavior.

### Deferred

- Issue #9 still has no authorized Strix URL, guard record, reviewed plan, budget, or execution. `REQUIRED` / `AUTHORIZATION REQUIRED` is progress visibility, not scanner authority.
- Real edge ingress restriction and header overwrite, real TLS/domain/HSTS readiness, browser automation, Google browser flow, shared rate limits, WAF/bot controls, observability/redaction, managed keys, privileged step-up/recovery, load, and incident evidence remain separate gates.
- Nonce-driven dynamic rendering intentionally defers public HTML cache optimization. A future cache design must preserve public/private classification and CSP integrity.

### No product-model change

- The perimeter changes no product role, service mode, seller-rate right, fee direction, order/evidence rule, provider choice, or roadmap stage order.

## 2026-08-09 21:15 WIB - Open-source security tooling and model privacy are separate decisions

### Accepted

- The local Strix CLI is Apache-2.0 open-source, while its AI-driven workflow still requires an LLM provider and local policy requires a nominal budget ceiling.
  - Evidence: the [official Strix repository](https://github.com/usestrix/strix), checked 2026-08-09, identifies the CLI as open source, lists Docker plus an LLM provider as prerequisites, and documents a local-model API base as an option.
- BurinSN does not approve sending NitipCuy source or test context to an external AI model for issue #9.
- No verified local Strix model is configured, so issue #9 uses the governed `NOT REQUIRED` / `NOT APPLICABLE` path rather than inventing scanner evidence.

### Reusable learning

- Tool availability is not the same as approved compute, privacy, or data-processing authority. Separate the open-source engine, the model provider, the target authorization, the execution decision, and the evidence claim.
- A non-required scanner classification needs positive evidence and explicit gaps. For issue #9 those are complete hostile source review, deterministic unit/integration/runtime checks, dependency audit, and an exact list of untested browser/provider/production factors.
- Never relabel source review or scripted HTTP probes as penetration testing merely because an offensive-capable tool was considered.

### Deferred

- A future guarded assessment may use a verified approved local model or separately approved hosted provider, but it must begin with a new exact target, privacy decision, authorization, plan, and execution approval.
- Real browser, Google, hosting edge, direct-origin restriction, TLS/domain, WAF/rate-limit, observability, managed-key, private-data, load, incident, staging, and production evidence remain open.

### No product-model change

- The review-method decision changes no NitipCuy role, service mode, seller pricing right, transaction fee direction, order/evidence rule, provider selection, or stage order.

## 2026-08-09 21:23 WIB - A manually created governed issue must match issue-form heading structure

### Corrected

- Issue #9 used level-two headings for its governed DRY and Strix fields even though the accepted issue form and validator require level-three headings.
  - Evidence: the first hosted review-governance runs could not find the issue fields; the live local issue/PR validator reproduced the failure before the headings were corrected.
  - Impact: the six governed headings now match the issue-form output, both failed runs passed on rerun, and the live pair validates with no error.

### Reusable learning

- Manually composing an issue from a visual template is not schema equivalence. Run the validator against the real issue body before opening or re-saving its PR.
- Editing a linked issue does not by itself attach a new check to the PR. Re-save the PR body or rerun the failed workflow after correcting the issue, then inspect the exact run and annotations.
- A successful CodeRabbit status with only a Free-plan walkthrough and no GitHub review object is summary coverage, not independent approval.

### No product-model change

- The heading correction and hosted checkpoint change no product, architecture, security control, provider, evidence requirement, or roadmap order.

## 2026-08-09 21:28 WIB - Final tracked evidence needs a live conditional transition

### Reusable learning

- A tracked lifecycle commit cannot contain the hosted result of its own future SHA without creating another commit and invalidating that SHA.
- The durable record therefore preserves the last verified checkpoint and defines the exact live condition for transition: matching issue/PR DRY pins, required checks green with zero annotations, clean mergeability, and no unresolved review finding.
- The editable PR description owns final exact-head evidence; the handoff owns how a future session must verify and interpret it. Neither grants merge authority.

### No new product or security-control learning

- This lifecycle-only checkpoint changes no implementation, control, provider decision, external-AI boundary, product model, or roadmap order.

## 2026-08-09 21:35 WIB - External-AI claims must account for automatic repository integrations

### Corrected

- The earlier `zero-external-AI` wording was overbroad. Issue #9's approved decision is specifically `zero-external-Strix-AI`: no Strix assessment, hosted Strix LLM provider, or Strix transfer of source/test/runtime context is authorized or used.
- The pre-existing CodeRabbit GitHub integration automatically processed the pull-request diff for a walkthrough and release notes. That is external AI processing even though it produced no GitHub review object, security finding, or independent approval.

### Reusable learning

- A privacy statement must name the tool and data path it actually governs. Open-source scanner choice, model-provider choice, and unrelated repository-review integrations are separate facts.
- Before claiming that no external AI processed a change, inspect installed GitHub integrations, status contexts, bot-authored PR body changes, comments, and review objects. Opening a pull request can trigger an existing integration without a new scan command.
- Disclose automated summary processing separately from security evidence. A bot walkthrough or release-note edit is neither a Strix assessment nor an independent security review.

### No product or security-control change

- This correction changes disclosure precision only. It changes no application behavior, security control, Strix applicability, product model, provider direction, or roadmap order.

## 2026-08-09 23:25 WIB - Conditional merge approval must bound its lifecycle successor

### Reusable learning

- Fresh owner approval can be conditional on a final review outcome, but the repository must still record that approval before merge because the handoff is the authority boundary.
- Recording approval creates a new immutable head and therefore invalidates the previous DRY SHA. The safe transition is to restrict the successor to the four lifecycle documents, repin both governed records, repeat exact-head review and hosted checks, and merge only if every original condition remains true.
- Conditional approval does not survive any source, dependency, configuration, product, provider, security-control, scope, review, or check change. Such a change requires fresh owner review rather than interpreting the earlier approval broadly.
- A successful squash merge must be followed by live verification of the merge commit, default branch, automatic issue closure, and feature-branch cleanup. Merge-button success alone is not the durable result.

### No new product or security-control learning

- This approval record changes no implementation, security control, Strix applicability, provider decision, product model, roadmap stage, or delivery order.

## 2026-08-10 12:36 WIB - Shared limiter correctness needs canonical identity, atomic audit, and runtime evidence

### Verified

- A shared database counter can enforce one ceiling across independent web instances only when every instance derives the same canonical subject and updates the same bucket atomically.
  - Evidence: two separate PostgreSQL limiter objects admitted exactly five of twelve concurrent requests against identical network, account, session, and target axes; every bucket ended at count twelve.
  - Impact: process-local maps and per-instance locks remain prohibited for production-shape abuse authority.
- Privacy-safe limiter storage requires keyed, domain-separated subjects rather than raw addresses or predictable plain hashes.
  - Evidence: the perimeter emits an HMAC network subject, the adapter HMACs every axis with domain separation, and disposable-database inspection found none of the raw network/account/session/target inputs in bucket or denial-audit rows.
  - Impact: telemetry uses bounded policy/axis categories while raw identifiers and user content remain outside rate-limit evidence.
- A denial audit is part of the protected decision boundary when policy requires it.
  - Evidence: forcing an invalid audit identifier made the denial transaction fail closed and rolled the counter increment and audit-claim flag back.
  - Impact: do not catch and ignore audit failure around a protected allow/deny decision; return generic unavailability.
- Versioning the storage policy key prevents a limit/window edit from silently reinterpreting existing rows.
  - Impact: any v2 policy still needs a mixed-version rollout analysis because old and new instances can enforce independent buckets during transition.
- Shared storage is not enough if each web instance chooses its own window clock.
  - Evidence: hostile review found the first adapter derived fixed windows from the injected application clock even though counters were shared.
  - Correction: production samples PostgreSQL time inside the bounded transaction; clock injection now requires an explicit disposable-test-database acknowledgement.
- A local runtime probe can expose framework-added forwarding metadata that source-only review misses.
  - Evidence: the corrected two-mode production build passed only after the local-direct policy accounted for Next.js's canonical loopback value while retaining hostile remote and ambiguous denials.
  - Impact: provider-edge interpretation still requires provider verification; the local probe proves only the built local boundary.

### Corrected assumption

- Explicit local-direct mode cannot require `X-Forwarded-For` to be absent in the built Next.js runtime.
  - Evidence: the first built-runtime probe returned `421` for valid loopback requests because Next.js inserted a loopback forwarding value.
  - Correction: local-direct mode accepts absent or one canonical loopback address only; trusted-proxy mode still requires one canonical IP and exact edge proof, and every raw forwarding value is stripped downstream.

### Failed approach

- The ambient Node.js `26.0.0` / pnpm `9.15.0` command failed the engine gate and produced no admissible test evidence.
  - Recovery: invoke the complete task graph through the exact Node.js `24.18.0` and pnpm `11.17.0` compatibility wrapper so child commands inherit the supported path.

### Deferred

- Fixed-window boundaries can admit bursts on both sides of a reset. Threshold calibration, a possible token-bucket replacement, HMAC rotation without uncontrolled resets, mixed-version policy rollout, provider client-IP compatibility, WAF/bot coordination, metrics export, dashboards, alerts, load profiles, and incident response remain separate evidence gates.
- No new product or commercial decision resulted; Stage 1 order and the next server-authoritative order-eligibility slice remain unchanged.

## 2026-08-10 12:41 WIB - Pull-request creation produced no new product or control learning

### No new product or security-control learning

- Opening pull request #12 changed only the live review surface. It changed no implementation, security control, Strix applicability, provider decision, product model, stage, or delivery order.
- The required lifecycle reconciliation creates one documentation-only successor SHA; its review pins and hosted checks must replace, not be combined with, the implementation head's volatile status.

## 2026-08-10 12:46 WIB - Final hosted verification produced no new control learning

### Reusable learning

- A cancelled review-governance event is not a failed gate when the workflow's concurrency rule cancels an in-flight body version and the final replacement event passes on the same immutable head. Preserve both facts so notification history is not mistaken for an application failure.
- A successful CodeRabbit status can coexist with a rate-limit notice and no review output. Inspect review objects, line comments, and the actual bot comment before assigning review coverage.

### No new product or security-control learning

- Exact-head hosted verification changed no implementation, security control, Strix applicability, provider decision, product model, stage, or delivery order.

## 2026-08-10 19:55 WIB - Target limits must include caller identity and alternate IP authority must fail closed

### Reusable learning

- A target axis keyed only by target identifier is a shared denial lever, even when separate network/account axes also exist.
  - Evidence: `public.trip-detail` allowed 120 requests per network but only 60 per raw target, while discussion allowed 12 per account/session but only 6 per raw target. One caller could therefore exhaust the target bucket for everyone else.
  - Correction: anonymous targets use network-target identity and authenticated targets use account-target identity. Adversarial tests prove different callers receive different target subjects while the same caller-target pair remains stable.
- Compound security identities need unambiguous construction and bounded inputs.
  - Correction: validate each component, length-frame it, domain-separate the construction, and hash it before the persistence adapter's independent keyed HMAC. Simple delimiter concatenation would permit collisions when future identifier alphabets evolve.
- Removing only `Forwarded` and `X-Forwarded-*` does not remove client-network authority.
  - Evidence: a generic `Headers` clone preserved `X-Real-IP`, `CF-Connecting-IP`, `True-Client-IP`, and other provider conventions for downstream route code.
  - Correction: one maintained header-name authority drives both fail-closed ingress rejection and defense-in-depth downstream removal, with local and trusted-proxy tests for every entry.
- A technically mergeable GitHub state is not a security-review pass. The earlier exact-head verdict was explicitly superseded when complete-diff hostile review found these issues.

### Deferred

- The limiter deletes at most 100 expired rows per decision. That bounds one transaction but not aggregate write amplification under sustained traffic; load evidence or a dedicated cleanup schedule remains required before a production-capacity claim.
- The maintained alternate-header set must be reconciled with the selected edge provider before activation. A legitimate provider-added alternate header will fail closed until the edge is configured to remove it and supply only the approved canonical metadata.
- No new product, commercial, provider, Strix, stage, or delivery-order decision resulted.

## 2026-08-10 20:00 WIB - Corrected exact-head verification produced no new control learning

### Reusable learning

- Coordinated issue/PR repinning can create short-lived review-governance failures when an event captures the PR before both governed records carry the successor SHA. Treat those events as transition evidence only after inspecting their exact error and obtaining a passing replacement run on the current immutable head.
- A successful third-party status must be decomposed into actual coverage. CodeRabbit processed the corrected 38-file diff and produced a walkthrough, but no GitHub review object, line finding, or security assessment; the local hostile review remains the actionable security review.
- The narrow final lifecycle successor is safe only when its diff from the reviewed implementation head contains exactly the four mandatory lifecycle documents. Any other changed file invalidates the conditional transition.

### No new product or security-control learning

- Hosted verification and the final evidence record change no implementation, security control, Strix applicability, provider decision, product model, roadmap stage, or delivery order.

## 2026-08-11 12:41 WIB - Owner approval is bound to the immutable reviewed state

### Reusable learning

- A conversational instruction to finalize and proceed is merge authority only after it is reconciled with the exact reviewed SHA, checks, limitations, and repository policy. Here it followed the explicit merge-ready result for pull request #12 and therefore authorizes the governed squash-merge path.
- Recording approval creates one more immutable head. Preserve the approval by limiting that successor to the four lifecycle documents, repinning both governance records, and repeating exact-head checks and narrow hostile review before merge.
- Approval does not survive a source, dependency, configuration, product, provider, security-control, scope, or finding change and never silently expands into deployment or production authority.

### No new product or security-control learning

- The approval record changes no implementation, security control, Strix applicability, provider decision, product model, roadmap stage, or delivery order.

## 2026-08-11 13:43 WIB - Exact capacity and pure-database replay belong to one transaction

### Verified

- Capacity must cross the HTTP and domain boundaries as an integer unit instead of a JavaScript decimal.
  - Evidence: issue #13 accepts 10-gram increments, maps them to PostgreSQL `DECIMAL(8,2)` kilograms, conditionally decrements that exact value, and rejects non-integer or non-representable inputs.
  - Impact: the unit is a technical precision contract, not an approved seller trust-tier, route, pilot, insurance, or load ceiling.
- A pure database command can make completion idempotent without a separately committed in-progress row.
  - Evidence: authorization and rate limiting precede lookup; a transaction advisory lock denies an active same-account/key attempt; the request, capacity, audit, outbox, and completed replay row then commit together. A failure leaves no ambiguous provider outcome or partially completed idempotency record.
  - Impact: the generic recovery-required contract still applies to provider calls and other ambiguous external effects. It must not be copied unnecessarily into a short database-only transaction, and this narrow implementation must not be presented as generalized platform idempotency.
- Database time and row eligibility must be part of the same decision boundary as capacity.
  - Evidence: an injected application clock set to 1900 did not affect successful disposable-database submission; seller account and profile rows were share-locked while the conditional trip update required published state, the read revision, and enough exact capacity.
  - Impact: a UI timer, web-instance clock, public projection, or earlier eligibility read cannot authorize the mutation.
- A submitted declaration is not an accepted commercial snapshot.
  - Evidence: issue #13 preserves mode terms, route, schedule, revision, and reserved capacity at `SUBMITTED` but intentionally implements no seller acceptance or final seller charge.
  - Impact: later seller acceptance must create the accepted commercial snapshot, while rejection, expiry, and cancellation must release reservation safely before the flow can serve real users.

### Failed or corrected approaches

- Comparing Prisma decimal objects directly with string expectations produced misleading test failures even though serialized values matched.
  - Correction: assert exact decimal `.toString()` values and the separate trip revision.
- Relying only on application-level seller/profile reads would leave their eligibility vulnerable to a concurrent state change during submission.
  - Correction: the order repository now takes transaction-scoped share locks on the exact active seller account and jastipper profile before reserving capacity.
- `CURRENT_TIMESTAMP` is fixed at PostgreSQL transaction start and can become stale while a transaction waits on locks.
  - Correction: final capacity admission locks the exact trip row, reads `clock_timestamp()`, rechecks the ordering window, and uses that same value for the request, audit, outbox, and idempotency completion. A delayed disposable-database test proves a request that crosses the deadline is denied.
- Independent foreign keys do not prove that related identities belong to the same aggregate.
  - Correction: composite database constraints now bind request seller/profile to the exact trip and idempotency request/customer to each other. Direct cross-party mutation tests fail with PostgreSQL foreign-key violations.
- Review a new idempotency implementation against existing grammar authority even when its state machine must remain separate.
  - Correction: issue #13 reuses the shared key grammar; its pure-database transaction state remains intentionally distinct from the process-local provider-oriented recovery contract.

### Deferred

- Completed replay cleanup, operational metrics, load behavior, managed-PostgreSQL lock behavior, reservation release, accepted commercial terms, private request encryption, browser coverage, payment, and delivery remain unimplemented or unverified.
- No provider, commercial, fee, legal, visual, pilot, or production decision resulted from this slice.

## 2026-08-11 14:11 WIB - Pull-request publication produced no new product or control learning

### Reused governance learning

- Opening pull request #14 changes the live review surface but not the reviewed implementation. The required lifecycle reconciliation creates a documentation-only successor that must be checked as exactly four files and repinned before its hosted evidence can replace the implementation head's evidence.
- A passing initial review-governance run proves only that issue #13 and pull request #14 matched at the implementation head when that event ran. It does not pre-approve the lifecycle successor, other hosted checks, CodeRabbit output, mergeability, or owner approval.

### No new product or security-control learning

- Pull-request publication and lifecycle-state recording change no implementation, security control, Strix applicability, provider decision, product model, roadmap stage, or delivery order.

## 2026-08-11 14:17 WIB - Final hosted verification produced no new control learning

### Reused governance learning

- A cancelled workflow event is transition evidence, not a failed gate, when its sole annotation says the concurrency rule selected a higher-priority waiting replacement and that replacement passes on the same exact head.
- A successful third-party status can still mean no review occurred. CodeRabbit's `Review rate limited` status produced a walkthrough but no review object or finding, so it contributes no independent correctness or security coverage.

### No new product or security-control learning

- Hosted verification and its lifecycle checkpoint change no implementation, security control, Strix applicability, provider decision, product model, roadmap stage, or delivery order.
