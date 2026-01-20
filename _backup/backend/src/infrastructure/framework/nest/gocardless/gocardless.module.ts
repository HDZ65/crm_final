import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Controllers
import { GoCardlessController } from './controllers/gocardless.controller';
import { GoCardlessWebhookController } from './controllers/gocardless-webhook.controller';

// Entity
import { GoCardlessMandateEntity } from '../../../db/entities/gocardless-mandate.entity';

// Repository
import { TypeOrmGoCardlessMandateRepository } from '../../../repositories/typeorm-gocardless-mandate.repository';

// Service
import { GoCardlessService } from '../../../services/gocardless.service';

// Use Cases
import { SetupMandateUseCase } from '../../../../applications/usecase/gocardless/setup-mandate.usecase';
import { CreateGoCardlessMandateUseCase } from '../../../../applications/usecase/gocardless/create-gocardless-mandate.usecase';
import { GetGoCardlessMandateUseCase } from '../../../../applications/usecase/gocardless/get-gocardless-mandate.usecase';
import { UpdateGoCardlessMandateUseCase } from '../../../../applications/usecase/gocardless/update-gocardless-mandate.usecase';
import { DeleteGoCardlessMandateUseCase } from '../../../../applications/usecase/gocardless/delete-gocardless-mandate.usecase';
import { CreateGoCardlessPaymentUseCase } from '../../../../applications/usecase/gocardless/create-gocardless-payment.usecase';
import { CreateGoCardlessSubscriptionUseCase } from '../../../../applications/usecase/gocardless/create-gocardless-subscription.usecase';
import { CancelGoCardlessSubscriptionUseCase } from '../../../../applications/usecase/gocardless/cancel-gocardless-subscription.usecase';
import { ProcessWebhookUseCase } from '../../../../applications/usecase/gocardless/process-webhook.usecase';

@Module({
  imports: [TypeOrmModule.forFeature([GoCardlessMandateEntity])],
  controllers: [GoCardlessController, GoCardlessWebhookController],
  providers: [
    // Service
    GoCardlessService,

    // Repository
    {
      provide: 'GoCardlessMandateRepositoryPort',
      useClass: TypeOrmGoCardlessMandateRepository,
    },

    // Use Cases
    SetupMandateUseCase,
    CreateGoCardlessMandateUseCase,
    GetGoCardlessMandateUseCase,
    UpdateGoCardlessMandateUseCase,
    DeleteGoCardlessMandateUseCase,
    CreateGoCardlessPaymentUseCase,
    CreateGoCardlessSubscriptionUseCase,
    CancelGoCardlessSubscriptionUseCase,
    ProcessWebhookUseCase,
  ],
  exports: [
    GoCardlessService,
    'GoCardlessMandateRepositoryPort',
    GetGoCardlessMandateUseCase,
    CreateGoCardlessPaymentUseCase,
    CreateGoCardlessSubscriptionUseCase,
  ],
})
export class GoCardlessModule {}
