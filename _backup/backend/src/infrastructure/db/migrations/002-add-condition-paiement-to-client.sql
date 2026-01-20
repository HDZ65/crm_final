-- Migration 2: Add Payment Condition to Client
-- Description: Adds payment condition reference to client for auto-fill in invoices
-- Author: Claude
-- Date: 2025-12-19

-- Add column for payment condition reference
ALTER TABLE clientbases
ADD COLUMN IF NOT EXISTS condition_paiement_id UUID;

-- Add foreign key constraint
ALTER TABLE clientbases
ADD CONSTRAINT fk_clientbase_condition_paiement
  FOREIGN KEY (condition_paiement_id)
  REFERENCES conditions_paiement(id)
  ON DELETE SET NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_clientbases_condition_paiement ON clientbases(condition_paiement_id);

-- Add comment
COMMENT ON COLUMN clientbases.condition_paiement_id IS 'Default payment condition for this client';
