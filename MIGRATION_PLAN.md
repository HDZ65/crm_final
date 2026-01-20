# Plan de Migration vers Architecture Contract-Driven

## État Actuel

### ✅ Déjà En Place
- Protobuf files définis en `snake_case` (CORRECT selon convention officielle)
- `buf.gen.yaml` configuré avec `snakeToCamel=true` (camelCase TS généré)
- 17 services NestJS avec TypeORM
- Frontend Next.js
- Base de données PostgreSQL

### ❌ Violations de l'Architecture Stricte

| Violation | Sévérité | Emplacement |
|-----------|---------|------------|
| **74 entités TypeORM écrites manuellement** | CRITICAL | services/service-*/modules/**/entities/*.ts |
| **100+ DTOs dans _backup/** |** | CRITICAL | services/_backup/applications/dto/** |
| **Validation Zod manuelle dans frontend** | CRITICAL | frontend/src/components/**/*.tsx |
| **Aucune validation protovalidate** | CRITICAL | Pas de buf.build/validate-ts dans buf.gen.yaml |
| **Pas de validation aux frontières** | HIGH | Pas de ValidationPipe NestJS ni gestion d'erreurs frontend |
| **Aucun détection de breaking changes** | HIGH | Pas de `buf breaking` dans CI |

## Objectif de la Migration

**Règle d'or** : Zéro code manuel, tout est généré depuis proto.

## Phase 1 : Validation Automatique (Priorité HAUTE)

### 1.1 Installer `buf.build/validate-ts`

**Action** : Ajouter au `package.json`

```bash
npm install --save-dev buf.build/validate-ts@0.3.1
```

**Résultat attendu** :
- Génération de validateurs TypeScript depuis proto
- Intégration avec `buf.gen.yaml`

### 1.2 Configurer ValidationPipe NestJS

**Action** : Créer `backend/src/common/validation/validation.pipe.ts`

```typescript
import { ValidationPipe } from '@bufbuild/validate-ts/nestjs';
import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
} from '@nestjs/common';

@Injectable()
export class ValidationPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    // Validation stricte via protovalidate
    const result = ValidationPipe.validate(value, metadata);

    // Rejet immédiat si invalide (pas de try/catch silencieux)
    if (result.error) {
      throw new BadRequestException({
        message: result.error.message,
        errors: result.errors,
      });
    }

    return result.value;
  }
}
```

**Intégration dans `app.module.ts`** :

```typescript
import { ValidationPipe } from './common/validation/validation.pipe';

@Module({
  providers: [
    {
      provide: APP_PIPE,
      useExisting: true,
      useClass: ValidationPipe,
    },
  ],
})
export class AppModule {}
```

### 1.3 Utilisation dans les Controllers

```typescript
@Controller('clients')
export class ClientsController {
  @Post()
  async createClient(@Body(new ValidationPipe()) dto: CreateClientBaseRequest) {
    // dto est déjà validé par ValidationPipe
    return this.clientsService.create(dto);
  }
}
```

## Phase 2 : Zod pour Frontend (Priorité HAUTE)

### 2.1 Installer `protoc-gen-zod`

**Note** : Outil en développement, mais fonctionnel pour MVP

```bash
# Installation locale
git clone https://github.com/fubhy/protobuf-zod.git
cd protobuf-zod
npm install

# Lien symbolique dans proto/gen/zod
ln -s $(pwd)/node_modules/protobuf-zod/src $(pwd)/proto/gen/zod
```

**Configuration buf.gen.yaml** (déjà fait dans task précédente) :

```yaml
# Zod validation schemas generation from proto
- local: protoc-gen-zod
    out: proto/gen/zod
    opt:
      - target=ts
      - paths=source_relative
```

### 2.2 Supprimer les Zod manuels

**Commande** :

```bash
# Identifier tous les fichiers avec zod manuel
grep -r "z.object\|z.string\|z.number\|z.boolean" frontend/src --include="*.tsx" | grep -v "import.*from.*zod"

# Supprimer ou remplacer par import depuis proto/gen/zod
```

