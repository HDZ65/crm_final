import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsObject, IsIn, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class RecurringDto {
  @ApiProperty({ enum: ['day', 'week', 'month', 'year'], description: 'Intervalle de facturation' })
  @IsIn(['day', 'week', 'month', 'year'])
  interval: 'day' | 'week' | 'month' | 'year';

  @ApiPropertyOptional({ description: 'Nombre d\'intervalles entre chaque facturation' })
  @IsNumber()
  @IsOptional()
  intervalCount?: number;
}

export class CreateStripePriceDto {
  @ApiProperty({ description: 'ID du produit Stripe' })
  @IsString()
  productId: string;

  @ApiProperty({ description: 'Montant en centimes' })
  @IsNumber()
  unitAmount: number;

  @ApiProperty({ description: 'Devise (ex: eur, usd)', default: 'eur' })
  @IsString()
  currency: string;

  @ApiPropertyOptional({ description: 'Configuration pour abonnement récurrent' })
  @ValidateNested()
  @Type(() => RecurringDto)
  @IsOptional()
  recurring?: RecurringDto;

  @ApiPropertyOptional({ description: 'Métadonnées additionnelles' })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, string>;
}
