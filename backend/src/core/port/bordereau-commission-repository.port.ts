import { BordereauCommissionEntity } from '../domain/bordereau-commission.entity';
import { BaseRepositoryPort } from './repository.port';

export interface BordereauWithDetails {
  bordereau: BordereauCommissionEntity;
  apporteur: {
    id: string;
    nom: string;
    prenom: string;
    typeApporteur: string;
  } | null;
}

export interface BordereauCommissionRepositoryPort
  extends BaseRepositoryPort<BordereauCommissionEntity> {
  findByOrganisationId(organisationId: string): Promise<BordereauCommissionEntity[]>;
  findByApporteurId(apporteurId: string): Promise<BordereauCommissionEntity[]>;
  findByPeriode(periode: string): Promise<BordereauCommissionEntity[]>;
  findByReference(reference: string): Promise<BordereauCommissionEntity | null>;
  findByStatut(statut: string): Promise<BordereauCommissionEntity[]>;
  findByApporteurAndPeriode(
    apporteurId: string,
    periode: string,
  ): Promise<BordereauCommissionEntity | null>;
  findAllWithDetails(organisationId?: string): Promise<BordereauWithDetails[]>;
  validerBordereau(
    id: string,
    validateurId: string,
  ): Promise<BordereauCommissionEntity>;
  exporterBordereau(
    id: string,
    pdfUrl: string | null,
    excelUrl: string | null,
  ): Promise<BordereauCommissionEntity>;
  recalculerTotaux(id: string): Promise<BordereauCommissionEntity>;
}
