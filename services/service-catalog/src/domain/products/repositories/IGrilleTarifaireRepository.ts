import { GrilleTarifaireEntity } from '../entities/grille-tarifaire.entity';

export interface IGrilleTarifaireRepository {
  findById(id: string): Promise<GrilleTarifaireEntity | null>;
  findDefault(keycloakGroupId: string): Promise<GrilleTarifaireEntity | null>;
  findAll(filters?: { keycloakGroupId?: string; actif?: boolean }): Promise<GrilleTarifaireEntity[]>;
  save(entity: GrilleTarifaireEntity): Promise<GrilleTarifaireEntity>;
  delete(id: string): Promise<void>;
}
