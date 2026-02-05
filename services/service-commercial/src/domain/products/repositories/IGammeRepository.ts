import { GammeEntity } from '../entities/gamme.entity';

export interface IGammeRepository {
  findById(id: string): Promise<GammeEntity | null>;
  findByCode(organisationId: string, code: string): Promise<GammeEntity | null>;
  findAll(filters?: {
    organisationId?: string;
    actif?: boolean;
  }): Promise<GammeEntity[]>;
  save(entity: GammeEntity): Promise<GammeEntity>;
  delete(id: string): Promise<void>;
}
