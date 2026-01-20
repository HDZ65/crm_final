import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { StripeAccountRepositoryPort } from '../../../core/port/stripe-account-repository.port';
import { StripeAccountEntity } from '../../../core/domain/stripe-account.entity';
import { UpdateStripeAccountDto, StripeAccountResponseDto } from '../../dto/stripe-account';

@Injectable()
export class UpdateStripeAccountUseCase {
  constructor(
    @Inject('StripeAccountRepositoryPort')
    private readonly repository: StripeAccountRepositoryPort,
  ) {}

  async execute(id: string, dto: UpdateStripeAccountDto): Promise<StripeAccountResponseDto> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Compte Stripe non trouvé (ID: ${id})`);
    }

    // If updating secret key, auto-detect test mode if not explicitly set
    let isTestMode = dto.isTestMode;
    if (dto.stripeSecretKey && isTestMode === undefined) {
      isTestMode = dto.stripeSecretKey.startsWith('sk_test_');
    }

    const updateData: Partial<StripeAccountEntity> = {};

    if (dto.nom !== undefined) updateData.nom = dto.nom;
    if (dto.stripeSecretKey !== undefined) updateData.stripeSecretKey = dto.stripeSecretKey;
    if (dto.stripePublishableKey !== undefined)
      updateData.stripePublishableKey = dto.stripePublishableKey;
    if (dto.stripeWebhookSecret !== undefined)
      updateData.stripeWebhookSecret = dto.stripeWebhookSecret;
    if (isTestMode !== undefined) updateData.isTestMode = isTestMode;
    if (dto.actif !== undefined) updateData.actif = dto.actif;

    const updated = await this.repository.update(id, updateData);
    return this.toResponse(updated);
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
