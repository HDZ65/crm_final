import { IsString, IsNotEmpty, IsUUID, IsBoolean, IsOptional, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSlimpayAccountDto {
  @ApiProperty({ description: 'ID de la société' })
  @IsUUID()
  @IsNotEmpty()
  societeId: string;

  @ApiProperty({ description: 'Nom du compte Slimpay' })
  @IsString()
  @IsNotEmpty()
  nom: string;

  @ApiProperty({ description: 'Application ID OAuth2' })
  @IsString()
  @IsNotEmpty()
  appId: string;

  @ApiProperty({ description: 'Application Secret OAuth2' })
  @IsString()
  @IsNotEmpty()
  appSecret: string;

  @ApiProperty({ description: 'Référence du créancier SEPA' })
  @IsString()
  @IsNotEmpty()
  creditorReference: string;

  @ApiProperty({ description: 'Environnement Slimpay', enum: ['preprod', 'production'] })
  @IsIn(['preprod', 'production'])
  @IsNotEmpty()
  environment: 'preprod' | 'production';

  @ApiPropertyOptional({ description: 'Compte actif', default: true })
  @IsBoolean()
  @IsOptional()
  actif?: boolean;
}
