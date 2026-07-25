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
