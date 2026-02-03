# Pattern: Ajouter une Feature

## Scope

Ce pattern couvre l'ajout de :
- Nouvelle Command (mutation)
- Nouvelle Query (lecture)
- Nouvel Event (domain event + NATS)
- Nouveau champ sur un Aggregate
- Nouvel endpoint gRPC

---

## Workflow

```
1. Identifier l'élément à ajouter
2. Vérifier l'impact (proto, events, db)
3. Charger le template approprié
4. Générer les fichiers
5. Mettre à jour les registrations (module, proto, catalog)
6. Valider (build + tests)
```

---

## 1. Ajouter une Command

### Impact
- **Proto** : Ajout RPC + messages dans `<context>_commands.proto`
- **Application** : Command + Handler
- **Infrastructure** : Controller gRPC

### Steps

| # | Fichier | Action |
|---|---------|--------|
| 1 | `application/commands/<action>-<aggregate>.command.ts` | Créer |
| 2 | `application/commands/handlers/<action>-<aggregate>.handler.ts` | Créer |
| 3 | `packages/proto/<context>_commands.proto` | Ajouter RPC + messages |
| 4 | `buf generate` | Exécuter |
| 5 | `infrastructure/grpc/<context>.commands.grpc-controller.ts` | Ajouter méthode |
| 6 | `<context>.module.ts` | Enregistrer handler |
| 7 | `test/<action>-<aggregate>.spec.ts` | Créer test |

### Compatibilité
- **Proto** : Ajout = toujours safe

### Référence
→ [templates/command.md](../templates/command.md)

---

## 2. Ajouter une Query

### Impact
- **Proto** : Ajout RPC + messages dans `<context>_queries.proto`
- **Application** : Query + Handler + DTO
- **Infrastructure** : Controller gRPC + Mapper

### Steps

| # | Fichier | Action |
|---|---------|--------|
| 1 | `application/queries/<action>-<aggregate>.query.ts` | Créer |
| 2 | `application/queries/handlers/<action>-<aggregate>.handler.ts` | Créer |
| 3 | `application/dto/<aggregate>.dto.ts` | Créer ou modifier |
| 4 | `packages/proto/<context>_queries.proto` | Ajouter RPC + messages |
| 5 | `buf generate` | Exécuter |
| 6 | `infrastructure/grpc/<context>.queries.grpc-controller.ts` | Ajouter méthode |
| 7 | `infrastructure/grpc/<aggregate>.grpc-mapper.ts` | Ajouter/modifier |
| 8 | `<context>.module.ts` | Enregistrer handler |
| 9 | `test/<action>-<aggregate>.spec.ts` | Créer test |

### Compatibilité
- **Proto** : Ajout = toujours safe

### Référence
→ [templates/query.md](../templates/query.md)

---

## 3. Ajouter un Event

### Impact
- **Domain** : Domain Event
- **Application** : Event Handler CQRS
- **Infrastructure** : NATS Publisher (ou Listener si consumer)
- **Catalog** : event_catalog.yaml

### Steps (producer)

| # | Fichier | Action |
|---|---------|--------|
| 1 | `domain/events/<aggregate>-<action>.event.ts` | Créer |
| 2 | `domain/entities/<aggregate>.aggregate.ts` | Ajouter apply() |
| 3 | `application/events/<aggregate>-<action>.handler.ts` | Créer (publish NATS) |
| 4 | `<context>.module.ts` | Enregistrer handler |
| 5 | `docs/catalogs/event_catalog.yaml` | Ajouter event |
| 6 | Test | Créer test |

### Steps (consumer)

| # | Fichier | Action |
|---|---------|--------|
| 1 | `infrastructure/nats/<topic>.listener.ts` | Créer |
| 2 | `<context>.module.ts` | Enregistrer controller |
| 3 | `docs/catalogs/event_catalog.yaml` | Ajouter consumer |
| 4 | Test | Créer test |

### Compatibilité
- **Events** : Ajout nouveau topic = toujours safe
- **Events** : Ajout champ payload = safe (consumers tolerants)

### Référence
→ [templates/event.md](../templates/event.md)

---

## 4. Ajouter un champ sur un Aggregate

