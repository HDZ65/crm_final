import { Inject, Injectable, ConflictException } from '@nestjs/common';
import type { MultisafepayAccountRepositoryPort } from '../../../core/port/multisafepay-account-repository.port';
import { MultisafepayAccountEntity } from '../../../core/domain/multisafepay-account.entity';
import { CreateMultisafepayAccountDto, MultisafepayAccountResponseDto } from '../../dto/multisafepay-account';

@Injectable()
export class CreateMultisafepayAccountUseCase {
  constructor(
    @Inject('MultisafepayAccountRepositoryPort')
    private readonly repository: MultisafepayAccountRepositoryPort,
  ) {}

  async execute(dto: CreateMultisafepayAccountDto): Promise<MultisafepayAccountResponseDto> {
    // Check if a MultiSafepay account already exists for this societe
    const existing = await this.repository.findBySocieteId(dto.societeId);
    if (existing) {
      throw new ConflictException(
        `Un compte MultiSafepay existe déjà pour cette société (ID: ${dto.societeId})`,
      );
    }

    const entity = new MultisafepayAccountEntity({
      societeId: dto.societeId,
      nom: dto.nom,
      apiKey: dto.apiKey,
      siteId: dto.siteId ?? null,
      secureCode: dto.secureCode ?? null,
      accountId: dto.accountId ?? null,
      environment: dto.environment,
      actif: dto.actif ?? true,
    });

    const created = await this.repository.create(entity);
    return this.toResponse(created);
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