**Fichiers à nettoyer** (exemples) :
- `frontend/src/components/create-client-dialog.tsx` → utiliser `CreateClientBaseRequestSchema`
- `frontend/src/components/catalogue/create-product-dialog.tsx` → utiliser schemas produits
- Tous les autres avec zodResolver

### 2.3 Exemple d'Utilisation Correcte

```typescript
// ✅ CORRECT
import { CreateClientBaseRequestSchema } from '@proto/gen/zod/clients/client-base';

// ❌ INTERDIT
// const formSchema = z.object({
//   organisationId: z.string().min(1, "Requis"),
//   nom: z.string().min(1, "Requis"),
// });

export default function CreateClientDialog() {
  const mutation = useMutation({
    mutationFn: async (data: unknown) => {
      // Validation stricte via Zod généré
      const validated = CreateClientBaseRequestSchema.parse(data);

      // Envoi direct du type camelCase validé
      return api.createClient(validated);
    },
  });
}
```

## Phase 3 : Génération d'Entités TypeORM (Priorité HAUTE)

### 3.1 Solution Recommandée : Post-Processing avec `ts-proto`

**Approche** : Transformer les types TypeScript générés en entités TypeORM

**Pré-requis** :
```bash
npm install --save-dev typescript ts-proto
```

**Script de transformation** (à créer) :

```typescript
// scripts/transform-entities.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
} from 'typeorm';
import * as proto from '../proto/gen/ts/clients/client-base';

// Définir une map pour les options de colonne TypeORM
const typeOrmOptions = new Map<string, object>([
  // UUID → string, primary key
  ['id', 'organisationId', 'utilisateurId', 'roleId'],
]);

export function transformProtoToEntity(protoClass: any, entityName: string): string {
  let output = `import { ${proto.name} as ${protoClass} } from '@proto/gen/ts/clients/${protoClass}';\n\n`;
  output += `@Entity('${entityName}')\n`;

  // Parcourir toutes les propriétés de la classe proto
  for (const key in Object.keys(new protoClass())) {
    const tsType = typeof new protoClass()[key];

    // Mapper le type TypeScript vers les options TypeORM
    let columnOptions: string = '';
    const dbType = mapTypeToTypeORM(tsType);

    if (dbType === 'string') {
      columnOptions = `, type: 'varchar', length: 255`;
    } else if (dbType === 'number') {
      columnOptions = `, type: 'int'`;
    } else if (dbType === 'boolean') {
      columnOptions = `, type: 'boolean'`;
    } else if (tsType === 'Date') {
      columnOptions = `, type: 'timestamp'`;
    }

    // Gérer les colonnes spéciales (id, timestamps, foreign keys)
    if (key === 'id') {
      output += `  @PrimaryGeneratedColumn('uuid')\n  id: string;\n`;
    } else if (key === 'createdAt' || key === 'updatedAt') {
      output += `  @CreateDateColumn({ name: 'created_at' })\n`;
      output += `  ${key.charAt(0).toLowerCase() + key.slice(1)}: Date;\n`;
    } else if (typeOrmOptions.has(key)) {
      // Clé étrangère (foreignKey)
      columnOptions = `, type: 'uuid'`;
    } else if (key.endsWith('Id') && key !== 'id') {
      // Clé étrangère simple
      columnOptions = `, type: 'uuid'`;
    }

    // Snake_case automatique dans le nom de la colonne via @Column
    const snakeCaseKey = key.replace(/[A-Z]/g, match => `_${match[0].toLowerCase()}`);

    output += `  @Column({ name: '${snakeCaseKey}'${columnOptions} })\n`;
    output += `  ${snakeCaseKey}: ${dbType};\n`;
  }

  output += '}\n';

  return output;
}

function mapTypeToTypeORM(tsType: string): string {
  // Mapper les types TypeScript vers les types TypeORM
  const typeMap: Record<string, string> = {
    'string': 'varchar',
    'number': 'int',
    'boolean': 'boolean',
    'Date': 'timestamp',
    'Uint8Array': 'bytea',
  };

  return typeMap[tsType] || 'text';
}
```

