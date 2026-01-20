# Architecture Strictement Contract-Driven - Guide d'Implémentation

## Vue d'Ensemble

**Protobuf est la seule source de vérité.**
- Tous les contrats de données (API, RPC, events, messages) sont définis exclusivement dans les fichiers `.proto`.
- Le code est généré automatiquement à partir des Protos.
- Toute incohérence provoque une erreur de compilation ou une erreur explicite au runtime.

## Conventions

### 1. Protobuf (schéma structurel)

**Règle** : `snake_case` dans les fichiers `.proto`
```protobuf
syntax = "proto3";

package clients;

message ClientBase {
  string id = 1;
  string organisation_id = 2;
  string nom = 3;
  string prenom = 4;
  string email = 5;
}
```

**Justification** : C'est la convention officielle Protobuf (`protobuf.dev/programming-guides/style/`). Le compilateur convertit automatiquement vers `camelCase` pour JSON/TypeScript.

### 2. Flux applicatifs (operationnels)

**Règle** : `camelCase` partout en dehors des `.proto`
- API exposée (JSON)
- Frontend (TypeScript)
- Services internes (messages)
- Events
- Base de données (via ORM)

**Conversion automatique** : `proto/gen/buf.gen.yaml` avec `snakeToCamel=true`
```yaml
plugins:
  - plugin: ts-proto
    opt:
      - snakeToCamel=true
```

Résultat : Les champs `snake_case` du proto deviennent `camelCase` dans le TypeScript généré.

### 3. Base de données

**Règle** : `snake_case` dans la base de données
```sql
CREATE TABLE clients (
  id UUID PRIMARY KEY,
  organisation_id UUID NOT NULL,
  nom VARCHAR(100) NOT NULL,
  email VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Conversion automatique** : Configuration ORM avec naming strategy

TypeORM avec `namingStrategy` global :
```typescript
// data-source.ts
export const AppDataSource = new DataSource({
  type: 'postgres',
  namingStrategy: new SnakeNamingStrategy(),  // camelCase ↔ snake_case automatique
  entities: ['src/**/*.entity.ts'],
});
```

Prisma (alternative) :
```prisma
generator client {
  provider = "postgresql"
  // snake_case par défaut dans Prisma
}

datasource db {
  url = env("DATABASE_URL")
}
```

## Stack Technique

### Backend
- **Framework** : NestJS (17 microservices)
- **ORM** : TypeORM
- **API** : gRPC via Protobuf
- **Génération de code** : buf + ts-proto
- **Validation** : protovalidate (généré depuis proto)

### Frontend
- **Framework** : Next.js 16
- **UI** : Radix UI
- **Validation** : Zod (généré depuis proto)
- **Génération de code** : buf + ts-proto
- **État global** : Zustand

### Base de données
- **Moteur** : PostgreSQL
- **Architecture** : 1 base par service (17 bases)
- **Connection Pooling** : configuré

## Workflow de Génération de Code

### Commandes de génération
```bash
# Dans le root du projet
npm run proto:all
```

Équivalent à :
```bash
cd proto
buf format -w
buf lint
buf generate --template buf.gen.yaml
```

### Plugins configurés

#### 1. ts-proto (TypeScript frontend)
```yaml
# buf.gen.yaml
- plugin: ts-proto
    out: proto/gen/ts-frontend
    opt:
      - snakeToCamel=true        # Auto camelCase
      - addGrpcMetadata=true   # Metadata gRPC
      - outputServices=grpc-js  # Clients gRPC-Web
```

#### 2. ts-proto (TypeScript backend - types uniquement)
```yaml
# buf.gen.yaml
- plugin: ts-proto
    out: proto/gen/ts
    opt:
      - snakeToCamel=true
      - outputServices=false  # Pas de services NestJS générés
      - esModuleInterop=true
      - useOptionals=messages
```

#### 3. buf.build/validate-ts (Validation protovalidate)
```yaml
# buf.gen.yaml
- plugin: buf.build/validate-ts
    out: proto/gen/validators
    opt:
      - paths=source_relative
```

**Validation générée** : Zod schemas directement depuis proto
```typescript
// proto/gen/validators/clients/client-base.validator.ts
import { z } from 'zod';
import { ClientBase } from './clients/client-base';

export const ClientBaseSchema: z.ZodType<ClientBase> = ClientBase;
```

### Frontend consommation

```typescript
// frontend/src/api/clients/index.ts
import { createClientBasePromiseClient } from '@proto/gen/ts-frontend/clients/service-client-base';

