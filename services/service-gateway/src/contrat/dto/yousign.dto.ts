import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { YousignStatus } from '../enums';

export class YousignDto {
  @ApiProperty({ description: 'Identifiant de la requête de signature YouSign', example: 'sr_abc123' })
  @IsString()
  @IsNotEmpty()
  signature_request_id: string;

  @ApiProperty({ description: 'Statut de la signature YouSign', example: 'done', enum: YousignStatus, enumName: 'YousignStatus' })
  @IsEnum(YousignStatus)
  status: YousignStatus;

  @ApiPropertyOptional({ description: 'Référence externe', example: 'WLP-2026-001234' })
  @IsOptional()
  @IsString()
  external_id?: string;
}
