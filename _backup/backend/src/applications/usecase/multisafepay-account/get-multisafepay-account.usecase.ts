import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { MultisafepayAccountRepositoryPort } from '../../../core/port/multisafepay-account-repository.port';
import type { MultisafepayAccountEntity } from '../../../core/domain/multisafepay-account.entity';
import { MultisafepayAccountResponseDto } from '../../dto/multisafepay-account';

@Injectable()
export class GetMultisafepayAccountUseCase {
  constructor(
    @Inject('MultisafepayAccountRepositoryPort')
    private readonly repository: MultisafepayAccountRepositoryPort,
  ) {}

  async findById(id: string): Promise<MultisafepayAccountResponseDto> {
    const entity = await this.repository.findById(id);
    if (!entity) {
      throw new NotFoundException(`Compte MultiSafepay non trouvé (ID: ${id})`);
    }
    return this.toResponse(entity);
  }

  async findAll(): Promise<MultisafepayAccountResponseDto[]> {
    const entities = await this.repository.findAll();
    return entities.map((entity) => this.toResponse(entity));
  }

  async findBySocieteId(societeId: string): Promise<MultisafepayAccountResponseDto> {
    const entity = await this.repository.findBySocieteId(societeId);
    if (!entity) {
      throw new NotFoundException(
        `Aucun compte MultiSafepay configuré pour cette société (ID: ${societeId})`,
      );
    }
    return this.toResponse(entity);
  }

  async findAllActive(): Promise<MultisafepayAccountResponseDto[]> {
    const entities = await this.repository.findAllActive();
    return entities.map((entity) => this.toResponse(entity));
  }

  private toResponse(entity: MultisafepayAccountEntity): MultisafepayAccountResponseDto {
    return {
      id: entity.id,
      societeId: entity.societeId,
      nom: entity.nom,
      apiKeyMasked: MultisafepayAccountResponseDto.maskApiKey(entity.apiKey),
      siteId: entity.siteId ?? undefined,
      hasSecureCode: !!entity.secureCode,
      accountId: entity.accountId ?? undefined,
      environment: entity.environment,
      actif: entity.actif,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
