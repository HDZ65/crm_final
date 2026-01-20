-- Migration 3: Create Invoice Numbering Table
-- Description: Adds table for sequential invoice numbering per organization and year
-- Author: Claude
-- Date: 2025-12-19

CREATE TABLE IF NOT EXISTS invoice_numbering (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organisation_id UUID NOT NULL,
  year INTEGER NOT NULL,
  last_number INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

  -- Foreign key constraint
  CONSTRAINT fk_invoice_numbering_organisation
    FOREIGN KEY (organisation_id)
    REFERENCES organisations(id)
    ON DELETE CASCADE,

  -- Unique constraint to prevent duplicate numbering
  CONSTRAINT uq_invoice_numbering_org_year
    UNIQUE(organisation_id, year)
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_invoice_numbering_org_year ON invoice_numbering(organisation_id, year);

-- Add comments
COMMENT ON TABLE invoice_numbering IS 'Sequential invoice numbering per organization and year';
COMMENT ON COLUMN invoice_numbering.year IS 'Year for which the numbering sequence applies';
COMMENT ON COLUMN invoice_numbering.last_number IS 'Last assigned invoice number for this organization and year';
COMMENT ON CONSTRAINT uq_invoice_numbering_org_year ON invoice_numbering IS 'Ensures only one numbering sequence per organization per year';