**Utilisation** :

```bash
# Générer les entités pour un service
npx ts-proto --tsProtoOpt=emitImportedFiles=true --proto_path=proto protos/clients/*.proto

# Transformer en entités TypeORM
npx ts scripts/transform-entities.ts <proto/gen/ts/clients/client-base.ts > services/service-clients/src/modules/client-base/entities/client-base-generated.entity.ts
```

### 3.2 Migration Script

```bash
#!/bin/bash
set -e

echo "Migration: Entités manuelles → Entités générées depuis proto"
echo "⚠️  IMPORTANT: Sauvegarder la base de données avant de commencer"

# Créer un script de migration TypeORM
cat > services/migrate-to-proto-entities.sh << 'EOF'
#!/bin/bash

# Générer depuis proto
npm run proto:generate

# Créer les entités générées pour tous les services
for service in service-*; do
  if [ -f "$service/src" ]; then
    proto_module=$(basename $service | sed 's/^service-//')
    npx ts scripts/transform-entities.ts <proto/gen/ts/$proto_module/client-base.ts > "$service/src/modules/client-base/entities/client-base-generated.entity.ts"
    echo "Entité générée pour $service: client-base"
  fi
done

echo "✅ Génération terminée"
echo "⏭ ÉTAPE SUIVANTE: Migrer manuellement les contrôleurs et services pour utiliser les entités générées"
EOF

chmod +x services/migrate-to-proto-entities.sh
./services/migrate-to-proto-entities.sh
```

## Phase 4 : Naming Strategy TypeORM (Priorité MOYENNE)

### 4.1 Configuration Actuelle

**Actuellement** : Les entités manuelles ont des décorateurs `@Column` explicites :
```typescript
@Column({ name: 'organisation_id', type: 'uuid' })
organisationId: string;
```

**Problème** : Nom de colonne hardcodé → conversion pas automatique

### 4.2 Solution : Naming Strategy Globale

**Dans chaque `data-source.ts`** :

```typescript
import { DataSource } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm/naming-strategies/SnakeNamingStrategy';

export const AppDataSource = new DataSource({
  type: 'postgres',
  namingStrategy: new SnakeNamingStrategy(),  // ✅ Conversion automatique camelCase ↔ snake_case

  // Configuration commune
  extra: {
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  },
  entities: ['src/**/*.entity.ts'],  // Sera remplacé par generated entities
});
```

**Résultat** :
- TypeScript camelCase dans le code
- Colonnes snake_case dans la base
- Conversion 100% automatique via ORM
- Aucun mapping manuel requis

## Phase 5 : Breaking Change Detection (Priorité MOYENNE)

### 5.1 Ajouter au Makefile

```makefile
# Makefile
.PHONY: proto:breaking proto:breaking

proto:breaking:
	@echo "Checking for breaking changes against main branch..."
	buf breaking --against '.git#branch=main'
	@echo "Breaking change check complete"
```

### 5.2 Dans package.json (déjà configuré)

```json
{
  "scripts": {
    "proto:breaking": "buf breaking --against '.git#branch=main'"
  }
}
```

## Phase 6 : Nettoyage (Priorité MOYENNE)

### 6.1 Supprimer les DTOs manuels

```bash
# Supprimer le dossier _backup
rm -rf services/_backup/

# Supprimer les entités manuelles après migration
# (À faire après phase 3)
find services/*/src/modules/**/entities -name "*.entity.ts" ! -name "*-generated.entity.ts" -delete
```

### 6.2 Audit Automatique

