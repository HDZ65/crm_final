import { Inject, Injectable, ConflictException } from '@nestjs/common';
import type { PaypalAccountRepositoryPort } from '../../../core/port/paypal-account-repository.port';
import { PaypalAccountEntity } from '../../../core/domain/paypal-account.entity';
import { CreatePaypalAccountDto, PaypalAccountResponseDto } from '../../dto/paypal-account';

@Injectable()
export class CreatePaypalAccountUseCase {
  constructor(
    @Inject('PaypalAccountRepositoryPort')
    private readonly repository: PaypalAccountRepositoryPort,
  ) {}

  async execute(dto: CreatePaypalAccountDto): Promise<PaypalAccountResponseDto> {
    // Check if a PayPal account already exists for this societe
    const existing = await this.repository.findBySocieteId(dto.societeId);
    if (existing) {
      throw new ConflictException(
        `Un compte PayPal existe déjà pour cette société (ID: ${dto.societeId})`,
      );
    }

    const entity = new PaypalAccountEntity({
      societeId: dto.societeId,
      nom: dto.nom,
      clientId: dto.clientId,
      clientSecret: dto.clientSecret,
      webhookId: dto.webhookId ?? null,
      environment: dto.environment,
      actif: dto.actif ?? true,
    });

    const created = await this.repository.create(entity);
    return this.toResponse(created);
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
