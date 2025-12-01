import { IsString, IsNotEmpty, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class OAuthRefreshTokenDto {
  @ApiProperty({
    description: 'Provider OAuth2',
    enum: ['google', 'microsoft'],
    example: 'google',
  })
  @IsString()
  @IsNotEmpty()
  @IsIn(['google', 'microsoft'])
  provider: string;

  @ApiProperty({
    description: 'Refresh Token à utiliser pour obtenir un nouvel access token',
  })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;

  @ApiProperty({ description: "Client ID de l'application OAuth2" })
  @IsString()
  @IsNotEmpty()
  clientId: string;

  @ApiProperty({ description: "Client Secret de l'application OAuth2" })
  @IsString()
  @IsNotEmpty()
  clientSecret: string;
}
