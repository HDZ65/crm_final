import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Controllers
import { BoiteMailController } from './controllers/boite-mail.controller';
import { OAuthController } from './controllers/oauth.controller';

// Entities
import { BoiteMailEntity } from '../../../db/entities/boite-mail.entity';

// Repositories
import { TypeOrmBoiteMailRepository } from '../../../repositories/typeorm-boite-mail.repository';

// Services
import { GoogleOAuthService } from '../../../services/google-oauth.service';
import { MicrosoftOAuthService } from '../../../services/microsoft-oauth.service';

// Use Cases - BoiteMail
import { CreateBoiteMailUseCase } from '../../../../applications/usecase/boite-mail/create-boite-mail.usecase';
import { GetBoiteMailUseCase } from '../../../../applications/usecase/boite-mail/get-boite-mail.usecase';
import { UpdateBoiteMailUseCase } from '../../../../applications/usecase/boite-mail/update-boite-mail.usecase';
import { DeleteBoiteMailUseCase } from '../../../../applications/usecase/boite-mail/delete-boite-mail.usecase';

// Use Cases - OAuth
import { GetOAuthAuthorizationUrlUseCase } from '../../../../applications/usecase/oauth/get-oauth-authorization-url.usecase';
import { ExchangeOAuthCodeUseCase } from '../../../../applications/usecase/oauth/exchange-oauth-code.usecase';
import { RefreshOAuthTokenUseCase } from '../../../../applications/usecase/oauth/refresh-oauth-token.usecase';

@Module({
  imports: [
    TypeOrmModule.forFeature([BoiteMailEntity]),
  ],
  controllers: [
    BoiteMailController,
    OAuthController,
  ],
  providers: [
    // BoiteMail Repository
    {
      provide: 'BoiteMailRepositoryPort',
      useClass: TypeOrmBoiteMailRepository,
    },

    // Use Cases - BoiteMail
    CreateBoiteMailUseCase,
    GetBoiteMailUseCase,
    UpdateBoiteMailUseCase,
    DeleteBoiteMailUseCase,

    // OAuth Services
    GoogleOAuthService,
    MicrosoftOAuthService,

    // Use Cases - OAuth
    GetOAuthAuthorizationUrlUseCase,
    ExchangeOAuthCodeUseCase,
    RefreshOAuthTokenUseCase,
  ],
  exports: [
    'BoiteMailRepositoryPort',
    GoogleOAuthService,
    MicrosoftOAuthService,
  ],
})
export class EmailModule {}
