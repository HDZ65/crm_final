import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { ClientBaseEntity } from '../../../core/domain/client-base.entity';
import type { ClientBaseRepositoryPort } from '../../../core/port/client-base-repository.port';

@Injectable()
export class GetClientBaseUseCase {
  constructor(
    @Inject('ClientBaseRepositoryPort')
    private readonly repository: ClientBaseRepositoryPort,
  ) {}

  async execute(id: string): Promise<ClientBaseEntity> {
    const entity = await this.repository.findById(id);

    if (!entity) {
      throw new NotFoundException(`ClientBase with id ${id} not found`);
    }

    return entity;
  }

  async executeAll(): Promise<ClientBaseEntity[]> {
    return await this.repository.findAll();
  }
}
