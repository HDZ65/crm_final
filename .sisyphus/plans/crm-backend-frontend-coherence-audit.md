# CRM Backend Frontend Coherence Audit and Remediation

## TL;DR

> **Quick Summary**: Build a definitive contract coherence baseline between backend and frontend, then fix highest-risk drifts (auth posture, gRPC exposure mismatch, NATS wiring gaps, dead/broken clients) in a controlled, evidence-driven sequence.
>
> **Deliverables**:
> - Full coverage matrix (`proto -> backend controller -> frontend client -> action/hook/page`) with status.
> - NATS wiring matrix (`subject -> publisher -> subscriber -> status`).
> - Auth posture assessment (gateway presence, guard enforcement, token contract parity).
> - Prioritized remediation backlog (P0/P1/P2) with executable verification steps.
>
> **Estimated Effort**: Large
> **Parallel Execution**: YES - 4 waves
> **Critical Path**: Task 1 -> Task 4 -> Task 7 -> Task 10

---

## Context

### Original Request
"Fais une analyse complete de mon crm de gestion... regarde tout mon backend et si j'utilise bien tout dans mon frontend."

### Interview Summary
**Key Discussions**:
- User requested a complete backend/frontend coherence analysis.
- Existing analysis confirmed strong core-domain alignment but non-trivial drift risk in gRPC/auth/NATS.
- User approved generation of an actionable work plan.

**Research Findings**:
- Backend topology: `service-core`, `service-commercial`, `service-engagement`, `service-finance`, `service-logistics`, `service-scoring`.
- Frontend integration surface: 27 server action files, 65 hooks, 20+ gRPC client modules.
- High-risk drifts identified: gRPC exposure mismatch, auth token validation mismatch, partially wired async event subscriptions.

### Metis Review
**Identified Gaps** (addressed in this plan):
- Missing hard boundary between active repo and `clone/winaity-clean` scope.
- Missing explicit artifact-first phase gates before remediation.
- Missing acceptance criteria precision for coverage/NATS/auth audits.
- Missing explicit guardrails against broad unsafe refactors.
- Missing treatment for dead/broken `depanssur` frontend client and port mismatch in tests.

### Finalized Decision Inputs
- **Gateway auth enforcement**: No gateway/service mesh auth enforcement; treat auth drift as **P0** until remediated.
- **NATS commented handlers**: Intentional deferred scope; keep disabled and document clearly.
- **Depanssur frontend scope**: Deferred feature; resolve orphan/broken client safely without forcing full UI rollout.

---

## Work Objectives

### Core Objective
Establish a verified source of truth for backend/frontend contract coherence, then execute targeted, low-risk remediations that eliminate runtime-breaking mismatches without broad refactors.

### Concrete Deliverables
- `.sisyphus/reports/backend-frontend-coverage-matrix.md`
- `.sisyphus/reports/nats-wiring-matrix.md`
- `.sisyphus/reports/auth-posture-assessment.md`
- `.sisyphus/reports/coherence-remediation-backlog.md`
- Updated code artifacts only where explicitly planned (no protocol-wide rewrites).

### Definition of Done
- [ ] Coverage matrix generated and machine-checkable from repository state.
- [ ] Every high-risk drift has explicit status: fixed / accepted / deferred with reason.
- [ ] Build and targeted verification commands succeed for affected components.
- [ ] No task requires human-only validation; all verification is agent-executable.

### Must Have
- Evidence-first workflow (inventory before fixes).
- Strict scope boundary and no clone-folder contamination.
- Prioritized remediation with P0/P1/P2 rationale.

### Must NOT Have (Guardrails)
- No blanket refactor of all gRPC clients/controllers.
- No `.proto` contract redesign in this plan.
- No auto-activation of commented NATS handlers without explicit decision.
- No inclusion of `clone/winaity-clean`.
- No acceptance criteria phrased as "manual verification by user".

---

## Verification Strategy (MANDATORY)

> **UNIVERSAL RULE: ZERO HUMAN INTERVENTION**
>
> All verification steps are agent-executed via commands and tools. No manual user actions are required.

### Test Decision
- **Infrastructure exists**: YES
- **Automated tests**: Tests-after (default applied)
- **Framework**: bun/jest/node scripts (existing mixed setup)

