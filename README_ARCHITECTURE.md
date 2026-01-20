# Architecture Contract-Driven - CRM Final

## Résumé

Architecture strictement contract-driven avec Protobuf comme source unique de vérité.

**Stack Technique**
- Backend : NestJS (17 microservices)
- Frontend : Next.js 16
- Base de données : PostgreSQL (17 bases, 1 par service)
- Génération de code : Buf + ts-proto

## Conventions Clés

### Protobuf
- Fichiers `.proto` : `snake_case` (convention officielle)
- Génération TypeScript : `camelCase` (via `snakeToCamel=true`)

### Flux Applicatifs
- JSON API : `camelCase` (automatique depuis proto)
- Frontend : `camelCase`
- Events : `camelCase`

### Base de Données
- Colonnes : `snake_case` (via `SnakeNamingStrategy` TypeORM)

## Fichiers Clés

```
proto/                          # Définitions Protobuf (snake_case)
proto/gen/ts/                 # TypeScript backend (camelCase, sans services)
proto/gen/ts-frontend/        # TypeScript frontend (camelCase, avec gRPC-Web)
proto/gen/validators/           # Validateurs protovalidate (TypeScript)
proto/gen/zod/                  # Schemas Zod (TypeScript)
```

## Commandes Utiles

```bash
# Génération de code (lint + format + generate)
npm run proto:all

# Génération unique
npm run proto:generate

# Lint Protobuf
npm run proto:lint

# Breaking change detection
npm run proto:breaking
```

## Documentation

1. **ARCHITECTURE_CONTRACT_DRIVEN.md** - Guide complet d'implémentation
2. **PROTO_NAMING_CONVENTION.md** - Règles de nommage absolues
3. **PROTO_EXEMPLE_IMPLEMENTATION.md** - Exemple d'implémentation frontend correcte
4. **MIGRATION_PLAN.md** - Plan de migration des entités manuelles

## Prochaines Étapes

1. Installer `buf.build/validate-ts` (déjà ajouté au package.json)
2. Créer ValidationPipe NestJS (prototype dans `PROTO_EXEMPLE_IMPLEMENTATION.md`)
3. Supprimer les DTOs Zod manuels du frontend
4. Configurer SnakeNamingStrategy dans les services TypeORM
5. Exécuter le script de migration des entités
6. Configurer breaking change detection dans CI

## Points d'Attention

- ✅ Les Protos sont déjà en `snake_case` (CORRECT)
- ✅ `buf.gen.yaml` configuré avec `snakeToCamel=true`
- ✅ Frontend utilise déjà `ts-proto` (camelCase automatique)
- ⚠️  17 entités TypeORM écrites manuellement (violation)
- ⚠️ 100+ DTOs Zod manuels dans frontend (violation)
- ⚠️ Validation aux frontières non configurée

---

**Projet** : CRM Final - Multi-tenant White Label Partner Management System
**Date** : 19 janvier 2026
**Version Architecture** : 1.0.0 - Architecture Strictement Contract-Driven
