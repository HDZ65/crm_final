# Convention de Nommage Protobuf - Règles Absolues

## Principe Fondamental

**Les fichiers `.proto` sont la seule source de vérité structurelle.**
Le code généré (TypeScript, Go, Java, etc.) est la vérité opérationnelle.

## Conventions

### 1. Fichiers `.proto` - Snake_case obligatoire

**Règle** : Tous les champs doivent être en `lower_snake_case`

```protobuf
syntax = "proto3";

package clients;

// CORRECT
message ClientBase {
  string id = 1;
  string organisation_id = 2;
  string nom = 3;
  string email = 4;
  string created_at = 5;
  string updated_at = 6;
}

// INTERDIT
message ClientBase {
  string Id = 1;           // ❌ Majuscule
  string organisationId = 2;   // ❌ camelCase
  string clientName = 3;     // ❌ Nommage non-protobuf
}
```

**Justification** : C'est la convention officielle Protobuf (`protobuf.dev/programming-guides/style/`)

### 2. Types générés - CamelCase obligatoire

Le compilateur Protobuf convertit automatiquement `snake_case` → `lowerCamelCase`

```typescript
// Généré depuis proto avec snakeToCamel=true
export interface ClientBase {
  id: string;                    // camelCase ✅
  organisationId: string;         // camelCase ✅
  nom: string;                   // camelCase ✅
  email: string;                  // camelCase ✅
  createdAt: string;               // camelCase ✅
  updatedAt: string;               // camelCase ✅
}
```

**Configuration** : `buf.gen.yaml`
```yaml
plugins:
  - plugin: ts-proto
    opt:
      - snakeToCamel=true  # Force camelCase dans le TS généré
```

### 3. JSON API - CamelCase obligatoire

La conversion Proto → JSON est automatique :

```protobuf
// Proto : snake_case
message User {
  string user_id = 1;
  string first_name = 2;
}
```

```json
{
  "userId": "xxx",      // camelCase ✅
  "firstName": "xxx"     // camelCase ✅
}
```

### 4. Base de données - Snake_case obligatoire

```sql
CREATE TABLE client_bases (
  id UUID PRIMARY KEY,
  organisation_id UUID NOT NULL,
  nom VARCHAR(100) NOT NULL,
  email VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Conversion automatique** : Configuration ORM avec naming strategy

### 5. Frontend - CamelCase obligatoire

Tous les échanges de données sont en camelCase :

- State (Zustand)
- UI Components (props)
- API calls
- Form data
- Events

## Interdictions Absolues

### Dans les fichiers `.proto` ❌

❌ **Jamais** `camelCase` ou `PascalCase` dans les champs
❌ **Jamais** de naming non-protobuf (ex: `userName`, `clientName`)
❌ **Jamais** d'options `json_name` sauf exception documentée

### Dans le code généré ❌

❌ **Jamais** éditer manuellement les fichiers dans `proto/gen/`
   Ces fichiers sont régénérés automatiquement
   Toute modification sera écrasée

### Dans le code backend ❌

❌ **Jamais** écrire manuellement des DTOs
   Utiliser uniquement les types depuis `proto/gen/ts/`
   Les contrôleurs NestJS doivent consommer ces types directement

❌ **Jamais** de mappers/adapters/transformers manuels
   La conversion camelCase ↔ snake_case doit être automatique via ORM

### Dans le code frontend ❌

❌ **Jamais** définir manuellement des schémas Zod
   Utiliser uniquement `proto/gen/zod/` importés depuis proto

❌ **Jamais** de conversion manuelle camelCase ↔ snake_case
   Frontend consomme du camelCase API, stockage snake_case géré par backend

## Exception Documentées

L'utilisation de `json_name` est interdite sauf exception **EXPLICITEMENT DOCUMENTÉE ET VALIDÉE**.

Exemple d'exception documentée :
```protobuf
// Migration API existante (temporaire et justifiée)
message LegacyUser {
  string id = 1;
  string user_name = 2 [json_name = "username"]; // Ancien champ pour rétro-compatibilité

  string new_field = 3;  // Nouveau champ camelCase
}

// JSON généré :
{
  "username": "xxx",  // mapping vers l'ancien champ
  "newField": "xxx"  // nouveau champ
}
```

Cette exception doit être :
1. Documentée dans ce fichier
2. Avec ticket/issue GitHub justifiant la nécessité
3. Avec date de suppression prévue
4. Limitée dans le temps (max 6 mois)

## Workflow de Validation

### 1. Définition Proto

```protobuf
syntax = "proto3";

package users;

import "proto/validate.proto";

message User {
  string id = 1;
  string email = 2 [(validate.rules).string.email = true];
  string nom = 3 [(validate.rules).string.minLength = 1];
}
```

### 2. Génération

```bash
buf generate
```

Résultat :
1. TypeScript (camelCase)
2. Zod schemas (avec règles de validation)
3. Validators protovalidate

### 3. Utilisation Backend

```typescript
import { validate } from 'proto/gen/validators/users/user';

@Controller('users')
export class UsersController {
  @Post()
  async createUser(@Body() dto: CreateUserRequest) {
    // Validation automatique protovalidate
    const validated = validate(CreateUserRequest, dto);

    // Utilisation directe du type
    return this.usersService.create(validated);
  }
}
```

### 4. Utilisation Frontend

```typescript
import { CreateUserRequestSchema } from '@proto/gen/zod/users/user';

export default function CreateUserForm() {
  const { register } = useForm({
    resolver: zodResolver(CreateUserRequestSchema),
  });

  const handleSubmit = async (data) => {
    // Validation Zod automatique
    const validated = CreateUserRequestSchema.parse(data);

    // Envoi camelCase direct
    await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validated),  // camelCase
    });
  };
}
```

## Résumé

| Contexte | Convention | Outil de conversion |
|-----------|-----------|--------------------|
| Fichiers `.proto` | `snake_case` | N/A |
| TypeScript généré | `camelCase` | `buf.gen.yaml` (snakeToCamel=true) |
| JSON API | `camelCase` | Automatique (protoc) |
| Base de données | `snake_case` | ORM naming strategy |
| Frontend | `camelCase` | Consomme JSON camelCase |

## Références

- [Style Guide Protobuf Officiel](https://protobuf.dev/programming-guides/style/)
- [ProtoJSON Format](https://protobuf.dev/programming-guides/json/)
- [buf.build/validate-ts](https://buf.build/docs/buf-build/validate-ts)
- [protoc-gen-zod](https://github.com/fubhy/protobuf-zod)

---

**Projet** : CRM Final - Multi-tenant White Label Partner Management System
**Date** : 19 janvier 2026
**Version** : 1.0.0 - Convention Nommage Protobuf
