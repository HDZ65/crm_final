# Fix Packs

A Fix Pack is a minimal, self-contained correction for a coherence issue. Each pack includes everything needed to safely apply and rollback the change.

## Fix Pack Structure

```typescript
interface FixPack {
  // Identity
  id: string;                    // FP-001, FP-002, etc.
  ruleId: string;                // Rule that triggered this fix

  // Scope
  targetServices: string[];      // Services affected
  targetFiles: FileChange[];     // Exact files to modify

  // Description
  goal: string;                  // What this fix achieves
  rationale: string;             // Why this fix is needed

  // Changes
  changes: Change[];             // Ordered list of changes

  // Risk Assessment
  risk: RiskAssessment;

  // Validation
  preChecks: Command[];          // Run before applying
  postChecks: Command[];         // Run after applying
  smokeTests: Command[];         // Optional additional validation

  // Rollback
  rollback: RollbackPlan;

  // Metadata
  priority: Priority;
  cost: Cost;
  dependencies: string[];        // Other FP IDs that must be applied first
}
```

## Type Definitions

### FileChange

```typescript
interface FileChange {
  path: string;                  // Relative path from repo root
  operation: 'create' | 'modify' | 'delete' | 'rename';
  oldPath?: string;              // For rename operations
}
```

### Change

```typescript
interface Change {
  file: string;
  type: 'insert' | 'replace' | 'delete' | 'create';

  // For insert/replace/delete
  anchor?: {
    type: 'line' | 'pattern' | 'after' | 'before';
    value: string | number;
  };

  // Content
  oldContent?: string;           // For replace/delete (for diff display)
  newContent?: string;           // For insert/replace/create

  // Display
  diffPreview: string;           // Unified diff format for display
}
```

### RiskAssessment

```typescript
interface RiskAssessment {
  level: 'low' | 'medium' | 'high';

  factors: {
    breakingChange: boolean;     // Could break existing functionality
    dataImpact: boolean;         // Affects data storage/format
    contractChange: boolean;     // Modifies API/proto contracts
    configChange: boolean;       // Changes configuration
    dependencyChange: boolean;   // Modifies dependencies
  };

  mitigations: string[];         // Steps taken to reduce risk
  warnings: string[];            // Things to watch out for
}
```

### Command

```typescript
interface Command {
  description: string;
  command: string;               // Shell command
  workingDir?: string;           // Relative to repo root
  expectedOutcome: string;       // What success looks like
  onFailure: 'abort' | 'warn' | 'continue';
}
```

### RollbackPlan

```typescript
interface RollbackPlan {
  strategy: 'git-revert' | 'manual' | 'script';

  // For git-revert
  commitMessage?: string;

  // For manual
  steps?: string[];

  // For script
  script?: string;

  // Always
  verification: Command;         // How to verify rollback worked
}
```

### Priority & Cost

```typescript
type Priority = 'critical' | 'high' | 'medium' | 'low';

interface Cost {
  files: number;                 // Number of files affected
  lines: number;                 // Approximate lines changed
  effort: 'trivial' | 'low' | 'medium' | 'high';
  timeEstimate: string;          // Human readable: "< 5 min", "15-30 min"
}
```

---

## Fix Pack Examples

### FP-001: Add Missing Healthcheck

