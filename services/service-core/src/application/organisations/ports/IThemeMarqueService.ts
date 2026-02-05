import {
  CreateThemeMarqueDto,
  UpdateThemeMarqueDto,
  ThemeMarqueResponseDto,
  PaginationDto,
  PaginationResponseDto,
} from '../dtos';

export interface IThemeMarqueService {
  create(dto: CreateThemeMarqueDto): Promise<ThemeMarqueResponseDto>;
  update(dto: UpdateThemeMarqueDto): Promise<ThemeMarqueResponseDto>;
  findById(id: string): Promise<ThemeMarqueResponseDto>;
  findByOrganisationId(organisationId: string): Promise<ThemeMarqueResponseDto[]>;
  findAll(pagination?: PaginationDto): Promise<{
    themes: ThemeMarqueResponseDto[];
    pagination: PaginationResponseDto;
  }>;
  delete(id: string): Promise<boolean>;
}

export const THEME_MARQUE_SERVICE = Symbol('IThemeMarqueService');