### Agent-Executed QA Scenarios (MANDATORY — ALL tasks)

Each task below includes concrete scenarios with explicit tool, preconditions, steps, expected result, and evidence.

---

## Execution Strategy

### Parallel Execution Waves

Wave 1 (Start Immediately): Tasks 1, 2, 3
Wave 2 (After Wave 1): Tasks 4, 5, 6
Wave 3 (After Wave 2): Tasks 7, 8, 9
Wave 4 (After Wave 3): Task 10

Critical Path: Task 1 -> Task 4 -> Task 7 -> Task 10

### Dependency Matrix

| Task | Depends On | Blocks | Can Parallelize With |
|------|------------|--------|----------------------|
| 1 | None | 4, 7 | 2, 3 |
| 2 | None | 7 | 1, 3 |
| 3 | None | 7 | 1, 2 |
| 4 | 1 | 8, 10 | 5, 6 |
| 5 | 1 | 10 | 4, 6 |
| 6 | 1 | 10 | 4, 5 |
| 7 | 1, 2, 3 | 10 | 8, 9 |
| 8 | 4 | 10 | 7, 9 |
| 9 | 4 | 10 | 7, 8 |
| 10 | 4, 5, 6, 7, 8, 9 | None | None |

### Agent Dispatch Summary

| Wave | Tasks | Recommended Agents |
|------|-------|--------------------|
| 1 | 1,2,3 | `task(category="deep", load_skills=["microservice-coherence"], run_in_background=false)` |
| 2 | 4,5,6 | `task(category="deep", load_skills=["microservice-coherence","git-master"], run_in_background=false)` |
| 3 | 7,8,9 | `task(category="unspecified-high", load_skills=["microservice-coherence","git-master"], run_in_background=false)` |
| 4 | 10 | `task(category="unspecified-high", load_skills=["microservice-coherence"], run_in_background=false)` |

---

## TODOs

- [ ] 1. Build canonical backend gRPC exposure inventory

  **What to do**:
  - Enumerate `@GrpcMethod` surface across targeted services.
  - Map each method to service/package from each `services/*/src/main.ts` registration.
  - Export normalized table: `service | package | method | controller file`.

  **Must NOT do**:
  - Do not scan `clone/winaity-clean`.
  - Do not edit controllers.

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: high-volume inventory and contract normalization.
  - **Skills**: `microservice-coherence`, `git-master`
    - `microservice-coherence`: cross-service consistency analysis.
    - `git-master`: safe repository-wide discovery discipline.
  - **Skills Evaluated but Omitted**:
    - `frontend-ui-ux`: no UI design scope.

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 2, 3)
  - **Blocks**: 4, 7
  - **Blocked By**: None

  **References**:
  - `services/service-core/src/main.ts` - canonical proto package registration for core service.
  - `services/service-commercial/src/main.ts` - canonical package registration for commercial domains.
  - `services/service-engagement/src/main.ts` - engagement package exposure and potential mismatch anchor.
  - `services/service-finance/src/main.ts` - finance package exposure for payments/calendar/factures.
  - `services/service-logistics/src/main.ts` - logistics package exposure.
  - `services` - source root for all controller discovery.

  **Acceptance Criteria**:
  - [ ] `.sisyphus/reports/backend-grpc-exposure.md` exists with complete table and source evidence paths.
  - [ ] Command `grep -r "@GrpcMethod" services/service-core services/service-commercial services/service-engagement services/service-finance services/service-logistics --include="*.ts"` count matches report totals.

  **Agent-Executed QA Scenarios**:
  ```text
  Scenario: Inventory generation from service sources
    Tool: Bash
    Preconditions: Repository available at workspace root
    Steps:
      1. Run grep for @GrpcMethod across five services.
      2. Parse counts per service and compare to report totals.
      3. Assert each row in report has controller file path.
    Expected Result: Exposure report totals equal source-discovered totals.
    Failure Indicators: Missing service section, mismatched count, missing path evidence.
    Evidence: .sisyphus/evidence/task-1-grpc-inventory.txt
  ```

  **Commit**: NO

