import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';
import { CommercialDto } from './commercial.dto';
import { ContratInnerDto } from './contrat-inner.dto';
import { PaiementDto } from './paiement.dto';
import { ProspectDto } from './prospect.dto';
import { SouscriptionDto } from './souscription.dto';

export class CreateContratDto {
  @ApiProperty({ description: 'ID société dans le CRM (France Téléphone, Mondial TV...)', example: 'soc_yyy' })
  @IsString()
  @IsNotEmpty()
  societe_id: string;

  @ApiProperty({ description: 'Données prospect/client', type: () => ProspectDto })
  @ValidateNested()
  @Type(() => ProspectDto)
  prospect: ProspectDto;

  @ApiProperty({ description: 'Commercial ayant signé le contrat', type: () => CommercialDto })
  @ValidateNested()
  @Type(() => CommercialDto)
  commercial: CommercialDto;

  @ApiProperty({ description: 'Informations du contrat', type: () => ContratInnerDto })
  @ValidateNested()
  @Type(() => ContratInnerDto)
  contrat: ContratInnerDto;

  @ApiPropertyOptional({ description: 'Données de souscription (optionnel)', type: () => SouscriptionDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => SouscriptionDto)
  souscription?: SouscriptionDto;

  @ApiProperty({ description: 'Informations de paiement bancaire', type: () => PaiementDto })
  @ValidateNested()
  @Type(() => PaiementDto)
  paiement: PaiementDto;
}
