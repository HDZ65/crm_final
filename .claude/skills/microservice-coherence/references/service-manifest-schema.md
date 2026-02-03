# Service Manifest Schema

A Service Manifest is a normalized JSON-like object capturing all coherence-relevant aspects of a microservice.

## Schema Definition

```typescript
interface ServiceManifest {
  // Identity
  name: string;                    // Directory name or package name
  path: string;                    // Relative path from repo root
  type: ServiceType;               // Inferred service type

  // Stack
  language: string;                // Primary language (typescript, go, python, java, rust, etc.)
  framework?: string;              // Framework if detectable (express, fastify, gin, django, spring, etc.)
  runtime?: string;                // Runtime (node, deno, bun, etc.)

  // Structure
  structure: DirectoryStructure;   // Layer organization

  // Interface
  ports: Port[];                   // Exposed ports
  endpoints?: EndpointInfo;        // API surface

  // Scripts
  scripts: ScriptMap;              // Available npm/make/shell scripts

  // Dependencies
  dependencies: DependencyInfo;    // Key deps with versions

  // Contracts
  contracts: ContractInfo;         // Proto/OpenAPI/GraphQL definitions

  // Data
  database?: DatabaseInfo;         // ORM, migrations, seeds

  // Events
  events?: EventInfo;              // Pub/sub patterns, event catalog

  // Quality
  tests: TestInfo;                 // Test setup
  linting?: LintInfo;              // Linter config

  // Deployment
  docker: DockerInfo;              // Dockerfile, compose
  healthcheck?: HealthcheckInfo;   // Health endpoints

  // Observability
  observability: ObservabilityInfo; // Logging, tracing, metrics
}
```

## Type Definitions

### ServiceType

```typescript
type ServiceType =
  | 'api'           // HTTP/gRPC API service
  | 'worker'        // Background job processor
  | 'gateway'       // API gateway / BFF
  | 'library'       // Shared library (not deployed)
  | 'cli'           // Command-line tool
  | 'unknown';      // Could not determine
```

**Detection heuristics**:
- `api`: Has HTTP server setup, routes, controllers
- `worker`: Has queue consumer, cron jobs, no HTTP server
- `gateway`: Proxies to other services, has route aggregation
- `library`: No main entry, only exports
- `cli`: Has bin entry, commander/yargs/cobra usage

### DirectoryStructure

```typescript
interface DirectoryStructure {
  pattern: StructurePattern;
  layers: string[];              // Detected layer folders
  entryPoint?: string;           // Main file
}

type StructurePattern =
  | 'flat'                       // All files in root
  | 'by-type'                    // src/controllers, src/services, src/models
  | 'by-feature'                 // src/users, src/orders, src/products
  | 'ddd'                        // domain, application, infrastructure, interfaces
  | 'hexagonal'                  // core, adapters, ports
  | 'custom';                    // Non-standard
```

### Port

```typescript
interface Port {
  number: number;
  protocol: 'http' | 'grpc' | 'tcp' | 'udp';
  source: string;                // Where detected (Dockerfile, env, config)
}
```

### EndpointInfo

```typescript
interface EndpointInfo {
  style: 'rest' | 'grpc' | 'graphql' | 'mixed';
  routeFiles?: string[];         // Files defining routes
  hasVersioning: boolean;        // /v1/, /v2/ patterns
}
```

### ScriptMap

```typescript
interface ScriptMap {
  build?: string;                // Build command
  test?: string;                 // Test command
  lint?: string;                 // Lint command
  start?: string;                // Start command
  dev?: string;                  // Dev command
  migrate?: string;              // Migration command
  [key: string]: string | undefined;
}
```

### DependencyInfo

```typescript
interface DependencyInfo {
  manager: 'npm' | 'yarn' | 'pnpm' | 'go' | 'pip' | 'poetry' | 'cargo' | 'maven' | 'gradle';
  lockfile: boolean;             // Has lockfile
  keyDeps: KeyDependency[];      // Important deps for coherence
}

interface KeyDependency {
  name: string;
  version: string;
  category: 'framework' | 'orm' | 'testing' | 'logging' | 'validation' | 'http' | 'queue' | 'other';
}
```

### ContractInfo

```typescript
interface ContractInfo {
  hasProto: boolean;
  protoPath?: string;
  hasOpenAPI: boolean;
  openAPIPath?: string;
  hasGraphQL: boolean;
  graphQLPath?: string;
  hasAsyncAPI: boolean;          // For event-driven
  asyncAPIPath?: string;
}
```

### DatabaseInfo

```typescript
interface DatabaseInfo {
  orm?: string;                  // prisma, typeorm, gorm, sqlalchemy, etc.
  ormConfigPath?: string;
  migrationsPath?: string;
  migrationsStyle: 'sql' | 'code' | 'none';
  seedsPath?: string;
}
```

### EventInfo

```typescript
interface EventInfo {
  patterns: ('publish' | 'subscribe' | 'saga')[];
  broker?: string;               // kafka, rabbitmq, redis, nats, etc.
  catalogPath?: string;          // Event definitions file
  eventFiles?: string[];         // Files with event handling
}
```

### TestInfo

```typescript
interface TestInfo {
  framework?: string;            // jest, vitest, pytest, go test, etc.
  testsPath: string;             // tests/, __tests__, *_test.go, etc.
  hasUnitTests: boolean;
  hasIntegrationTests: boolean;
  hasE2ETests: boolean;
  configFile?: string;           // jest.config.js, vitest.config.ts, etc.
}
```

### LintInfo

```typescript
interface LintInfo {
  tools: string[];               // eslint, prettier, golangci-lint, ruff, etc.
  configFiles: string[];         // .eslintrc, .prettierrc, etc.
}
```

