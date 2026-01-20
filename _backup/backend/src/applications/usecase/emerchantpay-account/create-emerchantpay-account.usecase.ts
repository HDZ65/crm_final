import { Inject, Injectable, ConflictException } from '@nestjs/common';
import type { EmerchantpayAccountRepositoryPort } from '../../../core/port/emerchantpay-account-repository.port';
import { EmerchantpayAccountEntity } from '../../../core/domain/emerchantpay-account.entity';
import { CreateEmerchantpayAccountDto, EmerchantpayAccountResponseDto } from '../../dto/emerchantpay-account';

@Injectable()
export class CreateEmerchantpayAccountUseCase {
  constructor(
    @Inject('EmerchantpayAccountRepositoryPort')
    private readonly repository: EmerchantpayAccountRepositoryPort,
  ) {}

  async execute(dto: CreateEmerchantpayAccountDto): Promise<EmerchantpayAccountResponseDto> {
    // Check if an Emerchantpay account already exists for this societe
    const existing = await this.repository.findBySocieteId(dto.societeId);
    if (existing) {
      throw new ConflictException(
        `Un compte Emerchantpay existe déjà pour cette société (ID: ${dto.societeId})`,
      );
    }

    const entity = new EmerchantpayAccountEntity({
      societeId: dto.societeId,
      nom: dto.nom,
      username: dto.username,
      password: dto.password,
      terminalToken: dto.terminalToken,
      environment: dto.environment,
      actif: dto.actif ?? true,
    });

    const created = await this.repository.create(entity);
    return this.toResponse(created);
  }

  private toResponse(entity: EmerchantpayAccountEntity): EmerchantpayAccountResponseDto {
    return {
      id: entity.id,
      societeId: entity.societeId,
      nom: entity.nom,
      username: entity.username,
      passwordMasked: EmerchantpayAccountResponseDto.maskPassword(),
      terminalTokenMasked: EmerchantpayAccountResponseDto.maskToken(entity.terminalToken),
      environment: entity.environment,
      actif: entity.actif,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
