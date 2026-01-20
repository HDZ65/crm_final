import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { EmerchantpayAccountRepositoryPort } from '../../../core/port/emerchantpay-account-repository.port';
import type { EmerchantpayAccountEntity } from '../../../core/domain/emerchantpay-account.entity';
import { EmerchantpayAccountResponseDto } from '../../dto/emerchantpay-account';

@Injectable()
export class GetEmerchantpayAccountUseCase {
  constructor(
    @Inject('EmerchantpayAccountRepositoryPort')
    private readonly repository: EmerchantpayAccountRepositoryPort,
  ) {}

  async findById(id: string): Promise<EmerchantpayAccountResponseDto> {
    const entity = await this.repository.findById(id);
    if (!entity) {
      throw new NotFoundException(`Compte Emerchantpay non trouvé (ID: ${id})`);
    }
    return this.toResponse(entity);
  }

  async findAll(): Promise<EmerchantpayAccountResponseDto[]> {
    const entities = await this.repository.findAll();
    return entities.map((entity) => this.toResponse(entity));
  }

  async findBySocieteId(societeId: string): Promise<EmerchantpayAccountResponseDto> {
    const entity = await this.repository.findBySocieteId(societeId);
    if (!entity) {
      throw new NotFoundException(
        `Aucun compte Emerchantpay configuré pour cette société (ID: ${societeId})`,
      );
    }
    return this.toResponse(entity);
  }

  async findAllActive(): Promise<EmerchantpayAccountResponseDto[]> {
    const entities = await this.repository.findAllActive();
    return entities.map((entity) => this.toResponse(entity));
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
