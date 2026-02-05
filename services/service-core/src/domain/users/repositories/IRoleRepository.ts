import { RoleEntity } from '../entities/role.entity';

export interface IRoleRepository {
  findById(id: string): Promise<RoleEntity | null>;
  findAll(): Promise<RoleEntity[]>;
  save(entity: RoleEntity): Promise<RoleEntity>;
  delete(id: string): Promise<void>;
  findByCode(code: string): Promise<RoleEntity | null>;
}
