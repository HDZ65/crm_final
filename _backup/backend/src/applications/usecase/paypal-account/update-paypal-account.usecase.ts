import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { PaypalAccountRepositoryPort } from '../../../core/port/paypal-account-repository.port';
import { PaypalAccountEntity } from '../../../core/domain/paypal-account.entity';
import { UpdatePaypalAccountDto, PaypalAccountResponseDto } from '../../dto/paypal-account';

@Injectable()
export class UpdatePaypalAccountUseCase {
  constructor(
    @Inject('PaypalAccountRepositoryPort')
    private readonly repository: PaypalAccountRepositoryPort,
  ) {}

  async execute(id: string, dto: UpdatePaypalAccountDto): Promise<PaypalAccountResponseDto> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Compte PayPal non trouvé (ID: ${id})`);
    }

    const updateData: Partial<PaypalAccountEntity> = {};

    if (dto.nom !== undefined) updateData.nom = dto.nom;
    if (dto.clientId !== undefined) updateData.clientId = dto.clientId;
    if (dto.clientSecret !== undefined) updateData.clientSecret = dto.clientSecret;
    if (dto.webhookId !== undefined) updateData.webhookId = dto.webhookId;
    if (dto.environment !== undefined) updateData.environment = dto.environment;
    if (dto.actif !== undefined) updateData.actif = dto.actif;

    const updated = await this.repository.update(id, updateData);
    return this.toResponse(updated);
  }

  private toResponse(entity: PaypalAccountEntity): PaypalAccountResponseDto {
    return {
      id: entity.id,
      societeId: entity.societeId,
      nom: entity.nom,
      clientIdMasked: PaypalAccountResponseDto.maskClientId(entity.clientId),
      hasWebhookId: entity.hasWebhookId(),
      environment: entity.environment,
      actif: entity.actif,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
