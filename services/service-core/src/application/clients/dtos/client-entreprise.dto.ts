import { IsString, IsOptional, IsUUID } from 'class-validator';

export class CreateClientEntrepriseDto {
  @IsUUID()
  clientBaseId: string;

  @IsString()
  raisonSociale: string;

  @IsOptional()
  @IsString()
  siret?: string;

  @IsOptional()
  @IsString()
  numeroTva?: string;

  @IsOptional()
  @IsString()
  formeJuridique?: string;
}

export class UpdateClientEntrepriseDto {
  @IsUUID()
  id: string;

  @IsOptional()
  @IsString()
  raisonSociale?: string;

  @IsOptional()
  @IsString()
  siret?: string;

  @IsOptional()
  @IsString()
  numeroTva?: string;

  @IsOptional()
  @IsString()
  formeJuridique?: string;
}

export class ClientEntrepriseResponseDto {
  id: string;
  clientBaseId: string;
  raisonSociale: string;
  siret: string | null;
  numeroTva: string | null;
  formeJuridique: string | null;
  createdAt: Date;
  updatedAt: Date;
}
