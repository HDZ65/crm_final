import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { PaypalAccountRepositoryPort } from '../../../core/port/paypal-account-repository.port';
import { PaypalAccountEntity } from '../../../core/domain/paypal-account.entity';
import { PaypalAccountResponseDto } from '../../dto/paypal-account';

@Injectable()
export class GetPaypalAccountUseCase {
  constructor(
    @Inject('PaypalAccountRepositoryPort')
    private readonly repository: PaypalAccountRepositoryPort,
  ) {}

  async findById(id: string): Promise<PaypalAccountResponseDto> {
    const entity = await this.repository.findById(id);
    if (!entity) {
      throw new NotFoundException(`Compte PayPal non trouvé (ID: ${id})`);
    }
    return this.toResponse(entity);
  }

  async findBySocieteId(societeId: string): Promise<PaypalAccountResponseDto> {
    const entity = await this.repository.findBySocieteId(societeId);
    if (!entity) {
      throw new NotFoundException(
        `Aucun compte PayPal configuré pour cette société (ID: ${societeId})`,
      );
    }
    return this.toResponse(entity);
  }

  async findAll(): Promise<PaypalAccountResponseDto[]> {
    const entities = await this.repository.findAll();
    return entities.map((entity) => this.toResponse(entity));
  }

  async findAllActive(): Promise<PaypalAccountResponseDto[]> {
    const entities = await this.repository.findAllActive();
    return entities.map((entity) => this.toResponse(entity));
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
