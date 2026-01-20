import { Inject, Injectable, ConflictException } from '@nestjs/common';
import type { GoCardlessAccountRepositoryPort } from '../../../core/port/gocardless-account-repository.port';
import { GoCardlessAccountEntity } from '../../../core/domain/gocardless-account.entity';
import { CreateGoCardlessAccountDto, GoCardlessAccountResponseDto } from '../../dto/gocardless-account';

@Injectable()
export class CreateGoCardlessAccountUseCase {
  constructor(
    @Inject('GoCardlessAccountRepositoryPort')
    private readonly repository: GoCardlessAccountRepositoryPort,
  ) {}

  async execute(dto: CreateGoCardlessAccountDto): Promise<GoCardlessAccountResponseDto> {
    // Check if a GoCardless account already exists for this societe
    const existing = await this.repository.findBySocieteId(dto.societeId);
    if (existing) {
      throw new ConflictException(
        `Un compte GoCardless existe déjà pour cette société (ID: ${dto.societeId})`,
      );
    }

    const entity = new GoCardlessAccountEntity({
      societeId: dto.societeId,
      nom: dto.nom,
      accessToken: dto.accessToken,
      webhookSecret: dto.webhookSecret ?? null,
      environment: dto.environment,
      actif: dto.actif ?? true,
    });

    const created = await this.repository.create(entity);
    return this.toResponse(created);
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
