import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { GoCardlessMandateEntity } from '../../../core/domain/gocardless-mandate.entity';
import type { GoCardlessMandateRepositoryPort } from '../../../core/port/gocardless-mandate-repository.port';

@Injectable()
export class GetGoCardlessMandateUseCase {
  constructor(
    @Inject('GoCardlessMandateRepositoryPort')
    private readonly repository: GoCardlessMandateRepositoryPort,
  ) {}

  async execute(id: string): Promise<GoCardlessMandateEntity> {
    const entity = await this.repository.findById(id);
    if (!entity) {
      throw new NotFoundException(`GoCardless mandate with id ${id} not found`);
    }
    return entity;
  }

  async executeAll(): Promise<GoCardlessMandateEntity[]> {
    return await this.repository.findAll();
  }

  async executeByClientId(clientId: string): Promise<GoCardlessMandateEntity[]> {
    return await this.repository.findByClientId(clientId);
  }

  async executeByMandateId(mandateId: string): Promise<GoCardlessMandateEntity | null> {
    return await this.repository.findByMandateId(mandateId);
  }

  async executeActiveByClientId(clientId: string): Promise<GoCardlessMandateEntity | null> {
    return await this.repository.findActiveByClientId(clientId);
  }
}
