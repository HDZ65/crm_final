import { IsString, IsNotEmpty, IsIn, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class OAuthExchangeCodeDto {
  @ApiProperty({
    description: 'Provider OAuth2',
    enum: ['google', 'microsoft'],
    example: 'google',
  })
  @IsString()
  @IsNotEmpty()
  @IsIn(['google', 'microsoft'])
  provider: string;

  @ApiProperty({ description: "Code d'autorisation reçu du provider OAuth2" })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ description: "Client ID de l'application OAuth2" })
  @IsString()
  @IsNotEmpty()
  clientId: string;

  @ApiProperty({ description: "Client Secret de l'application OAuth2" })
  @IsString()
  @IsNotEmpty()
  clientSecret: string;

  @ApiProperty({
    description: 'URI de redirection (doit correspondre à celle configurée)',
    example: 'http://localhost:3000/oauth/callback/google',
  })
  @IsUrl()
  @IsNotEmpty()
  redirectUri: string;

  @ApiProperty({
    description: "ID de l'utilisateur qui connecte sa boîte mail",
  })
  @IsString()
  @IsNotEmpty()
  utilisateurId: string;
}

export class OAuthTokensResponseDto {
  @ApiProperty({ description: 'Access Token OAuth2' })
  accessToken: string;

  @ApiProperty({ description: 'Refresh Token OAuth2' })
  refreshToken: string;

  @ApiProperty({ description: "Date d'expiration de l'access token" })
  expiryDate: Date;

  @ApiProperty({ description: "Email de l'utilisateur" })
  userEmail: string;

  @ApiProperty({ description: "Nom de l'utilisateur" })
  userName: string;

  @ApiProperty({
    description: 'Provider OAuth2',
    enum: ['google', 'microsoft'],
  })
  provider: string;

  constructor(
    accessToken: string,
    refreshToken: string,
    expiryDate: Date,
    userEmail: string,
    userName: string,
    provider: string,
  ) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    this.expiryDate = expiryDate;
    this.userEmail = userEmail;
    this.userName = userName;
    this.provider = provider;
  }
}
