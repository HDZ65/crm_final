import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { GoogleOAuthService } from '../../../infrastructure/services/google-oauth.service';
import { MicrosoftOAuthService } from '../../../infrastructure/services/microsoft-oauth.service';
import type { BoiteMailRepositoryPort } from '../../../core/port/boite-mail-repository.port';

export interface RefreshTokenResult {
  accessToken: string;
  refreshToken: string;
  expiryDate: Date;
}

@Injectable()
export class RefreshOAuthTokenUseCase {
  constructor(
    private readonly googleOAuthService: GoogleOAuthService,
    private readonly microsoftOAuthService: MicrosoftOAuthService,
    @Inject('BoiteMailRepositoryPort')
    private readonly boiteMailRepository: BoiteMailRepositoryPort,
  ) {}

  /**
   * Rafraîchit le token d'une boîte mail
   */
  async execute(boiteMailId: string): Promise<RefreshTokenResult> {
    const boiteMail = await this.boiteMailRepository.findById(boiteMailId);

    if (!boiteMail) {
      throw new NotFoundException(`BoiteMail with id ${boiteMailId} not found`);
    }

    if (boiteMail.typeConnexion !== 'oauth2') {
      throw new BadRequestException(
        'Cannot refresh token for non-OAuth2 mailbox',
      );
    }

    if (
      !boiteMail.refreshToken ||
      !boiteMail.clientId ||
      !boiteMail.clientSecret
    ) {
      throw new BadRequestException(
        'Missing OAuth2 credentials for token refresh',
      );
    }

    let accessToken: string;
    let refreshToken: string;
    let expiryDate: Date;

    switch (boiteMail.fournisseur) {
      case 'google': {
        const tokens = await this.googleOAuthService.refreshAccessToken(
          boiteMail.refreshToken,
          boiteMail.clientId,
          boiteMail.clientSecret,
        );

        accessToken = tokens.access_token;
        refreshToken = tokens.refresh_token || boiteMail.refreshToken;
        expiryDate = new Date(tokens.expiry_date);
        break;
      }

      case 'microsoft': {
        const tokens = await this.microsoftOAuthService.refreshAccessToken(
          boiteMail.refreshToken,
          boiteMail.clientId,
          boiteMail.clientSecret,
        );

        accessToken = tokens.access_token;
        refreshToken = tokens.refresh_token;
        expiryDate = this.microsoftOAuthService.calculateExpiryDate(
          tokens.expires_in,
        );
        break;
      }

      default:
        throw new BadRequestException(
          `Provider ${boiteMail.fournisseur} not supported`,
        );
    }

    // Mettre à jour la boîte mail avec les nouveaux tokens
    boiteMail.accessToken = accessToken;
    boiteMail.refreshToken = refreshToken;
    boiteMail.tokenExpiration = expiryDate;

    await this.boiteMailRepository.update(boiteMailId, boiteMail);

    return {
      accessToken,
      refreshToken,
      expiryDate,
    };
  }
}
