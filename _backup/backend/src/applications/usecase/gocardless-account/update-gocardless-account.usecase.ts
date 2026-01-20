import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { GoCardlessAccountRepositoryPort } from '../../../core/port/gocardless-account-repository.port';
import { GoCardlessAccountEntity } from '../../../core/domain/gocardless-account.entity';
import { UpdateGoCardlessAccountDto, GoCardlessAccountResponseDto } from '../../dto/gocardless-account';

@Injectable()
export class UpdateGoCardlessAccountUseCase {
  constructor(
    @Inject('GoCardlessAccountRepositoryPort')
    private readonly repository: GoCardlessAccountRepositoryPort,
  ) {}

  async execute(id: string, dto: UpdateGoCardlessAccountDto): Promise<GoCardlessAccountResponseDto> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Compte GoCardless non trouvé (ID: ${id})`);
    }

    const updateData: Partial<GoCardlessAccountEntity> = {};

    if (dto.nom !== undefined) updateData.nom = dto.nom;
    if (dto.accessToken !== undefined) updateData.accessToken = dto.accessToken;
    if (dto.webhookSecret !== undefined) updateData.webhookSecret = dto.webhookSecret;
    if (dto.environment !== undefined) updateData.environment = dto.environment;
    if (dto.actif !== undefined) updateData.actif = dto.actif;

    const updated = await this.repository.update(id, updateData);
    return this.toResponse(updated);
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
