# Issues — Catalogue Partenaires CDC

## Known Issues

(None yet — will be populated as tasks are executed)

## Gotchas

### TypeORM Migrations
- Toujours utiliser snake_case pour les noms de colonnes (naming strategy configurée)
- Les migrations doivent être idempotentes (IF NOT EXISTS)
- Tester la migration up ET down

### gRPC Proto
- Après modification proto, toujours run `bun run proto:generate`
- Les types générés sont dans packages/proto/dist/
- Frontend importe depuis @crm/proto

### NATS Events
- Les subjects suivent le pattern: `domain.action` (ex: product.created)
- Toujours définir le proto event dans packages/proto/src/events/
- Les handlers sont dans infrastructure/messaging/nats/handlers/

### Frontend Server Actions
- Les server actions sont dans frontend/src/actions/
- Elles appellent les clients gRPC depuis frontend/src/lib/grpc/clients/
- Toujours gérer les erreurs gRPC (try/catch)
