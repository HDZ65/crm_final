/**
 * Email Providers - BoiteMail & OAuth (Google, Microsoft)
 * Regroupement des providers liés aux boites mail et OAuth
 */

import { CreateBoiteMailUseCase } from '../../../../applications/usecase/boite-mail/create-boite-mail.usecase';
import { GetBoiteMailUseCase } from '../../../../applications/usecase/boite-mail/get-boite-mail.usecase';
import { UpdateBoiteMailUseCase } from '../../../../applications/usecase/boite-mail/update-boite-mail.usecase';
import { DeleteBoiteMailUseCase } from '../../../../applications/usecase/boite-mail/delete-boite-mail.usecase';
import { TypeOrmBoiteMailRepository } from '../../../repositories/typeorm-boite-mail.repository';

import { GetOAuthAuthorizationUrlUseCase } from '../../../../applications/usecase/oauth/get-oauth-authorization-url.usecase';
import { ExchangeOAuthCodeUseCase } from '../../../../applications/usecase/oauth/exchange-oauth-code.usecase';
import { RefreshOAuthTokenUseCase } from '../../../../applications/usecase/oauth/refresh-oauth-token.usecase';

import { GoogleOAuthService } from '../../../services/google-oauth.service';
import { MicrosoftOAuthService } from '../../../services/microsoft-oauth.service';

export const EMAIL_PROVIDERS = [
  // BoiteMail Use Cases
  CreateBoiteMailUseCase,
  GetBoiteMailUseCase,
  UpdateBoiteMailUseCase,
  DeleteBoiteMailUseCase,

  // BoiteMail Repository
  {
    provide: 'BoiteMailRepositoryPort',
    useClass: TypeOrmBoiteMailRepository,
  },

  // OAuth Use Cases
  GetOAuthAuthorizationUrlUseCase,
  ExchangeOAuthCodeUseCase,
  RefreshOAuthTokenUseCase,

  // OAuth Services
  GoogleOAuthService,
  MicrosoftOAuthService,
];