// PAS de DTO manuel - direct usage du code généré
const result = await createClientBasePromiseClient(
  { organisationId: 'org-123', nom: 'Doe', prenom: 'John' }
);
```

## Validation aux Frontières

### Backend (NestJS)

**Validation automatique via protovalidate** :
```typescript
// backend/src/main.ts
app.useGlobalPipes(
  new ValidationPipe()
);

// ValidationPipe utilise les validateurs protovalidate
import { validate } from 'proto/gen/validators/...';
```

**Rejet immédiat** :
```typescript
@Catch()
handleValidationError(error: any) {
  // Toute erreur de validation → 400 Bad Request
  // Pas de fallback, pas de transformation silencieuse
  throw new BadRequestException(error);
}
```

### Frontend (Next.js)

**Validation automatique via Zod généré** :
```typescript
// frontend/src/app/api/clients/create-client.tsx
import { ClientBaseSchema } from '@proto/gen/zod/clients/client-base';
import { useMutation } from '@tanstack/react-query';

export default function CreateClientDialog() {
  const mutation = useMutation({
    mutationFn: async (data) => {
      // Validation Zod automatique
      const validated = ClientBaseSchema.parse(data);

      // Envoi direct du code validé
      return fetch('/api/clients', {
        method: 'POST',
        body: validated,  // camelCase
      });
    },
  });
}
```

**Rejet immédiat** :
```typescript
if (error instanceof z.ZodError) {
  // Afficher les erreurs Zod, PAS transformer silencieusement
  return <ErrorMessage errors={error.errors} />;
}
```

## Interdictions Absolues

❌ Aucun DTO écrit à la main
❌ Aucun mapper / adapter / transformer manuel
❌ Aucun mapping camelCase ↔ snake_case manuel
❌ Aucun schéma parallèle (OpenAPI, Zod manuel, class-validator)
❌ Aucun any, unknown, interface{}, object non typé
❌ Aucune conversion implicite
❌ Aucune erreur silencieuse
❌ Aucun fallback caché
❌ Aucun "temporaire" non documenté
❌ Aucun "band-aid" technique

## Versioning et Compatibilité

### Détection des breaking changes

```bash
# Dans CI/CD
npm run proto:breaking

# Equivalent
buf breaking --against '.git#branch=main'
```

### Stratégie de versioning

1. **Compatibilité backward par défaut**
   - Ne jamais supprimer de champs sans dépréciation préalable
   - Nouveaux champs avec `optional`
   - Utiliser `reserved` pour ajouts futurs

2. **Versioning explicite**
   - Version dans `package` : `package v1.2.3`
   - Tags git pour releases : `v1.2.3`

3. **Dépréciation**
```protobuf
// Ajout de nouveau champ sans casser l'existant
message ClientBaseV2 {
  string id = 1;
  string nom = 2;

  // Champ déprécié
  string old_field = 3 [deprecated = true];
}
```

### Checks automatiques

```yaml
# buf.yaml
lint:
  use:
    - STANDARD
  except:
    - PACKAGE_VERSION_SUFFIX  # Exception autorisée

breaking:
  use:
    - FILE          # Vérifie la compatibilité fichier par fichier
```

## Génération d'Entités TypeORM

**Approche recommandée** : Post-processing avec ts-proto

Actuellement : Les entités sont écrites manuellement (violation)

Solution future (à implémenter) :
```bash
# 1. Générer les types TypeScript depuis proto
npm run proto:generate

# 2. Créer un script de transformation
# scripts/transform-entities.js
```

Transformer (exemple simplifié) :
```typescript
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { ClientBase as ClientBaseProto } from '../proto/gen/ts/clients/client-base';

