import { IsString, IsNotEmpty, IsUUID, IsBoolean, IsOptional, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateEmerchantpayAccountDto {
  @ApiProperty({ description: 'ID de la société' })
  @IsUUID()
  @IsNotEmpty()
  societeId: string;

  @ApiProperty({ description: 'Nom du compte Emerchantpay' })
  @IsString()
  @IsNotEmpty()
  nom: string;

  @ApiProperty({ description: 'Nom d\'utilisateur Genesis Gateway' })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({ description: 'Mot de passe Genesis Gateway' })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty({ description: 'Terminal token pour les transactions' })
  @IsString()
  @IsNotEmpty()
  terminalToken: string;

  @ApiProperty({ description: 'Environnement Emerchantpay', enum: ['staging', 'production'] })
  @IsIn(['staging', 'production'])
  @IsNotEmpty()
  environment: 'staging' | 'production';

  @ApiPropertyOptional({ description: 'Compte actif', default: true })
  @IsBoolean()
  @IsOptional()
  actif?: boolean;
}