```yaml
id: FP-001
ruleId: MIN-002
targetServices: [user-service]
targetFiles:
  - path: services/user-service/src/routes/health.ts
    operation: create
  - path: services/user-service/src/routes/index.ts
    operation: modify

goal: Add /health endpoint to user-service

rationale: |
  Kubernetes liveness/readiness probes require a health endpoint.
  Without it, pods cannot be properly monitored and may be killed incorrectly.

changes:
  - file: services/user-service/src/routes/health.ts
    type: create
    newContent: |
      import { FastifyInstance } from 'fastify';

      export async function healthRoutes(app: FastifyInstance) {
        app.get('/health', async () => {
          return { status: 'ok', timestamp: new Date().toISOString() };
        });

        app.get('/ready', async () => {
          // Add dependency checks here (DB, cache, etc.)
          return { status: 'ready' };
        });
      }
    diffPreview: |
      +++ b/services/user-service/src/routes/health.ts
      @@ -0,0 +1,14 @@
      +import { FastifyInstance } from 'fastify';
      +
      +export async function healthRoutes(app: FastifyInstance) {
      +  app.get('/health', async () => {
      +    return { status: 'ok', timestamp: new Date().toISOString() };
      +  });
      +  ...
      +}

  - file: services/user-service/src/routes/index.ts
    type: insert
    anchor:
      type: after
      value: "import.*Routes.*from"
    newContent: |
      import { healthRoutes } from './health';
    diffPreview: |
      @@ -2,6 +2,7 @@
       import { userRoutes } from './users';
      +import { healthRoutes } from './health';

  - file: services/user-service/src/routes/index.ts
    type: insert
    anchor:
      type: after
      value: "app.register\\(userRoutes"
    newContent: |
      app.register(healthRoutes);
    diffPreview: |
      @@ -10,6 +11,7 @@
         app.register(userRoutes);
      +  app.register(healthRoutes);

risk:
  level: low
  factors:
    breakingChange: false
    dataImpact: false
    contractChange: false
    configChange: false
    dependencyChange: false
  mitigations:
    - New endpoint only, no existing code modified
    - Matches pattern from order-service
  warnings:
    - Ensure /health is not auth-protected

preChecks:
  - description: Verify service builds
    command: cd services/user-service && npm run build
    expectedOutcome: Build succeeds with exit 0
    onFailure: abort

postChecks:
  - description: Verify service still builds
    command: cd services/user-service && npm run build
    expectedOutcome: Build succeeds with exit 0
    onFailure: abort
  - description: Verify tests pass
    command: cd services/user-service && npm test
    expectedOutcome: All tests pass
    onFailure: warn

smokeTests:
  - description: Verify health endpoint responds
    command: |
      cd services/user-service && npm run dev &
      sleep 3 && curl -f http://localhost:3000/health
    expectedOutcome: Returns {"status":"ok",...}
    onFailure: abort

rollback:
  strategy: git-revert
  commitMessage: "Revert: Add healthcheck to user-service"
  verification:
    description: Verify revert completed
    command: git status
    expectedOutcome: Clean working tree
    onFailure: warn

priority: critical
cost:
  files: 2
  lines: 20
  effort: trivial
  timeEstimate: "< 5 min"

dependencies: []
```

### FP-002: Standardize Test Directory

```yaml
id: FP-002
ruleId: TS-005
targetServices: [payment-service]
targetFiles:
  - path: services/payment-service/__tests__
    operation: rename
    oldPath: services/payment-service/__tests__
  - path: services/payment-service/tests
    operation: create
  - path: services/payment-service/vitest.config.ts
    operation: modify

goal: Rename __tests__ to tests/ to match other services

rationale: |
  3 of 4 services use tests/ directory. Standardizing improves:
  - CI script consistency (single glob pattern)
  - Developer navigation expectations
  - IDE configuration sharing

changes:
  - file: services/payment-service
    type: rename
    anchor:
      type: pattern
      value: "__tests__"
    newContent: "tests"
    diffPreview: |
      services/payment-service/__tests__ -> services/payment-service/tests/

  - file: services/payment-service/vitest.config.ts
    type: replace
    anchor:
      type: pattern
      value: "__tests__"
    oldContent: "include: ['__tests__/**/*.test.ts']"
    newContent: "include: ['tests/**/*.test.ts']"
    diffPreview: |
      @@ -5,7 +5,7 @@
       export default defineConfig({
         test: {
      -    include: ['__tests__/**/*.test.ts'],
      +    include: ['tests/**/*.test.ts'],
         }
       });

risk:
  level: low
  factors:
    breakingChange: false
    dataImpact: false
    contractChange: false
    configChange: true
    dependencyChange: false
  mitigations:
    - Directory rename is atomic in git
    - Only config file updated
  warnings:
    - Check for hardcoded __tests__ paths in CI config

preChecks:
  - description: Verify tests pass before rename
    command: cd services/payment-service && npm test
    expectedOutcome: All tests pass
    onFailure: abort

postChecks:
  - description: Verify tests still discovered
    command: cd services/payment-service && npm test
    expectedOutcome: Same number of tests run
    onFailure: abort

rollback:
  strategy: manual
  steps:
    - "git mv services/payment-service/tests services/payment-service/__tests__"
    - "Revert vitest.config.ts change"
  verification:
    description: Verify tests still work
    command: cd services/payment-service && npm test
    expectedOutcome: All tests pass
    onFailure: warn

priority: medium
cost:
  files: 2
  lines: 2
  effort: trivial
  timeEstimate: "< 5 min"

dependencies: []
```

### FP-003: Update Framework Version

