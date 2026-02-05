import {
  CreateTypeActiviteDto,
  UpdateTypeActiviteDto,
  TypeActiviteResponseDto,
} from '../dtos';

export interface ITypeActiviteService {
  create(dto: CreateTypeActiviteDto): Promise<TypeActiviteResponseDto>;
  findById(id: string): Promise<TypeActiviteResponseDto>;
  findByCode(code: string): Promise<TypeActiviteResponseDto>;
  findAll(): Promise<TypeActiviteResponseDto[]>;
  update(id: string, dto: UpdateTypeActiviteDto): Promise<TypeActiviteResponseDto>;
  delete(id: string): Promise<boolean>;
}

export const TYPE_ACTIVITE_SERVICE = Symbol('ITypeActiviteService');
