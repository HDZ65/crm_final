import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { EmerchantpayAccountRepositoryPort } from '../../../core/port/emerchantpay-account-repository.port';

@Injectable()
export class DeleteEmerchantpayAccountUseCase {
  constructor(
    @Inject('EmerchantpayAccountRepositoryPort')
    private readonly repository: EmerchantpayAccountRepositoryPort,
  ) {}

  async execute(id: string): Promise<void> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Compte Emerchantpay avec l'id ${id} non trouvé`);
    }

    await this.repository.delete(id);
  }
}
