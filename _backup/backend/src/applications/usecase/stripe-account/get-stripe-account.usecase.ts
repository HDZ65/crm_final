import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { StripeAccountRepositoryPort } from '../../../core/port/stripe-account-repository.port';
import { StripeAccountEntity } from '../../../core/domain/stripe-account.entity';
import { StripeAccountResponseDto } from '../../dto/stripe-account';

@Injectable()
export class GetStripeAccountUseCase {
  constructor(
    @Inject('StripeAccountRepositoryPort')
    private readonly repository: StripeAccountRepositoryPort,
  ) {}

  async findById(id: string): Promise<StripeAccountResponseDto> {
    const entity = await this.repository.findById(id);
    if (!entity) {
      throw new NotFoundException(`Compte Stripe non trouvé (ID: ${id})`);
    }
    return this.toResponse(entity);
  }

  async findBySocieteId(societeId: string): Promise<StripeAccountResponseDto> {
    const entity = await this.repository.findBySocieteId(societeId);
    if (!entity) {
      throw new NotFoundException(
        `Aucun compte Stripe configuré pour cette société (ID: ${societeId})`,
      );
    }
    return this.toResponse(entity);
  }

  async findAll(): Promise<StripeAccountResponseDto[]> {
    const entities = await this.repository.findAll();
    return entities.map((entity) => this.toResponse(entity));
  }

  async findAllActive(): Promise<StripeAccountResponseDto[]> {
    const entities = await this.repository.findAllActive();
    return entities.map((entity) => this.toResponse(entity));
  }

  private toResponse(entity: StripeAccountEntity): StripeAccountResponseDto {
    return {
      id: entity.id,
      societeId: entity.societeId,
      nom: entity.nom,
      stripeSecretKeyMasked: StripeAccountResponseDto.maskSecretKey(entity.stripeSecretKey),
      stripePublishableKey: entity.stripePublishableKey,
      hasWebhookSecret: entity.hasWebhookSecret(),
      isTestMode: entity.isTestMode,
      actif: entity.actif,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
