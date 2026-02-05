import {
  CreateLigneContratDto,
  UpdateLigneContratDto,
  LigneContratResponseDto,
} from '../dtos';

export interface ILigneContratService {
  create(dto: CreateLigneContratDto): Promise<LigneContratResponseDto>;
  update(dto: UpdateLigneContratDto): Promise<LigneContratResponseDto>;
  findById(id: string): Promise<LigneContratResponseDto>;
  findByContrat(contratId: string): Promise<LigneContratResponseDto[]>;
  delete(id: string): Promise<boolean>;
}

export const LIGNE_CONTRAT_SERVICE = Symbol('ILigneContratService');