- [ ] 2. Build frontend call surface inventory

  **What to do**:
  - Inventory `frontend/src/lib/grpc/clients/*.ts`, `frontend/src/actions/*.ts`, `frontend/src/hooks/**/*.ts*`.
  - Produce mapping: `client method -> action -> hook/page`.

  **Must NOT do**:
  - Do not include test-only pages in production coverage score unless labeled.

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: `microservice-coherence`, `git-master`
  - **Skills Evaluated but Omitted**:
    - `playwright`: no browser runtime needed for inventory step.

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1
  - **Blocks**: 7
  - **Blocked By**: None

  **References**:
  - `frontend/src/lib/grpc/clients/index.ts` - frontend gRPC export entrypoint.
  - `frontend/src/actions` - server action bridge to backend contracts.
  - `frontend/src/hooks` - client-side consumption patterns and feature wiring.

  **Acceptance Criteria**:
  - [ ] `.sisyphus/reports/frontend-call-surface.md` exists with per-feature mapping.
  - [ ] Count of action files equals 27 and hooks equals current discovered total (65 unless changed by branch).

  **Agent-Executed QA Scenarios**:
  ```text
  Scenario: Frontend inventory consistency check
    Tool: Bash
    Preconditions: Frontend source directories exist
    Steps:
      1. List action files under frontend/src/actions.
      2. List hook files under frontend/src/hooks.
      3. Cross-check report counts and sampled mappings.
    Expected Result: Report aligns with source counts and includes evidence file paths.
    Failure Indicators: Missing domains, stale file counts, no path evidence.
    Evidence: .sisyphus/evidence/task-2-frontend-surface.txt
  ```

  **Commit**: NO

- [ ] 3. Build NATS wiring matrix (active vs commented)

  **What to do**:
  - Enumerate publishers/subscribers and classify active/commented/orphan.
  - Produce end-to-end matrix including subject naming consistency.

  **Must NOT do**:
  - Do not uncomment handlers during audit phase.

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: `microservice-coherence`, `git-master`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1
  - **Blocks**: 7
  - **Blocked By**: None

  **References**:
  - `packages/shared-kernel/src/infrastructure/nats/nats.service.ts` - canonical NATS client semantics.
  - `services/service-engagement/src/infrastructure/messaging/nats` - engagement event subscriptions/publishers.
  - `services/service-commercial/src/infrastructure/messaging/nats` - commercial event bridge handlers.
  - `services/service-finance/src/infrastructure/messaging/nats` - finance event handlers with TODO states.
  - `services/service-logistics/src/infrastructure/messaging/nats` - logistics subscription listeners.

  **Acceptance Criteria**:
  - [ ] `.sisyphus/reports/nats-wiring-matrix.md` includes columns `subject | publisher | subscriber | status | evidence`.
  - [ ] At least one negative case per domain (commented/inert link) explicitly recorded.

  **Agent-Executed QA Scenarios**:
  ```text
  Scenario: NATS subject wiring classification
    Tool: Bash
    Preconditions: Messaging handler files present
    Steps:
      1. Search for natsService.subscribe and natsService.publish occurrences.
      2. Separate commented occurrences from active ones.
      3. Verify each matrix row has source file evidence.
    Expected Result: Complete active/commented classification with no unreferenced row.
    Failure Indicators: Subjects without publisher/subscriber mapping, missing status labels.
    Evidence: .sisyphus/evidence/task-3-nats-wiring.txt
  ```

  **Commit**: NO

