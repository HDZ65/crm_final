import {
  CreateTacheDto,
  UpdateTacheDto,
  TacheResponseDto,
} from '../dtos';
import { TacheStatut, TacheType, TachePriorite } from '../../../domain/engagement/entities';

export interface ITacheService {
  create(dto: CreateTacheDto): Promise<TacheResponseDto>;
  findById(id: string): Promise<TacheResponseDto>;
  findAll(
    filters?: {
      organisationId?: string;
      statut?: TacheStatut;
      type?: TacheType;
      priorite?: TachePriorite;
      search?: string;
      enRetard?: boolean;
    },
    pagination?: { page: number; limit: number },
  ): Promise<{
    data: TacheResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>;
  findByAssigne(
    assigneA: string,
    periode?: string,
    pagination?: { page: number; limit: number },
  ): Promise<{
    data: TacheResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>;
  findByClient(
    clientId: string,
    pagination?: { page: number; limit: number },
  ): Promise<{
    data: TacheResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>;
  update(id: string, dto: UpdateTacheDto): Promise<TacheResponseDto>;
  delete(id: string): Promise<boolean>;
  getStats(organisationId: string): Promise<{
    aFaire: number;
    enCours: number;
    terminee: number;
    annulee: number;
    enRetard: number;
    total: number;
  }>;
  marquerEnCours(id: string): Promise<TacheResponseDto>;
  marquerTerminee(id: string): Promise<TacheResponseDto>;
  marquerAnnulee(id: string): Promise<TacheResponseDto>;
}

export const TACHE_SERVICE = Symbol('ITacheService');
