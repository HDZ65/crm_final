import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Param,
  Get,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public, Roles } from 'nest-keycloak-connect';
import {
  OAuthAuthorizationUrlDto,
  OAuthAuthorizationUrlResponseDto,
} from '../../../../../applications/dto/oauth/oauth-authorization-url.dto';
import {
  OAuthExchangeCodeDto,
  OAuthTokensResponseDto,
} from '../../../../../applications/dto/oauth/oauth-exchange-code.dto';
import { GetOAuthAuthorizationUrlUseCase } from '../../../../../applications/usecase/oauth/get-oauth-authorization-url.usecase';
import { ExchangeOAuthCodeUseCase } from '../../../../../applications/usecase/oauth/exchange-oauth-code.usecase';
import { RefreshOAuthTokenUseCase } from '../../../../../applications/usecase/oauth/refresh-oauth-token.usecase';

@ApiTags('OAuth2')
@Controller('oauth')
export class OAuthController {
  constructor(
    private readonly getAuthUrlUseCase: GetOAuthAuthorizationUrlUseCase,
    private readonly exchangeCodeUseCase: ExchangeOAuthCodeUseCase,
    private readonly refreshTokenUseCase: RefreshOAuthTokenUseCase,
  ) {}

  @Roles({ roles: ['realm:user'] })
  @Post('authorization-url')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Générer l'URL d'autorisation OAuth2",
    description:
      "Génère l'URL d'autorisation pour Google ou Microsoft OAuth2. " +
      "L'utilisateur doit être redirigé vers cette URL pour autoriser l'accès à sa boîte mail.",
  })
  @ApiResponse({
    status: 200,
    description: "L'URL d'autorisation a été générée avec succès",
  })
  getAuthorizationUrl(
    @Body() dto: OAuthAuthorizationUrlDto,
  ): OAuthAuthorizationUrlResponseDto {
    const authorizationUrl = this.getAuthUrlUseCase.execute(dto);
    return new OAuthAuthorizationUrlResponseDto(authorizationUrl, dto.provider);
  }

  @Roles({ roles: ['realm:user'] })
  @Post('exchange-code')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: "Échanger le code d'autorisation contre des tokens",
    description:
      "Échange le code d'autorisation reçu du provider OAuth2 contre des tokens d'accès. " +
      "Crée automatiquement une boîte mail associée à l'utilisateur.",
  })
  @ApiResponse({
    status: 201,
    description:
      'Les tokens ont été obtenus et la boîte mail a été créée avec succès',
  })
  async exchangeCode(
    @Body() dto: OAuthExchangeCodeDto,
  ): Promise<OAuthTokensResponseDto> {
    const result = await this.exchangeCodeUseCase.execute(dto);

    return new OAuthTokensResponseDto(
      result.accessToken,
      result.refreshToken,
      result.expiryDate,
      result.userEmail,
      result.userName,
      dto.provider,
    );
  }

  @Roles({ roles: ['realm:user'] })
  @Post('refresh-token/:boiteMailId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Rafraîchir le token d'accès",
    description:
      "Rafraîchit le token d'accès d'une boîte mail OAuth2 en utilisant le refresh token. " +
      'Met automatiquement à jour la boîte mail avec les nouveaux tokens.',
  })
  @ApiResponse({
    status: 200,
    description: 'Le token a été rafraîchi avec succès',
  })
  async refreshToken(
    @Param('boiteMailId') boiteMailId: string,
  ): Promise<OAuthTokensResponseDto> {
    const result = await this.refreshTokenUseCase.execute(boiteMailId);

    return new OAuthTokensResponseDto(
      result.accessToken,
      result.refreshToken,
      result.expiryDate,
      '', // Email not returned on refresh
      '', // Name not returned on refresh
      '', // Provider not returned on refresh
    );
  }

  @Public()
  @Get('callback/google')
  @ApiOperation({
    summary: 'Callback Google OAuth2 (à implémenter côté frontend)',
    description:
      'Ce endpoint est un exemple de callback. En production, le frontend doit capturer ' +
      "le code dans l'URL de callback et appeler /oauth/exchange-code.",
  })
  googleCallback(): { message: string } {
    return {
      message:
        'This is a placeholder. The frontend should handle the OAuth callback and exchange the code.',
    };
  }

  @Public()
  @Get('callback/microsoft')
  @ApiOperation({
    summary: 'Callback Microsoft OAuth2 (à implémenter côté frontend)',
    description:
      'Ce endpoint est un exemple de callback. En production, le frontend doit capturer ' +
      "le code dans l'URL de callback et appeler /oauth/exchange-code.",
  })
  microsoftCallback(): { message: string } {
    return {
      message:
        'This is a placeholder. The frontend should handle the OAuth callback and exchange the code.',
    };
  }
}
