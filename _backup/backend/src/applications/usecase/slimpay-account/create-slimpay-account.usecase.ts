import { Inject, Injectable, ConflictException } from '@nestjs/common';
import type { SlimpayAccountRepositoryPort } from '../../../core/port/slimpay-account-repository.port';
import { SlimpayAccountEntity } from '../../../core/domain/slimpay-account.entity';
import { CreateSlimpayAccountDto, SlimpayAccountResponseDto } from '../../dto/slimpay-account';

@Injectable()
export class CreateSlimpayAccountUseCase {
  constructor(
    @Inject('SlimpayAccountRepositoryPort')
    private readonly repository: SlimpayAccountRepositoryPort,
  ) {}

  async execute(dto: CreateSlimpayAccountDto): Promise<SlimpayAccountResponseDto> {
    // Check if a Slimpay account already exists for this societe
    const existing = await this.repository.findBySocieteId(dto.societeId);
    if (existing) {
      throw new ConflictException(
        `Un compte Slimpay existe déjà pour cette société (ID: ${dto.societeId})`,
      );
    }

    const entity = new SlimpayAccountEntity({
      societeId: dto.societeId,
      nom: dto.nom,
      appId: dto.appId,
      appSecret: dto.appSecret,
      creditorReference: dto.creditorReference,
      environment: dto.environment,
      actif: dto.actif ?? true,
    });

    const created = await this.repository.create(entity);
    return this.toResponse(created);
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
