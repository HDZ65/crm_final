import { PartenaireCommercialEntity, TypePartenaire, StatutPartenaire } from '../entities/partenaire-commercial.entity';
import { PartenaireCommercialSocieteEntity } from '../entities/partenaire-commercial-societe.entity';

export interface IPartenaireCommercialRepository {
  // --- CRUD Partenaire ---
  findById(id: string): Promise<PartenaireCommercialEntity | null>;
  findByOrganisation(
    organisationId: string,
    filters?: {
      type?: TypePartenaire;
      statut?: StatutPartenaire;
      search?: string;
    },
    pagination?: { page: number; limit: number },
  ): Promise<{
    data: PartenaireCommercialEntity[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>;
  save(entity: Partial<PartenaireCommercialEntity>): Promise<PartenaireCommercialEntity>;
  update(id: string, data: Partial<PartenaireCommercialEntity>): Promise<PartenaireCommercialEntity>;
  delete(id: string): Promise<boolean>;

  // --- Société Activation ---
  findSocietesByPartenaire(partenaireId: string): Promise<PartenaireCommercialSocieteEntity[]>;
  activerSociete(partenaireId: string, societeId: string): Promise<PartenaireCommercialSocieteEntity>;
  desactiverSociete(partenaireId: string, societeId: string): Promise<PartenaireCommercialSocieteEntity>;
}
