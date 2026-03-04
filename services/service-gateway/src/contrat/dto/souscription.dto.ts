import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray, IsBoolean, IsDateString, IsNotEmpty, IsNumber,
  IsOptional, IsString, ValidateNested,
} from 'class-validator';
import { ChoixNeolineDto } from './choix-neoline.dto';

export class SouscriptionDto {
  @ApiProperty({ description: 'Date de souscription', example: '2026-02-28T14:30:00.000Z', format: 'date-time' })
  @IsDateString()
  date_souscription: string;

  @ApiPropertyOptional({ description: 'Montant total', example: 29.90, type: Number })
  @IsOptional()
  @IsNumber()
  total_amount?: number;

  @ApiPropertyOptional({ description: 'ID formule choisie', example: 3, type: Number })
  @IsOptional()
  @IsNumber()
  formula_id?: number;

  @ApiPropertyOptional({ description: 'Portabilité numéro', example: false })
  @IsOptional()
  @IsBoolean()
  conserve_numero?: boolean;

  @ApiPropertyOptional({ description: 'Code RIO portabilité', example: null })
  @IsOptional()
  @IsString()
  rio?: string;

  @ApiPropertyOptional({ description: 'Carte eSIM', example: false })
  @IsOptional()
  @IsBoolean()
  esim?: boolean;

  @ApiPropertyOptional({ description: 'Numéro mobile actuel', example: null })
  @IsOptional()
  @IsString()
  mobile_number?: string;

  @ApiPropertyOptional({ description: 'Choix des formules Néoliane', type: () => [ChoixNeolineDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChoixNeolineDto)
  choix_neoline?: ChoixNeolineDto[];
}
