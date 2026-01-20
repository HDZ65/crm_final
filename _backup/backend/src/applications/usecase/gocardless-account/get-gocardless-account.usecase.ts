import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { GoCardlessAccountRepositoryPort } from '../../../core/port/gocardless-account-repository.port';
import type { GoCardlessAccountEntity } from '../../../core/domain/gocardless-account.entity';
import { GoCardlessAccountResponseDto } from '../../dto/gocardless-account';

@Injectable()
export class GetGoCardlessAccountUseCase {
  constructor(
    @Inject('GoCardlessAccountRepositoryPort')
    private readonly repository: GoCardlessAccountRepositoryPort,
  ) {}

  async findById(id: string): Promise<GoCardlessAccountResponseDto> {
    const entity = await this.repository.findById(id);
    if (!entity) {
      throw new NotFoundException(`Compte GoCardless non trouvé (ID: ${id})`);
    }
    return this.toResponse(entity);
  }

  async findAll(): Promise<GoCardlessAccountResponseDto[]> {
    const entities = await this.repository.findAll();
    return entities.map((entity) => this.toResponse(entity));
  }

  async findBySocieteId(societeId: string): Promise<GoCardlessAccountResponseDto> {
    const entity = await this.repository.findBySocieteId(societeId);
    if (!entity) {
      throw new NotFoundException(
        `Aucun compte GoCardless configuré pour cette société (ID: ${societeId})`,
      );
    }
    return this.toResponse(entity);
  }

  async findAllActive(): Promise<GoCardlessAccountResponseDto[]> {
    const entities = await this.repository.findAllActive();
    return entities.map((entity) => this.toResponse(entity));
  }

  private toResponse(entity: GoCardlessAccountEntity): GoCardlessAccountResponseDto {
    return {
      id: entity.id,
      societeId: entity.societeId,
      nom: entity.nom,
      accessTokenMasked: GoCardlessAccountResponseDto.maskToken(entity.accessToken),
      hasWebhookSecret: !!entity.webhookSecret,
      environment: entity.environment,
      actif: entity.actif,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
