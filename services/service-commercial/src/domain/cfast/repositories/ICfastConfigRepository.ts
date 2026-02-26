import { CfastConfigEntity } from '../entities/cfast-config.entity';

export interface ICfastConfigRepository {
  findById(id: string): Promise<CfastConfigEntity | null>;
  findByOrganisationId(organisationId: string): Promise<CfastConfigEntity | null>;
  save(entity: CfastConfigEntity): Promise<CfastConfigEntity>;
  delete(id: string): Promise<void>;
}
