import {
  CreateEvenementSuiviDto,
  UpdateEvenementSuiviDto,
  EvenementSuiviResponseDto,
} from '../dtos';

export interface IEvenementSuiviService {
  create(dto: CreateEvenementSuiviDto): Promise<EvenementSuiviResponseDto>;
  findById(id: string): Promise<EvenementSuiviResponseDto>;
  findByExpedition(expeditionId: string): Promise<EvenementSuiviResponseDto[]>;
  update(id: string, dto: UpdateEvenementSuiviDto): Promise<EvenementSuiviResponseDto>;
  delete(id: string): Promise<boolean>;
}

export const EVENEMENT_SUIVI_SERVICE = Symbol('IEvenementSuiviService');
