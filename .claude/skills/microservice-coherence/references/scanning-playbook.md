# Scanning Playbook

Patterns and heuristics for detecting service characteristics. Use this reference when building Service Manifests.

## Service Discovery

### Entry Point Detection

Scan repo for service root indicators:

| File | Language/Stack | Notes |
|------|----------------|-------|
| `package.json` | Node.js/TypeScript | Check for `main`, `type: module` |
| `go.mod` | Go | Module path indicates service name |
| `Cargo.toml` | Rust | Check `[package]` section |
| `pyproject.toml` | Python (modern) | Poetry or setuptools |
| `requirements.txt` | Python (legacy) | Combine with setup.py |
| `pom.xml` | Java (Maven) | Check `<artifactId>` |
| `build.gradle` | Java/Kotlin (Gradle) | Check project name |
| `Gemfile` | Ruby | Bundler-managed |
| `mix.exs` | Elixir | Mix project |
| `composer.json` | PHP | Composer package |

### Exclusion Patterns

Skip these directories:

```
node_modules/
vendor/
.git/
dist/
build/
target/
__pycache__/
.venv/
venv/
.idea/
.vscode/
```

### Monorepo Structures

Common patterns:

```
# Pattern 1: services/ or apps/
monorepo/
├── services/
│   ├── user-service/
│   ├── order-service/
│   └── payment-service/

# Pattern 2: packages/ (often for libs + services)
monorepo/
├── packages/
│   ├── api-gateway/
│   ├── worker/
│   └── shared-lib/

# Pattern 3: Flat with prefixes
monorepo/
├── svc-user/
├── svc-order/
├── lib-common/

# Pattern 4: Domain-grouped
monorepo/
├── domains/
│   ├── users/
│   │   ├── api/
│   │   └── worker/
│   └── orders/
│       ├── api/
│       └── processor/
```

---

## Language & Framework Detection

### TypeScript/JavaScript

```
# Check package.json for:

Framework detection:
- "express" → Express.js
- "fastify" → Fastify
- "@nestjs/core" → NestJS
- "koa" → Koa
- "hapi" → Hapi
- "@hono/hono" or "hono" → Hono
- "next" → Next.js (fullstack)

Runtime detection:
- devDependencies has "typescript" → TypeScript
- "type": "module" → ESM
- Check for tsconfig.json

Package manager:
- package-lock.json → npm
- yarn.lock → Yarn
- pnpm-lock.yaml → pnpm
- bun.lockb → Bun
```

### Go

```
# Check go.mod for:

Framework detection (grep imports in .go files):
- "github.com/gin-gonic/gin" → Gin
- "github.com/labstack/echo" → Echo
- "github.com/go-chi/chi" → Chi
- "github.com/gofiber/fiber" → Fiber
- "net/http" only → Standard library

gRPC detection:
- "google.golang.org/grpc" → gRPC
- Look for *.proto files
```

### Python

```
# Check pyproject.toml or requirements.txt for:

Framework detection:
- fastapi → FastAPI
- flask → Flask
- django → Django
- starlette → Starlette
- aiohttp → aiohttp
- tornado → Tornado

Worker detection:
- celery → Celery
- rq → RQ (Redis Queue)
- dramatiq → Dramatiq
- huey → Huey

Package manager:
- pyproject.toml with [tool.poetry] → Poetry
- pyproject.toml with [build-system] → pip/setuptools
- Pipfile → Pipenv
- requirements.txt only → pip
```

### Java

```
# Check pom.xml or build.gradle for:

Framework detection:
- spring-boot-starter-web → Spring Boot
- spring-boot-starter-webflux → Spring WebFlux
- io.micronaut → Micronaut
- io.quarkus → Quarkus
- io.dropwizard → Dropwizard
```

---

## Service Type Inference

### API Service Indicators

```
+ Has HTTP server setup (express(), fastify(), gin.Default())
+ Has route definitions (app.get, router.HandleFunc)
+ Has controller/handler files
+ Exposes ports in Dockerfile
+ Has OpenAPI/Swagger spec
```

### Worker Service Indicators

```
+ Has queue consumer (celery.task, bullmq, asynq)
+ Has cron/scheduler setup
+ No HTTP routes
+ Dockerfile has no EXPOSE
+ References message broker (redis, rabbitmq, kafka)
```

### Gateway/BFF Indicators

```
+ Proxies to other services (http-proxy, createProxyMiddleware)
+ Aggregates multiple endpoints
+ Has GraphQL schema that composes
+ Route config references other service URLs
```