```bash
# Script d'audit
cat > scripts/audit-architecture.sh << 'EOF'
#!/bin/bash

echo "=== AUDIT ARCHITECTURE CONTRACT-DRIVEN ==="

# Vérifier que tous les DTOs sont générés depuis proto
MANUAL_DTOS=$(grep -r "export.*dto\|export.*Dto" services/*/src --include="*.ts" | wc -l)
if [ "$MANUAL_DTOS" -gt 0 ]; then
  echo "❌ ERREUR: DTOs manuels détectés : $MANUAL_DTOS"
  exit 1
fi

# Vérifier les Zod manuels
MANUAL_ZOD=$(grep -r "z.object\|z.string\|z.number" frontend/src --include="*.tsx" | wc -l)
if [ "$MANUAL_ZOD" -gt 0 ]; then
  echo "❌ ERREUR: Schémas Zod manuels détectés"
  exit 1
fi

# Vérifier les mappers manuels
MANUAL_MAPPERS=$(grep -r "mapper\|adapter\|transformer" services/*/src --include="*.ts" | wc -l)
if [ "$MANUAL_MAPPERS" -gt 0 ]; then
  echo "❌ ERREUR: Mappers/adapters manuels détectés"
  exit 1
fi

echo "✅ Audit réussi : Pas de code manuel détecté"
EOF

chmod +x scripts/audit-architecture.sh
./scripts/audit-architecture.sh
```

## Ordre de Priorité

1. **HAUTE** - Validation aux frontières (protoc-gen-zod + ValidationPipe)
2. **HAUTE** - Migration entités manuelles → générées depuis proto
3. **MOYENNE** - Naming strategy TypeORM (si TypeORM reste)
4. **MOYENNE** - Breaking change detection CI
5. **BASSE** - Suppression DTOs/mappers manuels

## Checkpoints de Validation

- [ ] `buf.build/validate-ts` installé et configuré
- [ ] ValidationPipe créée et intégrée
- [ ] Tous les contrôleurs utilisent ValidationPipe
- [ ] Frontend utilise exclusivement des schemas `@proto/gen/zod`

## Checkpoints de Migration

- [ ] Script de transformation entités créé (`scripts/transform-entities.ts`)
- [ ] Entités générées créées pour tous les services
- [ ] Contrôleurs et services migrés vers entités générées
- [ ] Entités manuelles supprimées
- [ ] SnakeNamingStrategy configurée (si TypeORM)

## Risques et Atténuations

### Risque 1 : Temps de Migration Élevé

**Impact** : Transformer 17 services × ~5 entités chacun
**Estimation** : 3-5 jours de développement
**Mitigation** :
- Commencer par 1 service critique (ex: clients)
- Tester sur dev
- Déployer graduellement

### Atténuation : Génération Hybride Transitoire

**Pour la période de migration** :

1. **Phase A (1-2 semaines)** :
   - Nouvelles features : utiliser les entités générées
   - Existing features : maintenir entités manuelles (temporairement accepté)

2. **Phase B (2-4 semaines)** :
   - Migrer progressivement les services
   - Supprimer les entités manuelles après validation

3. **Phase C (post-migration)** :
   - Nettoyage complet
   - Audit final

### Risque 2 : Compatibilité Protovalidate

**Problème** : `protoc-gen-zod` est en développement (fubhy/protobuf-zod)

**Atténuation** :
- Documentation claire des limitations actuelles
- Considérer alternative (post-processing) en cas de blocage
- Revenir sur `protoc-gen-zod` quand stable

## Documentation à Créer

1. **GUIDE_DEVELOPPEUR.md**
   - Workflow de développement avec proto-first
   - Comment utiliser les types générés
   - Comment créer de nouvelles features
   - Procédure de validation
   - Procédure de tests

2. **MIGRATION_CHECKLIST.md**
   - Liste des services avec statut de migration
   - Incompatibilités connues
   - Tests de validation

3. **ERREURS_COMMUNES.md**
   - Erreurs fréquentes avec protovalidate
   - Solutions contournées
   - Quand remonter à l'upstream

## Suivi

**Métriques** :
- % d'entités migrées (cible : 100%)
- % de DTOs manuels supprimés
- % de services avec ValidationPipe
- Temps de migration par service

---

**Projet** : CRM Final - Multi-tenant White Label Partner Management System
**Date** : 19 janvier 2026
**Version** : 1.0.0 - Migration vers Architecture Contract-Driven
