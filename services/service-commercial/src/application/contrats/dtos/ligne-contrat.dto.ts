import { IsUUID, IsNumber } from 'class-validator';

export class CreateLigneContratDto {
  @IsUUID()
  contratId: string;

  @IsUUID()
  produitId: string;

  @IsUUID()
  periodeFacturationId: string;

  @IsNumber()
  quantite: number;

  @IsNumber()
  prixUnitaire: number;
}

export class UpdateLigneContratDto {
  @IsUUID()
  id: string;

  @IsNumber()
  quantite?: number;

  @IsNumber()
  prixUnitaire?: number;
}

export class LigneContratResponseDto {
  id: string;
  contratId: string;
  produitId: string;
  periodeFacturationId: string;
  quantite: number;
  prixUnitaire: number;
  createdAt: Date;
  updatedAt: Date;
}