### Library Indicators

```
+ No main entry point / no start script
+ Only exports (module.exports, export default)
+ package.json has "main" or "exports" but no "bin"
+ No Dockerfile
+ Referenced in other services' dependencies
```

---

## Structure Pattern Detection

### By-Type (Traditional MVC)

```
src/
├── controllers/
├── services/
├── models/
├── repositories/
├── routes/
├── middlewares/
└── utils/
```

Detection: Look for directories named `controllers`, `services`, `models`.

### By-Feature (Modular)

```
src/
├── users/
│   ├── user.controller.ts
│   ├── user.service.ts
│   ├── user.model.ts
│   └── user.routes.ts
├── orders/
│   └── ...
└── shared/
```

Detection: Directories contain multiple file types with same prefix.

### DDD (Domain-Driven Design)

```
src/
├── domain/
│   ├── entities/
│   ├── value-objects/
│   └── events/
├── application/
│   ├── use-cases/
│   └── dtos/
├── infrastructure/
│   ├── persistence/
│   └── messaging/
└── interfaces/
    ├── http/
    └── grpc/
```

Detection: Look for `domain/`, `application/`, `infrastructure/`, `interfaces/` directories.

### Hexagonal (Ports & Adapters)

```
src/
├── core/
│   ├── domain/
│   └── ports/
├── adapters/
│   ├── inbound/
│   │   ├── http/
│   │   └── grpc/
│   └── outbound/
│       ├── database/
│       └── messaging/
└── config/
```

Detection: Look for `ports/`, `adapters/`, `core/` directories.

---

## Contract Detection

### Protocol Buffers

```
Locations to check:
- proto/
- protos/
- api/proto/
- internal/proto/
- *.proto at root

Evidence:
- .proto files exist
- buf.yaml or buf.gen.yaml present
- protoc scripts in Makefile/package.json
```

### OpenAPI/Swagger

```
Locations to check:
- openapi.yaml / openapi.json
- swagger.yaml / swagger.json
- api/openapi.yaml
- docs/api.yaml
- Generated in code (@nestjs/swagger, FastAPI)

Evidence:
- YAML/JSON with "openapi: 3" or "swagger: 2"
- @ApiProperty decorators (NestJS)
- FastAPI app (auto-generates)
```

### GraphQL

```
Locations to check:
- schema.graphql
- *.graphql files
- src/schema/
- src/graphql/

Evidence:
- .graphql files
- graphql dependency
- type Query { in files
```

### AsyncAPI

```
Locations to check:
- asyncapi.yaml
- asyncapi.json
- events/asyncapi.yaml

Evidence:
- YAML/JSON with "asyncapi:"
- Event schema definitions
```

---

## Database Detection

### ORM/Client Detection

| Package | ORM/Client | Database |
|---------|------------|----------|
| `prisma` | Prisma | Multi |
| `@prisma/client` | Prisma | Multi |
| `typeorm` | TypeORM | Multi |
| `sequelize` | Sequelize | Multi |
| `drizzle-orm` | Drizzle | Multi |
| `mongoose` | Mongoose | MongoDB |
| `pg` | node-postgres | PostgreSQL |
| `mysql2` | MySQL2 | MySQL |
| `gorm.io/gorm` | GORM | Multi |
| `sqlalchemy` | SQLAlchemy | Multi |
| `django.db` | Django ORM | Multi |
| `tortoise-orm` | Tortoise | Multi |

### Migration Detection

```
Prisma:
- prisma/migrations/

TypeORM:
- src/migrations/
- migrations/

Sequelize:
- migrations/
- db/migrations/

Knex:
- migrations/
- db/migrations/

Django:
- */migrations/

Alembic:
- alembic/
- migrations/

Go (golang-migrate):
- migrations/
- db/migrations/

Flyway:
- db/migration/
- src/main/resources/db/migration/
```

---

## Test Detection

### Framework Detection

| Package | Framework | Language |
|---------|-----------|----------|
| `jest` | Jest | JS/TS |
| `vitest` | Vitest | JS/TS |
| `mocha` | Mocha | JS/TS |
| `ava` | AVA | JS/TS |
| `pytest` | pytest | Python |
| `unittest` | unittest | Python |
| `testing` (stdlib) | go test | Go |
| `testify` | Testify | Go |
| `junit` | JUnit | Java |
| `rspec` | RSpec | Ruby |

### Test Directory Patterns

