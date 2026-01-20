import { Injectable, Inject } from '@nestjs/common';
import type { ScheduleRepositoryPort } from '../../../core/port/schedule-repository.port';

@Injectable()
export class DeleteScheduleUseCase {
  constructor(
    @Inject('ScheduleRepositoryPort')
    private readonly repository: ScheduleRepositoryPort,
  ) {}

  async execute(id: string): Promise<void> {
    return await this.repository.delete(id);
  }
}
