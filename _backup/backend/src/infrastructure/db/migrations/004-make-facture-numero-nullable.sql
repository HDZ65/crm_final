-- Migration 4: Make Invoice Number Nullable for Drafts
-- Description: Allows drafts to have no invoice number until validated
-- Author: Claude
-- Date: 2025-12-19

-- Remove NOT NULL constraint from numero column
ALTER TABLE factures
ALTER COLUMN numero DROP NOT NULL;

-- Add check constraint: numero required when status is not BROUILLON
-- Note: This constraint ensures validated invoices have a number
ALTER TABLE factures
ADD CONSTRAINT check_numero_when_validated
  CHECK (
    numero IS NOT NULL
    OR EXISTS (
      SELECT 1 FROM statut_factures sf
      WHERE sf.id = factures.statut_id
      AND sf.code = 'BROUILLON'
    )
  );

-- Add comment
COMMENT ON COLUMN factures.numero IS 'Official invoice number (NULL for drafts, required for validated invoices)';
