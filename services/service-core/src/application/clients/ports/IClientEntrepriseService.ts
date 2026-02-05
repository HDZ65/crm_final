import {
  CreateClientEntrepriseDto,
  UpdateClientEntrepriseDto,
  ClientEntrepriseResponseDto,
  PaginationDto,
  PaginationResponseDto,
} from '../dtos';

export interface IClientEntrepriseService {
  create(dto: CreateClientEntrepriseDto): Promise<ClientEntrepriseResponseDto>;
  update(dto: UpdateClientEntrepriseDto): Promise<ClientEntrepriseResponseDto>;
  findById(id: string): Promise<ClientEntrepriseResponseDto>;
  findByClientBaseId(clientBaseId: string): Promise<ClientEntrepriseResponseDto | null>;
  findAll(pagination?: PaginationDto): Promise<{
    clients: ClientEntrepriseResponseDto[];
    pagination: PaginationResponseDto;
  }>;
  delete(id: string): Promise<boolean>;
}

export const CLIENT_ENTREPRISE_SERVICE = Symbol('IClientEntrepriseService');