- [ ] 4. Generate definitive backend/frontend coverage matrix

  **What to do**:
  - Merge Task 1 + Task 2 artifacts into one matrix:
    `proto service | rpc method | backend controller | frontend client | action/hook/page | status`.
  - Status values: `covered`, `backend-only`, `frontend-only`, `broken-import`, `ambiguous`.

  **Must NOT do**:
  - Do not infer coverage without file evidence.

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: `microservice-coherence`, `git-master`

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential
  - **Blocks**: 8, 10
  - **Blocked By**: 1

  **References**:
  - `packages/proto/src` - source of canonical method names.
  - `.sisyphus/reports/backend-grpc-exposure.md` - backend side of matrix.
  - `.sisyphus/reports/frontend-call-surface.md` - frontend side of matrix.

  **Acceptance Criteria**:
  - [ ] `.sisyphus/reports/backend-frontend-coverage-matrix.md` exists and every row has evidence path.
  - [ ] Matrix contains explicit entry for broken/orphan depanssur client if still present.

  **Agent-Executed QA Scenarios**:
  ```text
  Scenario: Coverage matrix integrity
    Tool: Bash
    Preconditions: Task 1 and Task 2 outputs exist
    Steps:
      1. Validate matrix headers and mandatory columns.
      2. Sample 20 rows and verify evidence files and symbols exist.
      3. Confirm at least one row per backend service package.
    Expected Result: Matrix is complete, evidence-backed, and service-balanced.
    Failure Indicators: Missing columns, dead evidence paths, unclassified rows.
    Evidence: .sisyphus/evidence/task-4-coverage-integrity.txt
  ```

  **Commit**: NO

- [ ] 5. Auth posture assessment and risk classification

  **What to do**:
  - Determine where authentication is enforced (gateway vs service guard/interceptor).
  - Validate frontend token metadata emission path and backend token verification path.
  - Produce risk statement with concrete impact and mitigation options.

  **Must NOT do**:
  - Do not implement new auth framework in this task.

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: `microservice-coherence`, `git-master`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 4, 6)
  - **Blocks**: 10
  - **Blocked By**: 1

  **References**:
  - `frontend/src/lib/grpc/auth.ts` - frontend gRPC metadata construction.
  - `frontend/src/lib/auth/auth.config.ts` - session/token source configuration.
  - `packages/shared-kernel/src/infrastructure/interceptors/auth.interceptor.ts` - backend auth interception logic.
  - `tests/e2e/auth.test.ts` - expected auth contract behavior assertions.

  **Acceptance Criteria**:
  - [ ] `.sisyphus/reports/auth-posture-assessment.md` answers: gateway present? guard present? contract parity?
  - [ ] Includes at least one positive and one negative verification command outcome.

  **Agent-Executed QA Scenarios**:
  ```text
  Scenario: Auth parity static verification
    Tool: Bash
    Preconditions: Auth files accessible
    Steps:
      1. Search backend for guard/interceptor auth enforcement markers.
      2. Search frontend for Authorization metadata creation and token source.
      3. Compare declared e2e expectations with actual enforcement points.
    Expected Result: Assessment contains explicit parity verdict and evidence links.
    Failure Indicators: Vague statements, no explicit yes/no outcomes, no evidence paths.
    Evidence: .sisyphus/evidence/task-5-auth-posture.txt
  ```

  **Commit**: NO

- [ ] 6. Classify runtime probe set for top-risk flows

  **What to do**:
  - Define probe list for auth bootstrap, clients list, dashboard, bundle, calendar, conciergerie/justi-plus, relance.
  - Generate executable probe commands/scripts list (no manual interactions).

  **Must NOT do**:
  - Do not run destructive write operations against production data.

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: `microservice-coherence`, `git-master`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: 10
  - **Blocked By**: 1

  **References**:
  - `frontend/src/actions/clients.ts` - clients flow probe target.
  - `frontend/src/actions/dashboard.ts` - dashboard flow probe target.
  - `frontend/src/actions/bundle.ts` - bundle flow probe target.
  - `frontend/src/actions/calendar-config.ts` - calendar flow probe target.
  - `frontend/src/actions/conciergerie.ts` - service integration probe target.
  - `frontend/src/actions/relance.ts` - relance flow probe target.

  **Acceptance Criteria**:
  - [ ] `.sisyphus/reports/runtime-probe-plan.md` exists with exact commands and expected outputs.
  - [ ] Includes negative/error probes for unavailable method and invalid token cases.

  **Agent-Executed QA Scenarios**:
  ```text
  Scenario: Probe plan completeness check
    Tool: Bash
    Preconditions: Action files exist
    Steps:
      1. Verify each high-risk flow maps to at least one probe command.
      2. Verify each probe has expected status/result criteria.
      3. Verify negative probes are present.
    Expected Result: Probe plan covers all high-risk flows with deterministic assertions.
    Failure Indicators: Missing flow, missing expected result, no negative probe.
    Evidence: .sisyphus/evidence/task-6-probe-plan.txt
  ```

  **Commit**: NO

