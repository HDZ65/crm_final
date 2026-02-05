import { GrilleTarifaireEntity } from '../entities/grille-tarifaire.entity';

export interface IGrilleTarifaireRepository {
  findById(id: string): Promise<GrilleTarifaireEntity | null>;
  findDefault(organisationId: string): Promise<GrilleTarifaireEntity | null>;
  findAll(filters?: {
    organisationId?: string;
    actif?: boolean;
  }): Promise<GrilleTarifaireEntity[]>;
  save(entity: GrilleTarifaireEntity): Promise<GrilleTarifaireEntity>;
  delete(id: string): Promise<void>;
}
