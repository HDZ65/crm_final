import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class CommercialDto {
  @ApiProperty({ description: 'Identifiant du commercial (cuid WinLead+)', example: 'clxyz123abc' })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({ description: 'Nom du commercial', example: 'Martin' })
  @IsString()
  @IsNotEmpty()
  nom: string;

  @ApiProperty({ description: 'Prénom du commercial', example: 'Sophie' })
  @IsString()
  @IsNotEmpty()
  prenom: string;

  @ApiProperty({ description: 'Email du commercial', example: 'sophie.martin@winleadplus.com', format: 'email' })
  @IsEmail()
  email: string;
}
