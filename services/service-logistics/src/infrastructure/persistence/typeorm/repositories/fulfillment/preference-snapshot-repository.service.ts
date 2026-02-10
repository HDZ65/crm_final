import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PreferenceSnapshotEntity } from '../../../../../domain/fulfillment/entities';

@Injectable()
export class PreferenceSnapshotRepositoryService {
  private readonly logger = new Logger(PreferenceSnapshotRepositoryService.name);

  constructor(
    @InjectRepository(PreferenceSnapshotEntity)
    private readonly repository: Repository<PreferenceSnapshotEntity>,
  ) {}

  async create(params: {
    organisationId: string;
    subscriptionId: string;
    preferenceData: Record<string, unknown>;
    capturedAt: Date;
  }): Promise<PreferenceSnapshotEntity> {
    const entity = this.repository.create(params);
    return this.repository.save(entity);
  }

  async findById(id: string): Promise<PreferenceSnapshotEntity | null> {
    return this.repository.findOne({ where: { id } });
  }
}
