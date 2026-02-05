import { IsString, IsBoolean, IsUUID, IsOptional } from 'class-validator';

export class CreateCarrierAccountDto {
  @IsUUID()
  organisationId: string;

  @IsString()
  type: string;

  @IsString()
  contractNumber: string;

  @IsString()
  password: string;

  @IsString()
  labelFormat: string;

  @IsBoolean()
  actif: boolean;
}

export class UpdateCarrierAccountDto {
  @IsOptional()
  @IsString()
  contractNumber?: string;

  @IsOptional()
  @IsString()
  password?: string;

  @IsOptional()
  @IsString()
  labelFormat?: string;

  @IsOptional()
  @IsBoolean()
  actif?: boolean;
}

export class CarrierAccountResponseDto {
  id: string;
  organisationId: string;
  type: string;
  contractNumber: string;
  labelFormat: string;
  actif: boolean;
  createdAt: string;
  updatedAt: string;
}
