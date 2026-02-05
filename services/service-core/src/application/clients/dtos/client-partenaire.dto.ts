import { IsString, IsOptional, IsUUID, IsBoolean } from 'class-validator';

export class CreateClientPartenaireDto {
  @IsUUID()
  clientBaseId: string;

  @IsUUID()
  partenaireId: string;

  @IsOptional()
  @IsString()
  codeExterne?: string;

  @IsOptional()
  @IsBoolean()
  actif?: boolean;
}

export class UpdateClientPartenaireDto {
  @IsUUID()
  id: string;

  @IsOptional()
  @IsString()
  codeExterne?: string;

  @IsOptional()
  @IsBoolean()
  actif?: boolean;
}

export class ClientPartenaireResponseDto {
  id: string;
  clientBaseId: string;
  partenaireId: string;
  codeExterne: string | null;
  actif: boolean;
  createdAt: Date;
  updatedAt: Date;
}
