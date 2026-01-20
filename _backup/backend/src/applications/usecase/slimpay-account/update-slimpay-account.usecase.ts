import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { SlimpayAccountRepositoryPort } from '../../../core/port/slimpay-account-repository.port';
import { SlimpayAccountEntity } from '../../../core/domain/slimpay-account.entity';
import { UpdateSlimpayAccountDto, SlimpayAccountResponseDto } from '../../dto/slimpay-account';

@Injectable()
export class UpdateSlimpayAccountUseCase {
  constructor(
    @Inject('SlimpayAccountRepositoryPort')
    private readonly repository: SlimpayAccountRepositoryPort,
  ) {}

  async execute(id: string, dto: UpdateSlimpayAccountDto): Promise<SlimpayAccountResponseDto> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Compte Slimpay non trouvé (ID: ${id})`);
    }

    const updateData: Partial<SlimpayAccountEntity> = {};

    if (dto.nom !== undefined) updateData.nom = dto.nom;
    if (dto.appId !== undefined) updateData.appId = dto.appId;
    if (dto.appSecret !== undefined) updateData.appSecret = dto.appSecret;
    if (dto.creditorReference !== undefined) updateData.creditorReference = dto.creditorReference;
    if (dto.environment !== undefined) updateData.environment = dto.environment;
    if (dto.actif !== undefined) updateData.actif = dto.actif;

    const updated = await this.repository.update(id, updateData);
    return this.toResponse(updated);
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
