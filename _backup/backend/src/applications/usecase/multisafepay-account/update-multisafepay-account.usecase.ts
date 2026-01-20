import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { MultisafepayAccountRepositoryPort } from '../../../core/port/multisafepay-account-repository.port';
import { MultisafepayAccountEntity } from '../../../core/domain/multisafepay-account.entity';
import { UpdateMultisafepayAccountDto, MultisafepayAccountResponseDto } from '../../dto/multisafepay-account';

@Injectable()
export class UpdateMultisafepayAccountUseCase {
  constructor(
    @Inject('MultisafepayAccountRepositoryPort')
    private readonly repository: MultisafepayAccountRepositoryPort,
  ) {}

  async execute(id: string, dto: UpdateMultisafepayAccountDto): Promise<MultisafepayAccountResponseDto> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Compte MultiSafepay non trouvé (ID: ${id})`);
    }

    const updateData: Partial<MultisafepayAccountEntity> = {};

    if (dto.nom !== undefined) updateData.nom = dto.nom;
    if (dto.apiKey !== undefined) updateData.apiKey = dto.apiKey;
    if (dto.siteId !== undefined) updateData.siteId = dto.siteId;
    if (dto.secureCode !== undefined) updateData.secureCode = dto.secureCode;
    if (dto.accountId !== undefined) updateData.accountId = dto.accountId;
    if (dto.environment !== undefined) updateData.environment = dto.environment;
    if (dto.actif !== undefined) updateData.actif = dto.actif;

    const updated = await this.repository.update(id, updateData);
    return this.toResponse(updated);
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
