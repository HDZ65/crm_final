import {
  CreateAdresseDto,
  UpdateAdresseDto,
  AdresseResponseDto,
  PaginationDto,
  PaginationResponseDto,
} from '../dtos';

export interface IAdresseService {
  create(dto: CreateAdresseDto): Promise<AdresseResponseDto>;
  update(dto: UpdateAdresseDto): Promise<AdresseResponseDto>;
  findById(id: string): Promise<AdresseResponseDto>;
  findByClientId(clientBaseId: string): Promise<AdresseResponseDto[]>;
  findAll(pagination?: PaginationDto): Promise<{
    adresses: AdresseResponseDto[];
    pagination: PaginationResponseDto;
  }>;
  delete(id: string): Promise<boolean>;
}

export const ADRESSE_SERVICE = Symbol('IAdresseService');
