import { RolePartenaireEntity } from '../entities/role-partenaire.entity';

export interface IRolePartenaireRepository {
  findById(id: string): Promise<RolePartenaireEntity | null>;
  findAll(): Promise<RolePartenaireEntity[]>;
  save(entity: RolePartenaireEntity): Promise<RolePartenaireEntity>;
  delete(id: string): Promise<void>;
  findByCode(code: string): Promise<RolePartenaireEntity | null>;
}
