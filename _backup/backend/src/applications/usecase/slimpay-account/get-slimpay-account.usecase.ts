import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { SlimpayAccountRepositoryPort } from '../../../core/port/slimpay-account-repository.port';
import type { SlimpayAccountEntity } from '../../../core/domain/slimpay-account.entity';
import { SlimpayAccountResponseDto } from '../../dto/slimpay-account';

@Injectable()
export class GetSlimpayAccountUseCase {
  constructor(
    @Inject('SlimpayAccountRepositoryPort')
    private readonly repository: SlimpayAccountRepositoryPort,
  ) {}

  async findById(id: string): Promise<SlimpayAccountResponseDto> {
    const entity = await this.repository.findById(id);
    if (!entity) {
      throw new NotFoundException(`Compte Slimpay non trouvé (ID: ${id})`);
    }
    return this.toResponse(entity);
  }

  async findAll(): Promise<SlimpayAccountResponseDto[]> {
    const entities = await this.repository.findAll();
    return entities.map((entity) => this.toResponse(entity));
  }

  async findBySocieteId(societeId: string): Promise<SlimpayAccountResponseDto> {
    const entity = await this.repository.findBySocieteId(societeId);
    if (!entity) {
      throw new NotFoundException(
        `Aucun compte Slimpay configuré pour cette société (ID: ${societeId})`,
      );
    }
    return this.toResponse(entity);
  }

  async findAllActive(): Promise<SlimpayAccountResponseDto[]> {
    const entities = await this.repository.findAllActive();
    return entities.map((entity) => this.toResponse(entity));
  }

  private toResponse(entity: SlimpayAccountEntity): SlimpayAccountResponseDto {
    return {
      id: entity.id,
      societeId: entity.societeId,
      nom: entity.nom,
      appId: entity.appId,
      appSecretMasked: SlimpayAccountResponseDto.maskSecret(entity.appSecret),
      creditorReference: entity.creditorReference,
      environment: entity.environment,
      actif: entity.actif,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