### DockerInfo

```typescript
interface DockerInfo {
  hasDockerfile: boolean;
  dockerfilePath?: string;
  baseImage?: string;            // node:18, golang:1.21, etc.
  hasCompose: boolean;
  composeRefs?: string[];        // References in docker-compose files
  multiStage: boolean;
}
```

### HealthcheckInfo

```typescript
interface HealthcheckInfo {
  hasHealthEndpoint: boolean;
  healthPath?: string;           // /health, /healthz, /ready
  hasReadiness: boolean;
  hasLiveness: boolean;
}
```

### ObservabilityInfo

```typescript
interface ObservabilityInfo {
  logging: {
    library?: string;            // winston, pino, zap, logrus, etc.
    structured: boolean;
  };
  tracing: {
    enabled: boolean;
    library?: string;            // opentelemetry, jaeger, etc.
  };
  metrics: {
    enabled: boolean;
    library?: string;            // prometheus, statsd, etc.
    endpoint?: string;           // /metrics
  };
}
```

## Manifest Generation Pseudocode

```
function generateManifest(servicePath):
  manifest = {}

  # Identity
  manifest.name = basename(servicePath)
  manifest.path = relativePath(servicePath)

  # Detect language/framework
  if exists(servicePath + "/package.json"):
    pkg = readJSON("package.json")
    manifest.language = "typescript" if hasTSConfig else "javascript"
    manifest.framework = detectFramework(pkg.dependencies)
    manifest.scripts = pkg.scripts
    manifest.dependencies = extractKeyDeps(pkg)
  elif exists(servicePath + "/go.mod"):
    manifest.language = "go"
    manifest.framework = detectGoFramework(readFile("go.mod"))
    # ... etc

  # Detect type
  manifest.type = inferServiceType(manifest)

  # Structure analysis
  manifest.structure = analyzeStructure(servicePath)

  # Contracts
  manifest.contracts = scanContracts(servicePath)

  # Database
  manifest.database = detectDatabase(servicePath, manifest.dependencies)

  # Events
  manifest.events = detectEvents(servicePath, manifest.dependencies)

  # Tests
  manifest.tests = analyzeTests(servicePath)

  # Docker
  manifest.docker = analyzeDocker(servicePath)

  # Healthcheck
  manifest.healthcheck = detectHealthcheck(servicePath, manifest.endpoints)

  # Observability
  manifest.observability = detectObservability(manifest.dependencies)

  return manifest
```

## Example Manifest

```json
{
  "name": "user-service",
  "path": "services/user-service",
  "type": "api",
  "language": "typescript",
  "framework": "fastify",
  "runtime": "node",
  "structure": {
    "pattern": "by-type",
    "layers": ["controllers", "services", "repositories", "models"],
    "entryPoint": "src/index.ts"
  },
  "ports": [
    { "number": 3000, "protocol": "http", "source": "Dockerfile" }
  ],
  "endpoints": {
    "style": "rest",
    "routeFiles": ["src/routes/index.ts", "src/routes/users.ts"],
    "hasVersioning": true
  },
  "scripts": {
    "build": "tsc",
    "test": "vitest",
    "lint": "eslint .",
    "start": "node dist/index.js",
    "dev": "tsx watch src/index.ts"
  },
  "dependencies": {
    "manager": "pnpm",
    "lockfile": true,
    "keyDeps": [
      { "name": "fastify", "version": "4.24.0", "category": "framework" },
      { "name": "prisma", "version": "5.6.0", "category": "orm" },
      { "name": "vitest", "version": "1.0.0", "category": "testing" },
      { "name": "pino", "version": "8.16.0", "category": "logging" }
    ]
  },
  "contracts": {
    "hasProto": false,
    "hasOpenAPI": true,
    "openAPIPath": "openapi.yaml",
    "hasGraphQL": false,
    "hasAsyncAPI": false
  },
  "database": {
    "orm": "prisma",
    "ormConfigPath": "prisma/schema.prisma",
    "migrationsPath": "prisma/migrations",
    "migrationsStyle": "code",
    "seedsPath": "prisma/seed.ts"
  },
  "events": {
    "patterns": ["publish"],
    "broker": "redis",
    "eventFiles": ["src/events/publisher.ts"]
  },
  "tests": {
    "framework": "vitest",
    "testsPath": "tests/",
    "hasUnitTests": true,
    "hasIntegrationTests": true,
    "hasE2ETests": false,
    "configFile": "vitest.config.ts"
  },
  "docker": {
    "hasDockerfile": true,
    "dockerfilePath": "Dockerfile",
    "baseImage": "node:20-alpine",
    "hasCompose": true,
    "composeRefs": ["docker-compose.yml:user-service"],
    "multiStage": true
  },
  "healthcheck": {
    "hasHealthEndpoint": true,
    "healthPath": "/health",
    "hasReadiness": true,
    "hasLiveness": true
  },
  "observability": {
    "logging": { "library": "pino", "structured": true },
    "tracing": { "enabled": true, "library": "opentelemetry" },
    "metrics": { "enabled": true, "library": "prom-client", "endpoint": "/metrics" }
  }
}
```

## Comparison Keys

When comparing manifests, prioritize these aspects:

1. **Critical** (service won't work correctly without):
   - Healthcheck presence
   - Docker configuration
   - Database migrations style

2. **High** (affects maintainability):
   - Test framework/location consistency
   - Script naming conventions
   - Key dependency versions
   - Logging library

3. **Medium** (affects developer experience):
   - Directory structure pattern
   - Linting tools
   - Observability setup

4. **Low** (cosmetic but worth noting):
   - Entry point naming
   - Config file locations
