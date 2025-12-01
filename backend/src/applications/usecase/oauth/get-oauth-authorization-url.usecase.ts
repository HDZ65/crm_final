import { Injectable, BadRequestException } from '@nestjs/common';
import { GoogleOAuthService } from '../../../infrastructure/services/google-oauth.service';
import { MicrosoftOAuthService } from '../../../infrastructure/services/microsoft-oauth.service';
import type { OAuthAuthorizationUrlDto } from '../../dto/oauth/oauth-authorization-url.dto';

@Injectable()
export class GetOAuthAuthorizationUrlUseCase {
  constructor(
    private readonly googleOAuthService: GoogleOAuthService,
    private readonly microsoftOAuthService: MicrosoftOAuthService,
  ) {}

  execute(dto: OAuthAuthorizationUrlDto): string {
    switch (dto.provider) {
      case 'google':
        return this.googleOAuthService.getAuthorizationUrl(
          dto.clientId,
          dto.clientSecret,
          dto.redirectUri,
        );

      case 'microsoft':
        return this.microsoftOAuthService.getAuthorizationUrl(
          dto.clientId,
          dto.redirectUri,
        );

      default:
        throw new BadRequestException(`Provider ${dto.provider} not supported`);
    }
  }
}