### Impact
- **Domain** : Aggregate (propriété + getter)
- **Application** : Command/Query (si exposé)
- **Infrastructure** : ORM Entity + Migration
- **Proto** : Si exposé via gRPC

### Steps

| # | Fichier | Action |
|---|---------|--------|
| 1 | `domain/entities/<aggregate>.aggregate.ts` | Ajouter propriété + getter |
| 2 | `infrastructure/persistence/entities/<aggregate>.orm-entity.ts` | Ajouter colonne |
| 3 | `infrastructure/persistence/migrations/<ts>-Add<Field>.ts` | Créer (nullable!) |
| 4 | Mappers | Mettre à jour toDomain/toEntity |
| 5 | `packages/proto/<context>_*.proto` | Ajouter champ optional |
| 6 | `buf generate` | Exécuter |
| 7 | Controller/DTO | Mettre à jour |
| 8 | Test | Créer/modifier test |

### Compatibilité
- **DB** : Colonne nullable = safe (Expand phase)
- **Proto** : Champ optional = safe

### Référence
→ [templates/migration.md](../templates/migration.md)

---

## 5. Ajouter un endpoint gRPC

### Impact
- **Proto** : Ajout RPC dans service existant
- **Application** : Command ou Query associée
- **Infrastructure** : Controller

### Steps

| # | Fichier | Action |
|---|---------|--------|
| 1 | `packages/proto/<context>_commands.proto` ou `_queries.proto` | Ajouter RPC |
| 2 | `buf generate` | Exécuter |
| 3 | Application | Créer Command/Query + Handler |
| 4 | `infrastructure/grpc/<context>.<type>.grpc-controller.ts` | Ajouter méthode |
| 5 | `<context>.module.ts` | Enregistrer handler |
| 6 | Test | Créer test |

### Compatibilité
- **Proto** : Ajout RPC = toujours safe

---

## Checklist globale

### Avant implémentation
- [ ] Service cible identifié
- [ ] Impact analysé (proto, events, db)
- [ ] Template chargé
- [ ] Pas de breaking change détecté

### Pendant implémentation
- [ ] Fichiers créés selon le template
- [ ] Conventions de nommage respectées
- [ ] Module mis à jour (registrations)
- [ ] Proto mis à jour + buf generate
- [ ] Test créé

### Après implémentation
- [ ] `npm run build` passe
- [ ] `npm run test` passe
- [ ] Catalog mis à jour (si events)
- [ ] Rollback documenté

---

## Exemples

### Exemple 1 : Ajouter CreateInvoice command

```
Impact: Proto (commands) + Application + Infrastructure
Template: command.md

Steps:
1. Créer application/commands/create-invoice.command.ts
2. Créer application/commands/handlers/create-invoice.handler.ts
3. Modifier packages/proto/billing_commands.proto (+ RPC + messages)
4. Exécuter buf generate
5. Modifier infrastructure/grpc/billing.commands.grpc-controller.ts
6. Modifier billing.module.ts (+ CreateInvoiceHandler)
7. Créer test/create-invoice.spec.ts

Compat: ✅ Ajout RPC = safe
```

### Exemple 2 : Ajouter champ priority aux invoices

```
Impact: Domain + DB + Proto (queries)
Template: migration.md

Steps:
1. Modifier domain/entities/invoice.aggregate.ts (+ priority + getter)
2. Modifier infrastructure/persistence/entities/invoice.orm-entity.ts
3. Créer migration AddPriorityToInvoices (nullable!)
4. Modifier mappers (toDomain, toEntity)
5. Modifier packages/proto/billing_queries.proto (+ optional priority)
6. Exécuter buf generate
7. Modifier DTO + controller
8. Créer test

Compat: ✅ Colonne nullable + champ optional = safe
```

### Exemple 3 : Ajouter event InvoicePaid

```
Impact: Domain + Application + NATS + Catalog
Template: event.md

Steps:
1. Créer domain/events/invoice-paid.event.ts
2. Modifier domain/entities/invoice.aggregate.ts (pay() → apply event)
3. Créer application/events/invoice-paid.handler.ts (→ publish NATS)
4. Modifier billing.module.ts
5. Modifier docs/catalogs/event_catalog.yaml
6. Créer test

Compat: ✅ Nouveau topic = safe
```
