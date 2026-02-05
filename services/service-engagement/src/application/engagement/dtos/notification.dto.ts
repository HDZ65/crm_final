import { IsString, IsOptional, IsUUID, IsBoolean, IsEnum } from 'class-validator';
import { NotificationType } from '../../../domain/engagement/entities';

export class CreateNotificationDto {
  @IsUUID()
  organisationId: string;

  @IsUUID()
  utilisateurId: string;

  @IsEnum(NotificationType)
  type: NotificationType;

  @IsString()
  titre: string;

  @IsString()
  message: string;

  @IsOptional()
  metadata?: Record<string, any>;

  @IsOptional()
  @IsString()
  lienUrl?: string;

  @IsOptional()
  @IsBoolean()
  broadcastWebsocket?: boolean;
}

export class UpdateNotificationDto {
  @IsOptional()
  @IsString()
  titre?: string;

  @IsOptional()
  @IsString()
  message?: string;

  @IsOptional()
  @IsBoolean()
  lu?: boolean;

  @IsOptional()
  metadata?: Record<string, any>;

  @IsOptional()
  @IsString()
  lienUrl?: string;
}

export class NotificationResponseDto {
  id: string;
  organisationId: string;
  utilisateurId: string;
  type: NotificationType;
  titre: string;
  message: string;
  lu: boolean;
  metadata: Record<string, any>;
  lienUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}