@Entity('clientbases')
export class ClientBaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organisation_id', type: 'uuid' })
  organisationId: string;

  @Column({ length: 100 })
  nom: string;

  // Plus de mapping manuel - décorateur @Column standard
  // La conversion camelCase ↔ snake_case est gérée par TypeORM
}
```

**Alternative**: Passer à Prisma qui supporte mieux la génération d'entités (mais migration requise)

## Mise en Œuvre - Phasage

### Phase 1 : Configuration Buf (Fait)
- ✅ `buf.gen.yaml` configuré
- ✅ Plugins ts-proto, protovalidate
- ✅ `snakeToCamel=true` activé

### Phase 2 : Validation aux Frontières
- ⏳ Installer `buf.build/validate-ts`
- ⏳ Configurer ValidationPipe NestJS avec protovalidate
- ⏳ Configurer Zod schemas générées dans frontend
- ⏳ Supprimer les Zod manuels

### Phase 3 : Génération d'Entités
- ⏳ Rechercher/implémenter solution génération TypeORM depuis proto
- ⏳ Migrer les entités manuelles vers des entités générées
- ⏳ Configurer naming strategy TypeORM (si reste TypeORM)

### Phase 4 : Migration Base de Données
- ⏳ Créer scripts de migration depuis proto
- ⏳ Configurer TypeORM migrations

### Phase 5 : CI/CD
- ⏳ Configurer breaking change detection
- ⏳ Ajouter steps de validation dans CI

## Outils Recommandés

### Buf CLI
- https://buf.build/docs/
- `buf generate` : Génération de code
- `buf lint` : Vérification style
- `buf breaking` : Détection breaking changes
- `buf format -w` : Formatage automatique

### Plugins Buf
- `ts-proto` : Génération TypeScript
- `buf.build/validate-ts` : Validation protovalidate
- `protoc-gen-zod` : Génération Zod (fubhy/protobuf-zod)

### Monitoring
- Logs de génération : `docker-compose logs proto-generator`
- Validation échouée : Log et rejet explicite (400/422)

## Erreurs à Éviter

### Erreur 1 : DTOs manuels parallèles aux Protos
❌ `create-client.dto.ts` avec class-validator
   → **Correcte** : Utiliser le type généré depuis proto

### Erreur 2 : Mapping camelCase ↔ snake_case manuel
❌ Fonction `toSnakeCase()` / `toCamelCase()` manuelle
   → **Correcte** : Configurer naming strategy ORM

### Erreur 3 : Validation silencieuse
❌ `try { JSON.parse(input) } catch { return {} }`
   → **Correcte** : Validation stricte avec erreur explicite

### Erreur 4 : Utilisation de `any`
❌ `const data: any = req.body`
   → **Correcte** : Toujours utiliser les types générés depuis proto

## Checklist de Conformité

- [ ] Tous les contrats sont dans les `.proto`
- [ ] Aucun DTO manuel (service, frontend)
- [ ] Aucun mapper/adaptor/transformer manuel
- [ ] Validation protovalidate/Zod généré depuis proto
- [ ] Conversion camelCase ↔ snake_case automatique via ORM
- [ ] Breaking change detection dans CI
- [ ] Aucun `any` / `unknown` / `interface{}`
- [ ] Toute erreur explicite (pas silencieuse)

## Architecture Finale

```
┌─────────────────────────────────────────────────────────┐
│                     PROTOBUF (source unique)            │
│  ┌─────────────────────────────────────────────────────┐│
│  │ buf generate                                   ││
│  │  → ts-proto (TS backend)                  ││
│  │  → ts-proto (TS frontend)                 ││
│  │  → buf.build/validate-ts (Zod)            ││
│  └─────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘

                        ↓ ↓ ↓ ↓
        ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
        │  Backend    │ │  Frontend   │ │  Services    │
        │  (NestJS)  │ │  (Next.js)   │ │  (Workers)    │
        └─────────────┘ └─────────────┘ └─────────────┘
             ↓ ↓ ↓ ↓ ↓
        ┌───────────────────────────────────────────────┐
        │        Base de Données (PostgreSQL)         │
        │  snake_case via naming strategy ORM        │
        └───────────────────────────────────────────────┘
```

## Points de Vigilance

1. **Jamais éditer manuellement le code généré**
   - Les fichiers dans `proto/gen/` sont régénérés automatiquement
   - Toute modification manuelle sera écrasée

2. **Jamais écrire de DTOs côté backend**
   - Les contrôleurs NestJS doivent utiliser les types `proto/gen/ts`
   - Pas de `@Body()` avec DTO manuel

3. **Frontend : consommer uniquement `@proto/gen/zod`**
   - Supprimer tous les fichiers avec zod manuel
   - Remplacer par `ClientBaseSchema` importé depuis proto

4. **TypeORM : configuration naming strategy**
   ```typescript
   namingStrategy: new SnakeNamingStrategy()
   ```
   - C'est ce qui gère la conversion camelCase ↔ snake_case automatiquement

5. **Validation aux frontières**
   - Backend : ValidationPipe avec protovalidate
   - Frontend : Zod schemas générés
   - Rejet immédiat sur erreur (pas de try/catch silencieux)

6. **Breaking changes**
   - Toujours vérifier avec `buf breaking --against .git#branch=main`
   - Bloquer les changements breaking sur `main`

7. **Documentation**
   - Ajouter ce document dans le repo
   - Expliquer le workflow de génération de code

---

**Projet** : CRM Final - Multi-tenant White Label Partner Management System
**Date** : 19 janvier 2026
**Version** : 1.0.0 - Architecture Contract-Driven
