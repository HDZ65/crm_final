# Compatibilité DB (PostgreSQL/TypeORM)

## Règle d'or
**Toute migration doit être réversible sans perte de données.**
Pattern recommandé : **Expand/Contract**.

---

## Pattern Expand/Contract

### Principe
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   EXPAND    │ →  │   SWITCH    │ →  │  CONTRACT   │
│ (safe add)  │    │ (use new)   │    │ (cleanup)   │
└─────────────┘    └─────────────┘    └─────────────┘
     PR #1              Code               PR #2
                      changes            (plus tard)
```

### Phases

**Phase 1: Expand (PR #1)**
- Ajouter colonne nullable / nouvelle table / index
- Migration réversible
- Code continue d'utiliser l'ancien schéma

**Phase 2: Switch (dans le code)**
- Code commence à écrire dans le nouveau champ
- Code lit nouveau OU ancien (dual read)
- Backfill si nécessaire

**Phase 3: Contract (PR #2, plus tard)**
- Rendre colonne non-nullable (si besoin)
- Supprimer ancien champ/table
- Nettoyer le code

---

## Patterns SAFE (autorisés)

### 1. Ajouter colonne nullable
```typescript
// Migration
export class AddAmountToInvoices implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn('invoices', new TableColumn({
      name: 'amount_cents',
      type: 'bigint',
      isNullable: true,  // ✅ NULLABLE
      default: null,
    }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('invoices', 'amount_cents');
  }
}
```

### 2. Ajouter nouvelle table
```typescript
export class CreateInvoiceItems implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(new Table({
      name: 'invoice_items',
      columns: [
        { name: 'id', type: 'uuid', isPrimary: true },
        { name: 'invoice_id', type: 'uuid' },
        { name: 'description', type: 'varchar' },
        { name: 'amount_cents', type: 'bigint' },
        { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
      ],
    }), true);

    // Foreign key
    await queryRunner.createForeignKey('invoice_items', new TableForeignKey({
      columnNames: ['invoice_id'],
      referencedTableName: 'invoices',
      referencedColumnNames: ['id'],
      onDelete: 'CASCADE',
    }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('invoice_items');
  }
}
```

### 3. Ajouter index (CONCURRENTLY si possible)
```typescript
export class AddIndexOnInvoiceStatus implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // ✅ CONCURRENTLY évite le lock en prod (PostgreSQL)
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invoices_status
      ON invoices(status)
      WHERE deleted_at IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX CONCURRENTLY IF EXISTS idx_invoices_status');
  }
}
```
**Note:** `CONCURRENTLY` nécessite d'être hors transaction TypeORM.

### 4. Backfill en migration séparée
```typescript
// Migration 1: Add column
export class AddAmountToInvoices implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn('invoices', new TableColumn({
      name: 'amount_cents',
      type: 'bigint',
      isNullable: true,
    }));
  }
  // ...
}

