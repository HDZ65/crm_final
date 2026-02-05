import { IsString, IsOptional, IsUUID, IsBoolean, IsEnum, IsNumber, IsDate } from 'class-validator';
import { MailProvider, ConnectionType } from '../../../domain/engagement/entities';

export class CreateMailboxDto {
  @IsUUID()
  organisationId: string;

  @IsOptional()
  @IsUUID()
  societeId?: string;

  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsString()
  nom: string;

  @IsString()
  adresseEmail: string;

  @IsEnum(MailProvider)
  fournisseur: MailProvider;

  @IsEnum(ConnectionType)
  typeConnexion: ConnectionType;

  @IsOptional()
  @IsString()
  smtpHost?: string;

  @IsOptional()
  @IsNumber()
  smtpPort?: number;

  @IsOptional()
  @IsString()
  imapHost?: string;

  @IsOptional()
  @IsNumber()
  imapPort?: number;

  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsString()
  password?: string;

  @IsOptional()
  @IsString()
  accessToken?: string;

  @IsOptional()
  @IsString()
  refreshToken?: string;

  @IsOptional()
  @IsDate()
  tokenExpiry?: Date;

  @IsOptional()
  @IsString()
  signature?: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class UpdateMailboxDto {
  @IsOptional()
  @IsString()
  nom?: string;

  @IsOptional()
  @IsString()
  adresseEmail?: string;

  @IsOptional()
  @IsEnum(MailProvider)
  fournisseur?: MailProvider;

  @IsOptional()
  @IsEnum(ConnectionType)
  typeConnexion?: ConnectionType;

  @IsOptional()
  @IsString()
  smtpHost?: string;

  @IsOptional()
  @IsNumber()
  smtpPort?: number;

  @IsOptional()
  @IsString()
  imapHost?: string;

  @IsOptional()
  @IsNumber()
  imapPort?: number;

  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsString()
  password?: string;

  @IsOptional()
  @IsString()
  accessToken?: string;

  @IsOptional()
  @IsString()
  refreshToken?: string;

  @IsOptional()
  @IsDate()
  tokenExpiry?: Date;

  @IsOptional()
  @IsString()
  signature?: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class MailboxResponseDto {
  id: string;
  organisationId: string;
  societeId: string | null;
  userId: string | null;
  nom: string;
  adresseEmail: string;
  fournisseur: MailProvider;
  typeConnexion: ConnectionType;
  isDefault: boolean;
  isActive: boolean;
  lastSyncAt: Date | null;
  syncError: string | null;
  createdAt: Date;
  updatedAt: Date;
}