- [ ] 7. Prioritize and publish remediation backlog (P0/P1/P2)

  **What to do**:
  - Convert findings from Tasks 3/4/5/6 into ranked backlog.
  - Each backlog item includes risk, blast radius, owner service, and verification command.

  **Must NOT do**:
  - Do not mix uncertain assumptions with confirmed defects.

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: `microservice-coherence`, `writing`

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential
  - **Blocks**: 10
  - **Blocked By**: 1,2,3

  **References**:
  - `.sisyphus/reports/backend-frontend-coverage-matrix.md` - defect source truth.
  - `.sisyphus/reports/nats-wiring-matrix.md` - async consistency source truth.
  - `.sisyphus/reports/auth-posture-assessment.md` - security posture source truth.
  - `.sisyphus/reports/runtime-probe-plan.md` - runtime validation source truth.

  **Acceptance Criteria**:
  - [ ] `.sisyphus/reports/coherence-remediation-backlog.md` exists with P0/P1/P2 sections.
  - [ ] Every item has `why`, `fix approach`, `verification`, and `rollback` fields.

  **Agent-Executed QA Scenarios**:
  ```text
  Scenario: Backlog actionability validation
    Tool: Bash
    Preconditions: Upstream reports are complete
    Steps:
      1. Check each backlog entry contains risk, owner, and command fields.
      2. Confirm no backlog item lacks evidence source.
      3. Confirm P0 items have explicit stop-ship rationale.
    Expected Result: Backlog is executable and prioritization is evidence-backed.
    Failure Indicators: Generic items, no command verification, missing owner.
    Evidence: .sisyphus/evidence/task-7-backlog-validation.txt
  ```

  **Commit**: NO

- [ ] 8. Fix or remove broken depanssur frontend client path

  **What to do**:
  - If Depanssur is in-scope/live: align `frontend/src/lib/grpc/clients/depanssur.ts` with client factory pattern.
  - If out-of-scope/not live: remove orphan client and document deferred integration path.

  **Must NOT do**:
  - Do not introduce new backend methods in this task.

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `microservice-coherence`, `git-master`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 7, 9)
  - **Blocks**: 10
  - **Blocked By**: 4

  **References**:
  - `frontend/src/lib/grpc/clients/depanssur.ts` - target broken/orphan client.
  - `frontend/src/lib/grpc/clients/config.ts` - canonical client creation utility.
  - `frontend/src/lib/grpc/clients/clients.ts` - pattern reference for compliant client implementation.
  - `frontend/src/lib/grpc/clients/index.ts` - export/barrel consistency point.

  **Acceptance Criteria**:
  - [ ] No unresolved import/export in depanssur client path.
  - [ ] `frontend` type/build checks pass for touched files.

  **Agent-Executed QA Scenarios**:
  ```text
  Scenario: Depanssur client compile safety
    Tool: Bash
    Preconditions: Frontend dependencies installed
    Steps:
      1. Run type/build check for frontend.
      2. Assert no import error references depanssur/config exports.
      3. Verify barrel exports are consistent with intended status.
    Expected Result: Frontend compiles with no depanssur client import errors.
    Failure Indicators: Missing export, unresolved symbol, compile failure.
    Evidence: .sisyphus/evidence/task-8-depanssur-compile.txt
  ```

  **Commit**: YES
  - Message: `fix(frontend-grpc): resolve depanssur client contract drift`
  - Files: `frontend/src/lib/grpc/clients/depanssur.ts`, `frontend/src/lib/grpc/clients/index.ts`
  - Pre-commit: `bun run build` (frontend)

