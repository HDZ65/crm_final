import { ExpeditionEntity } from '../entities';

export interface IExpeditionRepository {
  create(params: {
    organisationId: string;
    clientBaseId: string;
    transporteurCompteId: string;
    contratId?: string;
    trackingNumber: string;
    labelUrl: string;
    referenceCommande: string;
    produitId?: string;
    nomProduit?: string;
    poids?: number;
    adresseDestination?: string;
    villeDestination?: string;
    codePostalDestination?: string;
    dateExpedition?: Date;
    dateLivraisonEstimee?: Date;
  }): Promise<ExpeditionEntity>;

  findById(id: string): Promise<ExpeditionEntity | null>;

  findByTrackingNumber(trackingNumber: string): Promise<ExpeditionEntity | null>;

  findByClientId(
    clientBaseId: string,
    limit?: number,
    offset?: number,
  ): Promise<{ expeditions: ExpeditionEntity[]; total: number }>;

  findByOrganisationId(
    organisationId: string,
    etat?: string,
    limit?: number,
    offset?: number,
  ): Promise<{ expeditions: ExpeditionEntity[]; total: number }>;

  update(
    id: string,
    params: {
      etat?: string;
      lieuActuel?: string;
      dateLivraison?: Date;
    },
  ): Promise<ExpeditionEntity>;

  delete(id: string): Promise<void>;

  updateStatus(id: string, status: string, location?: string): Promise<ExpeditionEntity>;
}
