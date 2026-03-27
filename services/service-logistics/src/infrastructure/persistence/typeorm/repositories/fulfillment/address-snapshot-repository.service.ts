import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AddressSnapshotEntity } from '../../../../../domain/fulfillment/entities';

@Injectable()
export class AddressSnapshotRepositoryService {
  private readonly logger = new Logger(AddressSnapshotRepositoryService.name);

  constructor(
    @InjectRepository(AddressSnapshotEntity)
    private readonly repository: Repository<AddressSnapshotEntity>,
  ) {}

  async create(params: {
    organisationId: string;
    clientId: string;
    rue: string;
    codePostal: string;
    ville: string;
    pays: string;
    capturedAt: Date;
  }): Promise<AddressSnapshotEntity> {
    const entity = this.repository.create(params);
    return this.repository.save(entity);
  }

  async findById(id: string): Promise<AddressSnapshotEntity | null> {
    return this.repository.findOne({ where: { id } });
  }
}
