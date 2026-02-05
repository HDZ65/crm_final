import {
  CreateUtilisateurDto,
  UpdateUtilisateurDto,
  UtilisateurResponseDto,
  UtilisateurFiltersDto,
  PaginationDto,
  PaginationResponseDto,
} from '../dtos';

export interface IUtilisateurService {
  create(dto: CreateUtilisateurDto): Promise<UtilisateurResponseDto>;
  update(dto: UpdateUtilisateurDto): Promise<UtilisateurResponseDto>;
  findById(id: string): Promise<UtilisateurResponseDto>;
  findByKeycloakId(keycloakId: string): Promise<UtilisateurResponseDto | null>;
  findByEmail(email: string): Promise<UtilisateurResponseDto | null>;
  findAll(
    filters?: UtilisateurFiltersDto,
    pagination?: PaginationDto,
  ): Promise<{
    utilisateurs: UtilisateurResponseDto[];
    pagination: PaginationResponseDto;
  }>;
  delete(id: string): Promise<boolean>;
}

export const UTILISATEUR_SERVICE = Symbol('IUtilisateurService');
