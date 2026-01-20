# Database Migrations for Invoice Generator

This directory contains SQL migrations for the invoice generator feature.

## Migrations List

1. **001-create-ligne-facture.sql** - Creates the `lignes_facture` table for invoice line items
2. **002-add-condition-paiement-to-client.sql** - Adds payment condition reference to clients
3. **003-create-invoice-numbering.sql** - Creates the `invoice_numbering` table for sequential numbering
4. **004-make-facture-numero-nullable.sql** - Makes invoice number nullable for draft invoices

## How to Run Migrations

### Option 1: Using psql (Recommended)

```bash
# Navigate to backend directory
cd backend

# Run all migrations in order
psql -U your_username -d your_database -f src/infrastructure/db/migrations/001-create-ligne-facture.sql
psql -U your_username -d your_database -f src/infrastructure/db/migrations/002-add-condition-paiement-to-client.sql
psql -U your_username -d your_database -f src/infrastructure/db/migrations/003-create-invoice-numbering.sql
psql -U your_username -d your_database -f src/infrastructure/db/migrations/004-make-facture-numero-nullable.sql
```

### Option 2: Run all at once

```bash
cd backend
cat src/infrastructure/db/migrations/*.sql | psql -U your_username -d your_database
```

### Option 3: Using a DB client (pgAdmin, DBeaver, etc.)

1. Connect to your database
2. Execute each SQL file in numerical order (001 → 004)

## Prerequisites

Before running these migrations, ensure:
- [ ] Database is running and accessible
- [ ] You have the correct database credentials
- [ ] The following tables exist: `factures`, `produits`, `clientbases`, `conditions_paiement`, `statut_factures`, `organisations`
- [ ] PostgreSQL extension `uuid-ossp` is enabled (for uuid_generate_v4())

## Post-Migration Steps

After running the migrations:
1. Verify all tables were created successfully
2. Check that indexes were created
3. Ensure foreign key constraints are in place
4. Seed the `statut_factures` table with "BROUILLON" and "VALIDE" statuses if not already present

## Seeding Statuses

If the statuses don't exist yet, run:

```sql
INSERT INTO statut_factures (code, nom, description, ordre_affichage, created_at, updated_at)
VALUES
  ('BROUILLON', 'Brouillon', 'Facture en cours de création, modifiable', 1, NOW(), NOW()),
  ('VALIDE', 'Validée', 'Facture validée avec numéro officiel, non modifiable', 2, NOW(), NOW())
ON CONFLICT (code) DO NOTHING;
```

## Rollback

To rollback these migrations (⚠️ WARNING: This will delete data!):

```sql
-- Rollback in reverse order
DROP TABLE IF EXISTS lignes_facture CASCADE;
ALTER TABLE clientbases DROP COLUMN IF EXISTS condition_paiement_id;
DROP TABLE IF EXISTS invoice_numbering CASCADE;
ALTER TABLE factures ALTER COLUMN numero SET NOT NULL;
ALTER TABLE factures DROP CONSTRAINT IF EXISTS check_numero_when_validated;
```

## Verification

Verify the migrations worked:

```sql
-- Check lignes_facture table
SELECT * FROM information_schema.tables WHERE table_name = 'lignes_facture';

-- Check indexes
SELECT * FROM pg_indexes WHERE tablename IN ('lignes_facture', 'invoice_numbering', 'clientbases');

-- Check constraints
SELECT * FROM information_schema.table_constraints
WHERE table_name IN ('lignes_facture', 'factures', 'invoice_numbering');
```