// Migration 2: Backfill (séparée)
export class BackfillInvoiceAmounts implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Backfill par batches pour éviter les locks
    await queryRunner.query(`
      UPDATE invoices
      SET amount_cents = COALESCE(legacy_amount * 100, 0)
      WHERE amount_cents IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Backfill est idempotent, pas besoin de revert
  }
}
```

### 5. Soft delete (pattern Winaity)
```typescript
// Entity avec soft delete
@Entity('invoices')
export class InvoiceOrmEntity {
  @PrimaryColumn('uuid') id: string;
  @Column() name: string;
  @Column({ name: 'deleted_at', nullable: true }) deleted_at: Date | null;

  // ...
}

// Repository avec filtre soft delete
async findAll(): Promise<Invoice[]> {
  const entities = await this.repo.find({
    where: { deleted_at: IsNull() },  // ✅ Exclure les supprimés
  });
  return entities.map(e => this.toDomain(e));
}
```

---

## Patterns INTERDITS (breaking changes)

### ❌ Supprimer colonne directement
```typescript
// INTERDIT - Perte de données possible
export class RemoveOldField implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('invoices', 'legacy_field');  // ❌
  }
}
```
**Alternative:** Marquer comme deprecated, supprimer dans une PR future après vérification.

### ❌ Renommer colonne directement
```typescript
// INTERDIT - L'ancien code crash
export class RenameColumn implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.renameColumn('invoices', 'old_name', 'new_name');  // ❌
  }
}
```
**Alternative:** Ajouter nouvelle colonne + dual write + supprimer ancienne plus tard.

### ❌ Changer type sans migration
```typescript
// INTERDIT - Perte de données possible
ALTER TABLE invoices ALTER COLUMN amount TYPE varchar;  // ❌ était bigint
```

### ❌ Ajouter NOT NULL sans default/backfill
```typescript
// INTERDIT - Échoue sur données existantes
await queryRunner.addColumn('invoices', new TableColumn({
  name: 'required_field',
  type: 'varchar',
  isNullable: false,  // ❌ sans default !
}));
```
**Alternative:** Nullable d'abord, backfill, puis NOT NULL.

### ❌ DROP TABLE sans vérification
```typescript
// INTERDIT - Perte de données définitive
await queryRunner.dropTable('important_data');  // ❌
```

---

## Migration réversible (down obligatoire)

### Pattern standard
```typescript
export class AddColumnExample implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn('invoices', new TableColumn({
      name: 'new_field',
      type: 'varchar',
      isNullable: true,
    }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // ✅ down() OBLIGATOIRE et testé
    await queryRunner.dropColumn('invoices', 'new_field');
  }
}
```

### Test du down()
```bash
# Appliquer la migration
npm run migration:run

# Vérifier que ça fonctionne
npm run test

# Revert
npm run migration:revert

# Vérifier que le revert fonctionne
npm run test
```

---

## Stratégies de rollback

### Rollback simple (colonne nullable)
```bash
# 1. Revert migration
npm run migration:revert

# 2. Redéployer ancien code
git revert <commit>
docker compose restart <service>
```
**Risque:** Aucune perte de données (colonne nullable).

### Rollback avec backfill
```bash
# 1. Revert backfill migration (pas de down effectif)
npm run migration:revert

# 2. Revert add column migration
npm run migration:revert

# 3. Redéployer
```
**Risque:** Données backfillées perdues (généralement recalculables).

### Rollback impossible (données critiques)
```markdown
## Rollback Plan

### Dépend de migration ? OUI
- down() testé : ✅
- Data-loss risk : ⚠️ OUI (nouvelles données dans new_field)

### Alternative : Fix Forward
- Ne pas revert la migration
- Corriger le bug dans le code
- Déployer le fix
```

---

## Vérifications avant PR

### Checklist DB
```bash
# 1. Vérifier que down() existe
grep -A 20 "public async down" src/**/migrations/*.ts | grep "dropColumn\|dropTable\|query"

# 2. Tester le revert en local
npm run migration:run
npm run test
npm run migration:revert
npm run test

# 3. Vérifier nullable pour nouvelles colonnes
grep "isNullable" src/**/migrations/*.ts

# 4. Vérifier pas de DROP TABLE
grep -i "dropTable" src/**/migrations/*.ts
```

### Data-loss check (manuel)
1. "La migration supprime-t-elle des données ?"
2. "Le revert perd-il des données critiques ?"
3. "Peut-on recalculer/backfill si nécessaire ?"

---

## Exemple complet : Ajouter amount avec Expand/Contract

### PR #1 : Expand (add column nullable)
```typescript
// src/<context>/infrastructure/persistence/migrations/006-AddAmountToInvoices.ts
export class AddAmountToInvoices1234567890 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn('invoices', new TableColumn({
      name: 'amount_cents',
      type: 'bigint',
      isNullable: true,  // ✅ Nullable pour expand
    }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('invoices', 'amount_cents');
  }
}
```

### Code : Dual write
```typescript
// Dans le handler
async execute(command: CreateInvoiceCommand): Promise<Invoice> {
  const invoice = Invoice.create(
    command.userId,
    command.name,
    command.amount,  // Nouveau champ
  );

  // L'ORM entity écrit les deux
  const entity = InvoiceOrmEntity.fromDomain(invoice);
  // entity.amount_cents = invoice.amount (nouveau)
  // entity.legacy_amount = invoice.amount / 100 (ancien, si existe)

  await this.repo.save(entity);
  return invoice;
}
```

### Code : Dual read
```typescript
// Dans le mapper
static toDomain(entity: InvoiceOrmEntity): Invoice {
  // Dual read : nouveau OU ancien
  const amount = entity.amount_cents ?? (entity.legacy_amount * 100) ?? 0;

  return Invoice.reconstitute({
    id: entity.id,
    name: entity.name,
    amount,
    // ...
  });
}
```

### PR #2 : Contract (plus tard, après validation)
```typescript
// Optionnel : rendre NOT NULL après backfill complet
export class MakeAmountNotNull implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Vérifier d'abord qu'il n'y a plus de NULL
    await queryRunner.query(`
      UPDATE invoices SET amount_cents = 0 WHERE amount_cents IS NULL
    `);

    await queryRunner.changeColumn('invoices', 'amount_cents', new TableColumn({
      name: 'amount_cents',
      type: 'bigint',
      isNullable: false,
      default: 0,
    }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.changeColumn('invoices', 'amount_cents', new TableColumn({
      name: 'amount_cents',
      type: 'bigint',
      isNullable: true,
    }));
  }
}
```

---

## Conventions Winaity

### Nommage colonnes
- `snake_case` pour les colonnes : `user_id`, `created_at`
- Suffixe `_at` pour les timestamps : `created_at`, `updated_at`, `deleted_at`
- Suffixe `_id` pour les foreign keys : `user_id`, `invoice_id`

### Colonnes standard
```sql
id UUID PRIMARY KEY,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
deleted_at TIMESTAMP NULL,  -- Soft delete
version INTEGER DEFAULT 0   -- Optimistic locking
```

### Index partiels (soft delete)
```sql
CREATE INDEX idx_invoices_user_id ON invoices(user_id) WHERE deleted_at IS NULL;
```
