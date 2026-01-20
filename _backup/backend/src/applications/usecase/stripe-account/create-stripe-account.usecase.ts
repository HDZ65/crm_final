import { Inject, Injectable, ConflictException } from '@nestjs/common';
import type { StripeAccountRepositoryPort } from '../../../core/port/stripe-account-repository.port';
import { StripeAccountEntity } from '../../../core/domain/stripe-account.entity';
import { CreateStripeAccountDto, StripeAccountResponseDto } from '../../dto/stripe-account';

@Injectable()
export class CreateStripeAccountUseCase {
  constructor(
    @Inject('StripeAccountRepositoryPort')
    private readonly repository: StripeAccountRepositoryPort,
  ) {}

  async execute(dto: CreateStripeAccountDto): Promise<StripeAccountResponseDto> {
    // Check if a Stripe account already exists for this societe
    const existing = await this.repository.findBySocieteId(dto.societeId);
    if (existing) {
      throw new ConflictException(
        `Un compte Stripe existe déjà pour cette société (ID: ${dto.societeId})`,
      );
    }

    // Determine if test mode based on keys
    const isTestMode = dto.isTestMode ?? dto.stripeSecretKey.startsWith('sk_test_');

    const entity = new StripeAccountEntity({
      societeId: dto.societeId,
      nom: dto.nom,
      stripeSecretKey: dto.stripeSecretKey,
      stripePublishableKey: dto.stripePublishableKey,
      stripeWebhookSecret: dto.stripeWebhookSecret ?? null,
      isTestMode,
      actif: dto.actif ?? true,
    });

    const created = await this.repository.create(entity);
    return this.toResponse(created);
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
