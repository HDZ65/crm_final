# Template: Migration

## Patterns

| Pattern | Usage |
|---------|-------|
| Add Column | Nouvelle colonne (toujours nullable d'abord) |
| Add Table | Nouvelle table |
| Add Index | Nouvel index (CONCURRENTLY si possible) |
| Backfill | Remplir les données existantes |
| Rename (Expand/Contract) | Renommer via nouvelle colonne |
| Drop (Contract) | Supprimer après migration complète |

---

## 1. Add Column (nullable)

```typescript
// infrastructure/persistence/migrations/<timestamp>-Add<Column>To<Table>.ts

import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class Add<Column>To<Table><Timestamp> implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn('<table>', new TableColumn({
      name: '<column_name>',
      type: '<type>',           // varchar, bigint, boolean, timestamp, uuid, etc.
      isNullable: true,         // TOUJOURS nullable en Expand phase
      default: null,            // ou "'default_value'" pour varchar
    }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('<table>', '<column_name>');
  }
}
```

### Exemple : AddPriorityToInvoices

```typescript
export class AddPriorityToInvoices1703001234567 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn('invoices', new TableColumn({
      name: 'priority',
      type: 'varchar',
      length: '20',
      isNullable: true,
      default: null,
    }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('invoices', 'priority');
  }
}
```

---

## 2. Add Table

```typescript
// infrastructure/persistence/migrations/<timestamp>-Create<Table>.ts

import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class Create<Table><Timestamp> implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(new Table({
      name: '<table_name>',
      columns: [
        {
          name: 'id',
          type: 'uuid',
          isPrimary: true,
          default: 'uuid_generate_v4()',
        },
        {
          name: '<foreign_key>_id',
          type: 'uuid',
          isNullable: false,
        },
        // <columns>
        {
          name: 'created_at',
          type: 'timestamp',
          default: 'CURRENT_TIMESTAMP',
        },
        {
          name: 'updated_at',
          type: 'timestamp',
          default: 'CURRENT_TIMESTAMP',
        },
        {
          name: 'deleted_at',
          type: 'timestamp',
          isNullable: true,
        },
      ],
    }), true);

    // Foreign key (optionnel)
    await queryRunner.createForeignKey('<table_name>', new TableForeignKey({
      columnNames: ['<foreign_key>_id'],
      referencedTableName: '<parent_table>',
      referencedColumnNames: ['id'],
      onDelete: 'CASCADE',
    }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('<table_name>');
  }
}
```

### Exemple : CreateInvoiceItems

```typescript
export class CreateInvoiceItems1703001234567 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(new Table({
      name: 'invoice_items',
      columns: [
        { name: 'id', type: 'uuid', isPrimary: true, default: 'uuid_generate_v4()' },
        { name: 'invoice_id', type: 'uuid', isNullable: false },
        { name: 'description', type: 'varchar', length: '255' },
        { name: 'quantity', type: 'integer', default: 1 },
        { name: 'unit_price_cents', type: 'bigint' },
        { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
        { name: 'updated_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
        { name: 'deleted_at', type: 'timestamp', isNullable: true },
      ],
    }), true);

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

---

## 3. Add Index

```typescript
// infrastructure/persistence/migrations/<timestamp>-AddIndex<Name>.ts

export class AddIndex<Name><Timestamp> implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Index simple
    await queryRunner.query(`
      CREATE INDEX idx_<table>_<column>
      ON <table>(<column>)
    `);

    // OU Index partiel (avec WHERE, recommandé pour soft delete)
    await queryRunner.query(`
      CREATE INDEX idx_<table>_<column>
      ON <table>(<column>)
      WHERE deleted_at IS NULL
    `);

    // OU Index CONCURRENTLY (pas de lock, mais hors transaction TypeORM)
    // Nécessite: transaction: false dans la config migration
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_<table>_<column>
      ON <table>(<column>)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS idx_<table>_<column>');
  }
}
```

### Exemple : Index sur status avec soft delete

```typescript
export class AddIndexInvoicesStatus1703001234567 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE INDEX idx_invoices_status
      ON invoices(status)
      WHERE deleted_at IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS idx_invoices_status');
  }
}
```

---

## 4. Backfill (migration séparée)

```typescript
// infrastructure/persistence/migrations/<timestamp>-Backfill<Column>.ts

