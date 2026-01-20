-- Migration 1: Create LigneFacture Table
-- Description: Adds table for invoice line items with product references and calculated amounts
-- Author: Claude
-- Date: 2025-12-19

CREATE TABLE IF NOT EXISTS lignes_facture (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  facture_id UUID NOT NULL,
  produit_id UUID NOT NULL,
  quantite DECIMAL(10,2) NOT NULL CHECK (quantite > 0),
  prix_unitaire DECIMAL(10,2) NOT NULL,
  description TEXT,
  montant_ht DECIMAL(10,2) NOT NULL,
  taux_tva DECIMAL(5,2) NOT NULL,
  montant_tva DECIMAL(10,2) NOT NULL,
  montant_ttc DECIMAL(10,2) NOT NULL,
  ordre_affichage INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

  -- Foreign key constraints
  CONSTRAINT fk_ligne_facture_facture
    FOREIGN KEY (facture_id)
    REFERENCES factures(id)
    ON DELETE CASCADE,

  CONSTRAINT fk_ligne_facture_produit
    FOREIGN KEY (produit_id)
    REFERENCES produits(id)
    ON DELETE RESTRICT
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_lignes_facture_facture_id ON lignes_facture(facture_id);
CREATE INDEX IF NOT EXISTS idx_lignes_facture_produit_id ON lignes_facture(produit_id);

-- Add comment
COMMENT ON TABLE lignes_facture IS 'Invoice line items with product details and calculated amounts';
COMMENT ON COLUMN lignes_facture.facture_id IS 'Reference to parent invoice';
COMMENT ON COLUMN lignes_facture.produit_id IS 'Reference to product';
COMMENT ON COLUMN lignes_facture.ordre_affichage IS 'Display order of the line in the invoice';
COMMENT ON COLUMN lignes_facture.montant_ht IS 'Amount excluding VAT (calculated)';
COMMENT ON COLUMN lignes_facture.montant_tva IS 'VAT amount (calculated)';
COMMENT ON COLUMN lignes_facture.montant_ttc IS 'Total amount including VAT (calculated)';
