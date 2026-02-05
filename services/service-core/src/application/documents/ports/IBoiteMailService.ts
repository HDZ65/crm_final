import {
  CreateBoiteMailDto,
  UpdateBoiteMailDto,
  BoiteMailResponseDto,
  BoiteMailFiltersDto,
  PaginationDto,
  PaginationResponseDto,
} from '../dtos';

export interface IBoiteMailService {
  create(dto: CreateBoiteMailDto): Promise<BoiteMailResponseDto>;
  update(dto: UpdateBoiteMailDto): Promise<BoiteMailResponseDto>;
  findById(id: string): Promise<BoiteMailResponseDto>;
  findByUtilisateurId(utilisateurId: string): Promise<BoiteMailResponseDto[]>;
  findDefaultByUtilisateurId(utilisateurId: string): Promise<BoiteMailResponseDto | null>;
  findAll(
    filters?: BoiteMailFiltersDto,
    pagination?: PaginationDto,
  ): Promise<{
    boitesMail: BoiteMailResponseDto[];
    pagination: PaginationResponseDto;
  }>;
  setAsDefault(id: string): Promise<BoiteMailResponseDto>;
  delete(id: string): Promise<boolean>;
}

export const BOITE_MAIL_SERVICE = Symbol('IBoiteMailService');
