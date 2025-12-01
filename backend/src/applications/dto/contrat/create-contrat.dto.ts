import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateContratDto {
  @IsString()
  @IsNotEmpty()
  organisationId: string;

  @IsString()
  @IsNotEmpty()
  referenceExterne: string;

  @IsString()
  @IsNotEmpty()
  dateSignature: string;

  @IsString()
  @IsNotEmpty()
  dateDebut: string;

  @IsString()
  @IsNotEmpty()
  dateFin: string;

  @IsString()
  @IsNotEmpty()
  statutId: string;

  @IsBoolean()
  autoRenouvellement: boolean;

  @IsInt()
  joursPreavis: number;

  @IsString()
  @IsNotEmpty()
  conditionPaiementId: string;

  @IsString()
  @IsNotEmpty()
  modeleDistributionId: string;

  @IsString()
  @IsNotEmpty()
  facturationParId: string;

  @IsString()
  @IsNotEmpty()
  clientBaseId: string;

  @IsUUID()
  @IsNotEmpty()
  societeId: string;

  @IsString()
  @IsNotEmpty()
  commercialId: string;

  @IsString()
  @IsNotEmpty()
  clientPartenaireId: string;

  @IsString()
  @IsNotEmpty()
  adresseFacturationId: string;

  @IsString()
  @IsNotEmpty()
  dateFinRetractation: string;
}
