import { SavePspAccountDto, GetPspAccountDto, TestPspConnectionDto, DeactivatePspAccountDto, PspConfigResponseDto, PspConnectionTestResultDto } from '../dtos/psp-config.dto';

export interface IPspConfigService {
  savePspAccount(dto: SavePspAccountDto): Promise<PspConfigResponseDto>;
  getPspAccount(dto: GetPspAccountDto): Promise<PspConfigResponseDto | null>;
  testPspConnection(dto: TestPspConnectionDto): Promise<PspConnectionTestResultDto>;
  deactivatePspAccount(dto: DeactivatePspAccountDto): Promise<{ success: boolean; message: string }>;
}

export const I_PSP_CONFIG_SERVICE = Symbol('IPspConfigService');
