import { BaseEntity } from './base.entity';

export type StatutBordereau = 'brouillon' | 'valide' | 'exporte' | 'archive';

export class BordereauCommissionEntity extends BaseEntity {
  organisationId: string;

  // Identification
  reference: string; // Ex: BRD-2024-01-001
  periode: string; // YYYY-MM

  // Apporteur (un bordereau par apporteur par période)
  apporteurId: string;

  // Totaux
  totalBrut: number;
  totalReprises: number;
  totalAcomptes: number;
  totalNetAPayer: number;
  nombreLignes: number;

  // Statut et workflow
  statutBordereau: StatutBordereau;
  dateValidation: Date | null;
  validateurId: string | null;
  dateExport: Date | null;

  // Fichiers générés
  fichierPdfUrl: string | null;
  fichierExcelUrl: string | null;

  // Audit
  commentaire: string | null;
  creePar: string | null;

  constructor(partial: Partial<BordereauCommissionEntity>) {
    super();
    Object.assign(this, partial);
  }
}