- [ ] 9. Reconcile port/config drift between frontend runtime and e2e probes

  **What to do**:
  - Align service port map used by runtime client config and e2e probe config.
  - Ensure payment/calendar/retry references are coherent with active backend topology.

  **Must NOT do**:
  - Do not rewrite complete test framework; only align configuration and assertions.

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `git-master`, `microservice-coherence`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3
  - **Blocks**: 10
  - **Blocked By**: 4

  **References**:
  - `frontend/src/lib/grpc/clients/config.ts` - runtime host/port mapping.
  - `tests/e2e/grpc-client.test.ts` - probe host/port mapping under test.
  - `services/service-finance/src/main.ts` - finance gRPC exposure reference.

  **Acceptance Criteria**:
  - [ ] Config mappings and probe mappings no longer diverge for shared services.
  - [ ] e2e probe script reflects active target service ports.

  **Agent-Executed QA Scenarios**:
  ```text
  Scenario: Port mapping parity verification
    Tool: Bash
    Preconditions: Config and e2e files present
    Steps:
      1. Extract all service port literals from frontend config.
      2. Extract all target ports from e2e grpc test file.
      3. Assert parity for overlapping services.
    Expected Result: Shared service targets use consistent host/port values.
    Failure Indicators: Same service mapped to different ports without explicit rationale.
    Evidence: .sisyphus/evidence/task-9-port-parity.txt
  ```

  **Commit**: YES
  - Message: `test(config): align grpc probe ports with runtime mapping`
  - Files: `tests/e2e/grpc-client.test.ts`, optional config docs
  - Pre-commit: `node tests/e2e/grpc-client.test.ts` (or equivalent repo command)

- [ ] 10. Final coherence verification and release readiness report

  **What to do**:
  - Execute final verification commands across generated artifacts and quick fixes.
  - Produce final report: residual risks, accepted deferrals, and go/no-go recommendation.

  **Must NOT do**:
  - Do not mark resolved items without command evidence.

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: `microservice-coherence`, `writing`

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Final sequential
  - **Blocks**: None
  - **Blocked By**: 4,5,6,7,8,9

  **References**:
  - `.sisyphus/reports/backend-frontend-coverage-matrix.md` - final primary source.
  - `.sisyphus/reports/nats-wiring-matrix.md` - async correctness source.
  - `.sisyphus/reports/auth-posture-assessment.md` - security posture source.
  - `.sisyphus/reports/coherence-remediation-backlog.md` - prioritization source.
  - `.sisyphus/evidence` - evidence bundle path.

  **Acceptance Criteria**:
  - [ ] Final report `.sisyphus/reports/coherence-final-verdict.md` includes go/no-go verdict.
  - [ ] Every unresolved issue is explicitly tagged: accepted-risk, deferred, or blocked-by-decision.

  **Agent-Executed QA Scenarios**:
  ```text
  Scenario: Final evidence completeness check
    Tool: Bash
    Preconditions: All prior tasks completed
    Steps:
      1. Verify all required report files exist.
      2. Verify each report references at least one evidence artifact path.
      3. Verify unresolved issues are classified with rationale.
    Expected Result: Coherence final verdict report is complete and auditable.
    Failure Indicators: Missing report, unclassified unresolved issue, no evidence linkage.
    Evidence: .sisyphus/evidence/task-10-final-verdict.txt
  ```

  **Commit**: YES
  - Message: `docs(coherence): publish backend-frontend audit verdict and backlog`
  - Files: `.sisyphus/reports/*`
  - Pre-commit: report existence and lint checks

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| 8 | `fix(frontend-grpc): resolve depanssur client contract drift` | depanssur client files | frontend build/typecheck |
| 9 | `test(config): align grpc probe ports with runtime mapping` | e2e config/probe file | probe command success |
| 10 | `docs(coherence): publish backend-frontend audit verdict and backlog` | report artifacts | artifact existence checks |

---

## Success Criteria

### Verification Commands
```bash
grep -r "@GrpcMethod" services/service-core services/service-commercial services/service-engagement services/service-finance services/service-logistics --include="*.ts"
# Expected: non-zero methods per service and totals matching backend exposure report

grep -r "natsService.subscribe\|natsService.publish" services --include="*.ts"
# Expected: active/commented paths correctly represented in NATS matrix

bun run build
# Expected: frontend build succeeds after quick-fix tasks
```

### Final Checklist
- [ ] Coverage matrix complete and evidence-backed
- [ ] Auth posture explicitly classified with mitigation path
- [ ] NATS wiring status documented and prioritized
- [ ] Broken/orphan frontend gRPC client status resolved
- [ ] Port drift between runtime and test probes resolved or explicitly accepted
- [ ] Final verdict report ready for execution handoff