```yaml
id: FP-003
ruleId: TS-010
targetServices: [notification-service, analytics-service]
targetFiles:
  - path: services/notification-service/package.json
    operation: modify
  - path: services/analytics-service/package.json
    operation: modify

goal: Update fastify from 4.21.0 to 4.24.0 in notification and analytics services

rationale: |
  user-service and order-service use fastify 4.24.0.
  Version drift causes:
  - Inconsistent behavior between services
  - Security patch delays
  - Plugin compatibility issues

changes:
  - file: services/notification-service/package.json
    type: replace
    anchor:
      type: pattern
      value: '"fastify":'
    oldContent: '"fastify": "4.21.0"'
    newContent: '"fastify": "4.24.0"'
    diffPreview: |
      @@ -15,7 +15,7 @@
         "dependencies": {
      -    "fastify": "4.21.0",
      +    "fastify": "4.24.0",

  - file: services/analytics-service/package.json
    type: replace
    anchor:
      type: pattern
      value: '"fastify":'
    oldContent: '"fastify": "4.21.0"'
    newContent: '"fastify": "4.24.0"'
    diffPreview: |
      @@ -15,7 +15,7 @@
         "dependencies": {
      -    "fastify": "4.21.0",
      +    "fastify": "4.24.0",

risk:
  level: medium
  factors:
    breakingChange: false  # Minor version, should be compatible
    dataImpact: false
    contractChange: false
    configChange: false
    dependencyChange: true
  mitigations:
    - Minor version update only
    - Same major version as reference services
    - Will reinstall with lockfile update
  warnings:
    - Review fastify 4.24.0 changelog for breaking changes
    - Run full test suite after update

preChecks:
  - description: Verify current tests pass
    command: |
      cd services/notification-service && npm test &&
      cd ../analytics-service && npm test
    expectedOutcome: All tests pass
    onFailure: abort

postChecks:
  - description: Reinstall dependencies
    command: |
      cd services/notification-service && npm install &&
      cd ../analytics-service && npm install
    expectedOutcome: Install succeeds
    onFailure: abort
  - description: Verify builds
    command: |
      cd services/notification-service && npm run build &&
      cd ../analytics-service && npm run build
    expectedOutcome: Build succeeds
    onFailure: abort
  - description: Verify tests
    command: |
      cd services/notification-service && npm test &&
      cd ../analytics-service && npm test
    expectedOutcome: All tests pass
    onFailure: abort

smokeTests:
  - description: Start services and verify health
    command: |
      # Start both services, hit health endpoints
      echo "Manual smoke test recommended"
    expectedOutcome: Services respond on health endpoints
    onFailure: warn

rollback:
  strategy: git-revert
  commitMessage: "Revert: Update fastify version"
  verification:
    description: Reinstall and verify
    command: |
      cd services/notification-service && npm install && npm test
    expectedOutcome: Tests pass with old version
    onFailure: warn

priority: high
cost:
  files: 2
  lines: 2
  effort: low
  timeEstimate: "10-15 min"

dependencies: []
```

---

## Fix Pack Grouping

When presenting Fix Packs to the user, group by:

### By Priority

```
## Critical (apply immediately)
- FP-001: Add healthcheck to user-service
- FP-007: Fix missing Dockerfile in worker-service

## High (apply soon)
- FP-003: Update fastify version

## Medium (scheduled maintenance)
- FP-002: Standardize test directory
- FP-004: Align ESLint config

## Low (nice to have)
- FP-005: Consistent script naming
```

### By Cost

```
## Quick Wins (< 5 min each)
- FP-001, FP-002, FP-005

## Moderate Effort (15-30 min)
- FP-003, FP-004

## Significant Effort (> 30 min)
- FP-006, FP-007
```

---

## Fix Pack Application Workflow

```
1. User selects Fix Pack(s) to apply
2. Run all preChecks for selected packs
   - If any fails with onFailure=abort → stop
   - If any fails with onFailure=warn → show warning, ask to continue
3. Apply changes in order
4. Run postChecks
   - If any fails → offer rollback
5. Optionally run smokeTests
6. Commit changes (if user wants)
7. Update coherence report
```

## Fix Pack Dependencies

Some Fix Packs must be applied in order:

```yaml
# FP-010 depends on FP-009
id: FP-010
dependencies: [FP-009]

# When user selects FP-010, automatically include FP-009
# Apply in dependency order: FP-009 first, then FP-010
```

---

## Creating Fix Packs

When generating a Fix Pack:

1. **Minimize scope**: One issue per pack
2. **Be explicit**: Exact file paths, exact changes
3. **Provide context**: Why this fix, why this approach
4. **Assess risk honestly**: Don't hide potential issues
5. **Make rollback trivial**: Prefer git-revertable changes
6. **Include verification**: Both automated and manual checks
7. **Reference examples**: Point to "golden" service when applicable
