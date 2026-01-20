import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { EmerchantpayAccountRepositoryPort } from '../../../core/port/emerchantpay-account-repository.port';
import { EmerchantpayAccountEntity } from '../../../core/domain/emerchantpay-account.entity';
import { UpdateEmerchantpayAccountDto, EmerchantpayAccountResponseDto } from '../../dto/emerchantpay-account';

@Injectable()
export class UpdateEmerchantpayAccountUseCase {
  constructor(
    @Inject('EmerchantpayAccountRepositoryPort')
    private readonly repository: EmerchantpayAccountRepositoryPort,
  ) {}

  async execute(id: string, dto: UpdateEmerchantpayAccountDto): Promise<EmerchantpayAccountResponseDto> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Compte Emerchantpay non trouvé (ID: ${id})`);
    }

    const updateData: Partial<EmerchantpayAccountEntity> = {};

    if (dto.nom !== undefined) updateData.nom = dto.nom;
    if (dto.username !== undefined) updateData.username = dto.username;
    if (dto.password !== undefined) updateData.password = dto.password;
    if (dto.terminalToken !== undefined) updateData.terminalToken = dto.terminalToken;
    if (dto.environment !== undefined) updateData.environment = dto.environment;
    if (dto.actif !== undefined) updateData.actif = dto.actif;

    const updated = await this.repository.update(id, updateData);
    return this.toResponse(updated);
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