export class Backfill<Column><Timestamp> implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Backfill par batch pour éviter les locks sur grandes tables
    await queryRunner.query(`
      UPDATE <table>
      SET <new_column> = <expression>
      WHERE <new_column> IS NULL
    `);

    // OU avec conversion de données
    await queryRunner.query(`
      UPDATE invoices
      SET amount_cents = COALESCE(legacy_amount * 100, 0)
      WHERE amount_cents IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Backfill est généralement idempotent
    // On peut soit reset à NULL, soit ne rien faire
    await queryRunner.query(`
      UPDATE <table>
      SET <new_column> = NULL
    `);
  }
}
```

---

## 5. Make NOT NULL (Contract phase)

```typescript
// infrastructure/persistence/migrations/<timestamp>-Make<Column>NotNull.ts

export class Make<Column>NotNull<Timestamp> implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. S'assurer qu'il n'y a plus de NULL (backfill déjà fait)
    await queryRunner.query(`
      UPDATE <table>
      SET <column> = <default_value>
      WHERE <column> IS NULL
    `);

    // 2. Changer la contrainte
    await queryRunner.changeColumn('<table>', '<column>', new TableColumn({
      name: '<column>',
      type: '<type>',
      isNullable: false,
      default: <default>,
    }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.changeColumn('<table>', '<column>', new TableColumn({
      name: '<column>',
      type: '<type>',
      isNullable: true,
    }));
  }
}
```

---

## 6. Rename Column (Expand/Contract)

### Phase 1: Expand (ajouter nouvelle colonne)

```typescript
export class AddNewColumn1703001234567 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn('invoices', new TableColumn({
      name: 'amount_cents',      // Nouveau nom
      type: 'bigint',
      isNullable: true,
    }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('invoices', 'amount_cents');
  }
}
```

### Code: Dual Write/Read

```typescript
// Dans le repository
async save(invoice: Invoice): Promise<void> {
  const entity = new InvoiceOrmEntity();
  entity.amount_cents = invoice.getAmount();
  entity.legacy_amount = invoice.getAmount() / 100;  // Dual write
  await this.repo.save(entity);
}

// Dans le mapper
toDomain(entity: InvoiceOrmEntity): Invoice {
  const amount = entity.amount_cents ?? (entity.legacy_amount * 100) ?? 0;  // Dual read
  return Invoice.reconstitute({ /* ... */, amount });
}
```

### Phase 2: Backfill

```typescript
export class BackfillAmountCents1703001234568 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE invoices
      SET amount_cents = legacy_amount * 100
      WHERE amount_cents IS NULL AND legacy_amount IS NOT NULL
    `);
  }
}
```

### Phase 3: Contract (supprimer ancienne colonne - future PR)

```typescript
export class RemoveLegacyAmount1703009999999 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('invoices', 'legacy_amount');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn('invoices', new TableColumn({
      name: 'legacy_amount',
      type: 'decimal',
      precision: 10,
      scale: 2,
      isNullable: true,
    }));
  }
}
```

---

## 7. ORM Entity (mise à jour)

```typescript
// infrastructure/persistence/entities/<aggregate>.orm-entity.ts

@Entity('<table>')
export class <Aggregate>OrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  // Ajouter la nouvelle colonne
  @Column({ name: '<column_name>', nullable: true })
  <columnName>: <type> | null;

  // ... autres colonnes
}
```

### Exemple : Ajouter priority

```typescript
@Entity('invoices')
export class InvoiceOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ nullable: true })
  priority: string | null;  // Nouvelle colonne nullable

  // ...
}
```

---

## Commandes

```bash
# Créer une migration vide
npm run migration:create -- -n <MigrationName>

# Générer une migration depuis les changements entity
npm run migration:generate -- -n <MigrationName>

# Exécuter les migrations
npm run migration:run

# Revert la dernière migration
npm run migration:revert

# Voir le statut
npm run migration:show
```

---

## Checklist

- [ ] Migration créée avec up() et down()
- [ ] Nouvelle colonne est nullable (Expand phase)
- [ ] ORM Entity mise à jour
- [ ] Repository/Mapper mis à jour (dual read si rename)
- [ ] Backfill créé si nécessaire (migration séparée)
- [ ] down() testé en local
- [ ] `npm run migration:run` passe
- [ ] `npm run migration:revert` passe
- [ ] `npm run build && npm run test` passent
