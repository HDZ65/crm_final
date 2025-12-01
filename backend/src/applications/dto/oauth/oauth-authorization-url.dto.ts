import { IsString, IsNotEmpty, IsIn, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class OAuthAuthorizationUrlDto {
  @ApiProperty({
    description: 'Provider OAuth2',
    enum: ['google', 'microsoft'],
    example: 'google',
  })
  @IsString()
  @IsNotEmpty()
  @IsIn(['google', 'microsoft'])
  provider: string;

  @ApiProperty({ description: "Client ID de l'application OAuth2" })
  @IsString()
  @IsNotEmpty()
  clientId: string;

  @ApiProperty({ description: "Client Secret de l'application OAuth2" })
  @IsString()
  @IsNotEmpty()
  clientSecret: string;

  @ApiProperty({
    description: 'URI de redirection après authentification',
    example: 'http://localhost:3000/oauth/callback/google',
  })
  @IsUrl()
  @IsNotEmpty()
  redirectUri: string;
}

export class OAuthAuthorizationUrlResponseDto {
  @ApiProperty({ description: "URL d'autorisation OAuth2" })
  authorizationUrl: string;

  @ApiProperty({
    description: 'Provider OAuth2',
    enum: ['google', 'microsoft'],
  })
  provider: string;

  constructor(authorizationUrl: string, provider: string) {
    this.authorizationUrl = authorizationUrl;
    this.provider = provider;
  }
}
