# Intégration Winaity-clean (Action Plan)

## Checklist complète

### 1. Service folder

```bash
# Créer le service
mkdir -p services/<service-name>/src/<context>/{domain,application,infrastructure}
mkdir -p services/<service-name>/proto/generated
mkdir -p services/<service-name>/test
```

### 2. Port gRPC

| Service | Port |
|---------|------|
| user-service | 50051 |
| contact-api-service | 50052 |
| campaign-service | 50054 |
| template-service | 50056 |
| analytics-service | 50057 |
| tracking-service | 50058 |
| audience-service | 50059 |
| ai-service | 50060 |
| **LIBRE** | 50061+ |

**Vérifier dans docker-compose :**
```bash
grep -r "50[0-9][0-9][0-9]" compose/*.yml | grep GRPC_PORT
```

---

## 3. docker-compose.yml

### Service NestJS

```yaml
# compose/<service-name>.yml
version: '3.8'

services:
  <service-name>:
    build:
      context: ../services/<service-name>
      dockerfile: Dockerfile
    container_name: <service-name>
    environment:
      - NODE_ENV=development
      - GRPC_PORT=50061
      - DB_HOST=postgres-<context>
      - DB_PORT=5432
      - DB_NAME=<context>_db
      - DB_USER=postgres
      - DB_PASSWORD=postgres
      - NATS_URL=nats://nats:4222
      - CONSUL_HOST=consul
      - CONSUL_PORT=8500
    ports:
      - "50061:50061"
    depends_on:
      - postgres-<context>
      - nats
      - consul
    networks:
      - winaity-network
    restart: unless-stopped

  postgres-<context>:
    image: postgres:15-alpine
    container_name: postgres-<context>
    environment:
      - POSTGRES_DB=<context>_db
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
    volumes:
      - postgres-<context>-data:/var/lib/postgresql/data
    ports:
      - "5442:5432"  # Port externe unique
    networks:
      - winaity-network

volumes:
  postgres-<context>-data:

networks:
  winaity-network:
    external: true
```

### Ajout au docker-compose principal

```yaml
# docker-compose.yml
include:
  - compose/consul.yml
  - compose/nats.yml
  - compose/gateway.yml
  # ... autres services
  - compose/<service-name>.yml  # AJOUTER
```

---

## 4. Consul (Service Discovery)

### Enregistrement automatique

```typescript
// src/config/consul.config.ts
import { Module, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import Consul from 'consul';

@Module({})
export class ConsulModule implements OnModuleInit, OnModuleDestroy {
  private consul: Consul;
  private serviceId: string;

  async onModuleInit() {
    this.consul = new Consul({
      host: process.env.CONSUL_HOST || 'consul',
      port: process.env.CONSUL_PORT || '8500',
    });

    this.serviceId = `<service-name>-${process.env.HOSTNAME || 'local'}`;

    await this.consul.agent.service.register({
      id: this.serviceId,
      name: '<service-name>',
      address: process.env.HOSTNAME || 'localhost',
      port: parseInt(process.env.GRPC_PORT || '50061'),
      check: {
        grpc: `${process.env.HOSTNAME || 'localhost'}:${process.env.GRPC_PORT || '50061'}`,
        interval: '10s',
        timeout: '5s',
      },
      tags: ['grpc', 'nestjs', '<context>'],
    });

    console.log(`Registered with Consul as ${this.serviceId}`);
  }

  async onModuleDestroy() {
    await this.consul.agent.service.deregister(this.serviceId);
  }
}
```

### Vérification

```bash
# Liste des services enregistrés
curl http://localhost:8500/v1/agent/services | jq

# Health check
curl http://localhost:8500/v1/health/service/<service-name> | jq
```

---

## 5. Proto (packages/proto)

### Ajouter les fichiers

```bash
# Créer les protos
touch packages/proto/<context>_commands.proto
touch packages/proto/<context>_queries.proto

# Mettre à jour buf.yaml si nécessaire
```

### Générer

```bash
cd packages/proto
buf generate

# Copier vers le service
cp -r gen/ts/* ../services/<service-name>/proto/generated/
```

---

## 6. Gateway (Rust)

### Si exposé via REST

```rust
// gateway/src/grpc_clients/<context>.rs
use tonic::transport::Channel;
use crate::proto::<context>_commands::<Context>CommandsServiceClient;
use crate::proto::<context>_queries::<Context>QueriesServiceClient;

pub struct <Context>Client {
    pub commands: <Context>CommandsServiceClient<Channel>,
    pub queries: <Context>QueriesServiceClient<Channel>,
}

impl <Context>Client {
    pub async fn new(consul: &ConsulClient) -> Result<Self, Error> {
        let addr = consul.get_service_address("<service-name>").await?;
        let channel = Channel::from_shared(format!("http://{}", addr))?
            .connect()
            .await?;

        Ok(Self {
            commands: <Context>CommandsServiceClient::new(channel.clone()),
            queries: <Context>QueriesServiceClient::new(channel),
        })
    }
}
```