```
TypeScript/JavaScript:
- tests/
- __tests__/
- test/
- src/**/*.test.ts
- src/**/*.spec.ts

Go:
- *_test.go (same directory)
- internal/*/test/

Python:
- tests/
- test/
- **/test_*.py
- **/*_test.py

Java:
- src/test/
- src/test/java/
```

### Test Type Detection

```
Unit tests:
- *.unit.test.ts
- test_unit_*.py
- *_unit_test.go

Integration tests:
- *.integration.test.ts
- tests/integration/
- *_integration_test.go

E2E tests:
- e2e/
- tests/e2e/
- cypress/
- playwright/
```

---

## Docker Detection

### Dockerfile Analysis

```
Base image:
- FROM node:20-alpine → Node.js 20
- FROM golang:1.21 → Go 1.21
- FROM python:3.11-slim → Python 3.11

Multi-stage:
- Multiple FROM statements
- AS builder pattern

Ports:
- EXPOSE 3000

Healthcheck:
- HEALTHCHECK instruction
```

### Compose Detection

```
Files:
- docker-compose.yml
- docker-compose.yaml
- compose.yml
- compose.yaml
- docker-compose.*.yml (override files)

Service references:
- Parse services: section
- Match service names to directories
```

---

## Healthcheck Detection

### Endpoint Patterns

```
Search for:
- /health
- /healthz
- /ready
- /readiness
- /liveness
- /live
- /_health
- /api/health

Route definitions:
- app.get('/health'
- router.GET("/health"
- @Get('health')
- @app.get("/health")
```

### Kubernetes Probes

```
Check Dockerfile:
- HEALTHCHECK CMD

Check k8s manifests:
- livenessProbe:
- readinessProbe:
- startupProbe:
```

---

## Observability Detection

### Logging

| Package | Library | Language |
|---------|---------|----------|
| `pino` | Pino | Node.js |
| `winston` | Winston | Node.js |
| `bunyan` | Bunyan | Node.js |
| `@nestjs/common` | NestJS Logger | Node.js |
| `go.uber.org/zap` | Zap | Go |
| `github.com/sirupsen/logrus` | Logrus | Go |
| `github.com/rs/zerolog` | Zerolog | Go |
| `logging` | stdlib | Python |
| `structlog` | Structlog | Python |
| `loguru` | Loguru | Python |

### Tracing

| Package | Library |
|---------|---------|
| `@opentelemetry/*` | OpenTelemetry |
| `dd-trace` | Datadog |
| `jaeger-client` | Jaeger |
| `go.opentelemetry.io/otel` | OpenTelemetry |
| `opentelemetry-*` | OpenTelemetry (Python) |

### Metrics

| Package | Library |
|---------|---------|
| `prom-client` | Prometheus (Node.js) |
| `@willsoto/nestjs-prometheus` | Prometheus (NestJS) |
| `github.com/prometheus/client_golang` | Prometheus (Go) |
| `prometheus_client` | Prometheus (Python) |
| `statsd` | StatsD |

---

## Comparison Heuristics

### Finding Majority Convention

```python
def find_majority(services, attribute):
    values = [getattr(s, attribute) for s in services if hasattr(s, attribute)]
    counter = Counter(values)
    if counter:
        majority, count = counter.most_common(1)[0]
        percentage = count / len(values) * 100
        return majority, percentage
    return None, 0
```

### Selecting Golden Reference

When no clear majority:
1. Pick service with most complete manifest
2. Prefer services with best test coverage
3. Prefer most recently modified
4. Ask user to choose

### Version Comparison

```python
def compare_versions(services, dependency):
    versions = {}
    for s in services:
        for dep in s.dependencies.keyDeps:
            if dep.name == dependency:
                if dep.version not in versions:
                    versions[dep.version] = []
                versions[dep.version].append(s.name)

    if len(versions) > 1:
        return {
            'inconsistent': True,
            'versions': versions,
            'latest': max(versions.keys(), key=semver_parse)
        }
    return {'inconsistent': False}
```

---

## Scan Order

Recommended execution sequence:

1. **Discover services** (find all service roots)
2. **Detect language/runtime** (per service)
3. **Extract dependencies** (parse lockfiles)
4. **Identify framework** (from dependencies)
5. **Analyze structure** (directory patterns)
6. **Find contracts** (proto/openapi)
7. **Detect database** (ORM, migrations)
8. **Find events** (pub/sub patterns)
9. **Locate tests** (framework, directories)
10. **Parse Docker** (Dockerfile, compose)
11. **Check healthcheck** (endpoints)
12. **Detect observability** (logging, tracing, metrics)

Each step populates the corresponding section of the Service Manifest.
