import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateGroupeEntiteDto {
  @IsString()
  @IsNotEmpty()
  groupeId: string;

  @IsString()
  @IsNotEmpty()
  entiteId: string;

  @IsString()
  @IsOptional()
  type?: string; // société, agence, filiale, département, etc.
}
