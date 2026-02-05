import { TypeActiviteEntity } from '../entities/type-activite.entity';

export interface ITypeActiviteRepository {
  findById(id: string): Promise<TypeActiviteEntity | null>;
  findByCode(code: string): Promise<TypeActiviteEntity | null>;
  findAll(): Promise<TypeActiviteEntity[]>;
  save(entity: TypeActiviteEntity): Promise<TypeActiviteEntity>;
  delete(id: string): Promise<boolean>;
}