### Routes HTTP

```rust
// gateway/src/routes/<context>.rs
use axum::{Router, routing::{get, post, patch, delete}};

pub fn <context>_routes() -> Router {
    Router::new()
        .route("/v1/<context>s", post(create_<aggregate>))
        .route("/v1/<context>s", get(list_<aggregate>s))
        .route("/v1/<context>s/:id", get(get_<aggregate>))
        .route("/v1/<context>s/:id", patch(update_<aggregate>))
        .route("/v1/<context>s/:id", delete(delete_<aggregate>))
}
```

---

## 7. Catalogues

### event_catalog.yaml

```yaml
# docs/catalogs/event_catalog.yaml
events:
  # ... events existants ...

  # AJOUTER
  - name: <context>.<aggregate>.created
    producer: <service-name>
    consumers:
      - analytics-service
    schema: |
      {
        "aggregateId": "string",
        "name": "string",
        "createdAt": "ISO8601"
      }

  - name: <context>.<aggregate>.updated
    producer: <service-name>
    consumers: []
```

### service_catalog.yaml

```yaml
# docs/catalogs/service_catalog.yaml
services:
  # ... services existants ...

  # AJOUTER
  - name: <service-name>
    type: grpc
    port: 50061
    database: postgres-<context>:5442
    bounded_context: <context>
    aggregate_roots:
      - <Aggregate>
    dependencies:
      - consul
      - nats
    events:
      publishes:
        - <context>.<aggregate>.created
        - <context>.<aggregate>.updated
      subscribes: []
```

---

## 8. Makefile

### Ajouter les targets

```makefile
# Makefile

# === <SERVICE-NAME> ===
<service-name>-up:
	docker compose -f compose/<service-name>.yml up -d --build

<service-name>-down:
	docker compose -f compose/<service-name>.yml down

<service-name>-logs:
	docker compose -f compose/<service-name>.yml logs -f

<service-name>-shell:
	docker exec -it <service-name> sh

<service-name>-migrate:
	docker exec -it <service-name> npm run migration:run

<service-name>-migrate-revert:
	docker exec -it <service-name> npm run migration:revert
```

---

## 9. Commandes post-création

```bash
# 1. Installer les dépendances
cd services/<service-name>
npm install

# 2. Générer les protos
cd ../../packages/proto
buf generate
cp -r gen/ts/* ../services/<service-name>/proto/generated/

# 3. Lancer la DB
docker compose -f compose/<service-name>.yml up -d postgres-<context>

# 4. Créer la migration initiale
cd ../../services/<service-name>
npm run migration:generate -- -n Init<Context>

# 5. Run migrations
npm run migration:run

# 6. Tester en local
npm run start:dev

# 7. Build Docker
docker build -t <service-name> .

# 8. Lancer le service complet
docker compose -f compose/<service-name>.yml up -d

# 9. Vérifier Consul
curl http://localhost:8500/v1/health/service/<service-name>

# 10. Test gRPC
grpcurl -plaintext localhost:50061 list
```

---

## 10. Snippets prêts à coller

### .env.example

```env
# Server
NODE_ENV=development
GRPC_PORT=50061

# Database
DB_HOST=postgres-<context>
DB_PORT=5432
DB_NAME=<context>_db
DB_USER=postgres
DB_PASSWORD=postgres

# NATS
NATS_URL=nats://nats:4222

# Consul
CONSUL_HOST=consul
CONSUL_PORT=8500

# Logging
LOG_LEVEL=debug
```

### ormconfig.ts

```typescript
import { DataSource } from 'typeorm';
import { config } from 'dotenv';

config();

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || '<context>_db',
  entities: ['src/**/*.orm-entity.ts'],
  migrations: ['src/**/migrations/*.ts'],
  synchronize: false,
  logging: process.env.NODE_ENV !== 'production',
});
```

### tsconfig.json

```json
{
  "compilerOptions": {
    "module": "commonjs",
    "declaration": true,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "target": "ES2021",
    "sourceMap": true,
    "outDir": "./dist",
    "baseUrl": "./",
    "incremental": true,
    "skipLibCheck": true,
    "strictNullChecks": true,
    "noImplicitAny": true,
    "strictBindCallApply": true,
    "forceConsistentCasingInFileNames": true,
    "noFallthroughCasesInSwitch": true,
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

---

## Troubleshooting

### Service ne démarre pas

```bash
# Vérifier les logs
docker logs <service-name>

# Vérifier la DB
docker exec -it postgres-<context> psql -U postgres -d <context>_db -c "\dt"

# Vérifier NATS
docker logs nats
```

### Consul health check fail

```bash
# Vérifier que le service répond
grpcurl -plaintext <service-name>:50061 grpc.health.v1.Health/Check

# Vérifier les logs Consul
docker logs consul
```

### Proto non trouvé

```bash
# Regénérer
cd packages/proto && buf generate

# Vérifier le chemin
ls services/<service-name>/proto/generated/
```
