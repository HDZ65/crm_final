import {
  CreateConfigurationDto,
  UpdateConfigurationDto,
  ConfigurationResponseDto,
} from '../dtos';

export interface IConfigurationService {
  getSystemConfig(organisationId: string): Promise<ConfigurationResponseDto | null>;
  createSystemConfig(dto: CreateConfigurationDto): Promise<ConfigurationResponseDto>;
  updateSystemConfig(dto: UpdateConfigurationDto): Promise<ConfigurationResponseDto>;
  resolveConfigForClient(clientId: string): Promise<ConfigurationResponseDto>;
  resolveConfigForContract(contratId: string): Promise<ConfigurationResponseDto>;
}

export const CONFIGURATION_SERVICE = Symbol('IConfigurationService');
