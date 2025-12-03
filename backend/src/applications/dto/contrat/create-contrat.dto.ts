import { IsBoolean, IsInt, IsNotEmpty, IsString, Matches } from 'class-validator';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

  @Matches(UUID_REGEX, { message: 'societeId doit être un UUID valide' })
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
