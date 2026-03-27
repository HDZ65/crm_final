import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class ChoixNeolineDto {
  @ApiProperty({ description: 'ID de la formule', example: 3, type: Number })
  @IsNumber()
  formule_id: number;

  @ApiProperty({ description: 'Libellé de la formule', example: 'Formule Confort' })
  @IsString()
  @IsNotEmpty()
  formule_label: string;

  @ApiProperty({ description: 'ID de la gamme', example: 1, type: Number })
  @IsNumber()
  gamme_id: number;

  @ApiProperty({ description: 'Libellé de la gamme', example: 'Santé' })
  @IsString()
  @IsNotEmpty()
  gamme_label: string;

  @ApiProperty({ description: "Type d'assurance", example: 'mutuelle' })
  @IsString()
  @IsNotEmpty()
  type_assurance: string;

  @ApiProperty({ description: 'Montant mensuel', example: 29.90, type: Number })
  @IsNumber()
  montant: number;

  @ApiProperty({ description: "Date d'effet", example: '2026-03-01T00:00:00.000Z', format: 'date-time' })
  @IsDateString()
  date_effet: string;
}
