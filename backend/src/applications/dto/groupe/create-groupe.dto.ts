import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateGroupeDto {
  @IsString()
  @IsNotEmpty()
  organisationId: string;

  @IsString()
  @IsNotEmpty()
  nom: string;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsString()
  @IsNotEmpty()
  type: string;
}
