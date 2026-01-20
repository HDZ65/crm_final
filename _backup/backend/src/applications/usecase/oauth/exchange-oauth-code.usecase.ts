import { Injectable, BadRequestException, Inject } from '@nestjs/common';
import { GoogleOAuthService } from '../../../infrastructure/services/google-oauth.service';
import { MicrosoftOAuthService } from '../../../infrastructure/services/microsoft-oauth.service';
import type { OAuthExchangeCodeDto } from '../../dto/oauth/oauth-exchange-code.dto';
import type { BoiteMailRepositoryPort } from '../../../core/port/boite-mail-repository.port';
import { BoiteMailEntity } from '../../../core/domain/boite-mail.entity';

export interface OAuthExchangeResult {
  accessToken: string;
  refreshToken: string;
  expiryDate: Date;
  userEmail: string;
  userName: string;
  boiteMailId: string;
}

@Injectable()
export class ExchangeOAuthCodeUseCase {
  constructor(
    private readonly googleOAuthService: GoogleOAuthService,
    private readonly microsoftOAuthService: MicrosoftOAuthService,
    @Inject('BoiteMailRepositoryPort')
    private readonly boiteMailRepository: BoiteMailRepositoryPort,
  ) {}

  async execute(dto: OAuthExchangeCodeDto): Promise<OAuthExchangeResult> {
    let accessToken: string;
    let refreshToken: string;
    let expiryDate: Date;
    let userEmail: string;
    let userName: string;

    switch (dto.provider) {
      case 'google': {
        const tokens = await this.googleOAuthService.getTokensFromCode(
          dto.code,
          dto.clientId,
          dto.clientSecret,
          dto.redirectUri,
        );

        const userInfo = await this.googleOAuthService.getUserInfo(
          tokens.access_token,
          dto.clientId,
          dto.clientSecret,
        );

        accessToken = tokens.access_token;
        refreshToken = tokens.refresh_token || '';
        expiryDate = new Date(tokens.expiry_date);
        userEmail = userInfo.email;
        userName = userInfo.name;
        break;
      }

      case 'microsoft': {
        const tokens = await this.microsoftOAuthService.getTokensFromCode(
          dto.code,
          dto.clientId,
          dto.clientSecret,
          dto.redirectUri,
        );

        const userInfo = await this.microsoftOAuthService.getUserInfo(
          tokens.access_token,
        );

        accessToken = tokens.access_token;
        refreshToken = tokens.refresh_token;
        expiryDate = this.microsoftOAuthService.calculateExpiryDate(
          tokens.expires_in,
        );
        userEmail = userInfo.email;
        userName = userInfo.displayName;
        break;
      }

      default:
        throw new BadRequestException(`Provider ${dto.provider} not supported`);
    }

    // Créer ou mettre à jour la boîte mail
    const boiteMail = new BoiteMailEntity({
      nom: `${dto.provider} - ${userEmail}`,
      adresseEmail: userEmail,
      fournisseur: dto.provider,
      typeConnexion: 'oauth2',
      clientId: dto.clientId,
      clientSecret: dto.clientSecret,
      accessToken: accessToken,
      refreshToken: refreshToken,
      tokenExpiration: expiryDate,
      estParDefaut: false,
      actif: true,
      utilisateurId: dto.utilisateurId,
    });

    const savedBoiteMail = await this.boiteMailRepository.create(boiteMail);

    return {
      accessToken,
      refreshToken,
      expiryDate,
      userEmail,
      userName,
      boiteMailId: savedBoiteMail.id,
    };
  }
}
