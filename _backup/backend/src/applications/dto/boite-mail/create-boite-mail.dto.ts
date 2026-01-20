import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsBoolean,
  IsOptional,
  IsNumber,
  IsIn,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBoiteMailDto {
  @ApiProperty({
    description: 'Nom de la boîte mail',
    example: 'Ma boîte Gmail',
  })
  @IsString()
  @IsNotEmpty()
  nom: string;

  @ApiProperty({ description: 'Adresse email', example: 'user@example.com' })
  @IsEmail()
  @IsNotEmpty()
  adresseEmail: string;

  @ApiProperty({
    description: 'Fournisseur de messagerie',
    enum: ['gmail', 'outlook', 'smtp', 'exchange', 'other'],
    example: 'gmail',
  })
  @IsString()
  @IsNotEmpty()
  @IsIn(['gmail', 'outlook', 'smtp', 'exchange', 'other'])
  fournisseur: string;

  @ApiProperty({
    description: 'Type de connexion',
    enum: ['oauth2', 'smtp', 'imap'],
    example: 'oauth2',
  })
  @IsString()
  @IsNotEmpty()
  @IsIn(['oauth2', 'smtp', 'imap'])
  typeConnexion: string;

  // Configuration SMTP/IMAP
  @ApiPropertyOptional({
    description: 'Serveur SMTP',
    example: 'smtp.gmail.com',
  })
  @IsOptional()
  @IsString()
  serveurSMTP?: string;

  @ApiPropertyOptional({ description: 'Port SMTP', example: 587 })
  @IsOptional()
  @IsNumber()
  portSMTP?: number;

  @ApiPropertyOptional({
    description: 'Serveur IMAP',
    example: 'imap.gmail.com',
  })
  @IsOptional()
  @IsString()
  serveurIMAP?: string;

  @ApiPropertyOptional({ description: 'Port IMAP', example: 993 })
  @IsOptional()
  @IsNumber()
  portIMAP?: number;

  @ApiPropertyOptional({ description: 'Utilise SSL', example: true })
  @IsOptional()
  @IsBoolean()
  utiliseSsl?: boolean;

  @ApiPropertyOptional({ description: 'Utilise TLS', example: true })
  @IsOptional()
  @IsBoolean()
  utiliseTls?: boolean;

  // Credentials
  @ApiPropertyOptional({ description: "Nom d'utilisateur pour SMTP/IMAP" })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiPropertyOptional({ description: 'Mot de passe pour SMTP/IMAP' })
  @IsOptional()
  @IsString()
  motDePasse?: string;

  // OAuth2
  @ApiPropertyOptional({ description: 'Client ID OAuth2' })
  @IsOptional()
  @IsString()
  clientId?: string;

  @ApiPropertyOptional({ description: 'Client Secret OAuth2' })
  @IsOptional()
  @IsString()
  clientSecret?: string;

  @ApiPropertyOptional({ description: 'Refresh Token OAuth2' })
  @IsOptional()
  @IsString()
  refreshToken?: string;

  // Signature
  @ApiPropertyOptional({ description: 'Signature au format HTML' })
  @IsOptional()
  @IsString()
  signatureHtml?: string;

  @ApiPropertyOptional({ description: 'Signature au format texte' })
  @IsOptional()
  @IsString()
  signatureTexte?: string;

  // Paramètres
  @ApiProperty({ description: 'Boîte mail par défaut', example: true })
  @IsBoolean()
  estParDefaut: boolean;

  @ApiProperty({ description: 'Boîte mail active', example: true })
  @IsBoolean()
  actif: boolean;

  @ApiProperty({ description: "ID de l'utilisateur propriétaire" })
  @IsString()
  @IsNotEmpty()
  utilisateurId: string;
}
