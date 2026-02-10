import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FulfillmentCutoffConfigEntity } from '../../../../../domain/fulfillment/entities';
import { IFulfillmentCutoffConfigRepository } from '../../../../../domain/fulfillment/repositories';

@Injectable()
export class FulfillmentCutoffConfigService implements IFulfillmentCutoffConfigRepository {
  private readonly logger = new Logger(FulfillmentCutoffConfigService.name);

  constructor(
    @InjectRepository(FulfillmentCutoffConfigEntity)
    private readonly fulfillmentCutoffConfigRepository: Repository<FulfillmentCutoffConfigEntity>,
  ) {}

  async create(params: {
    organisationId: string;
    societeId: string;
    cutoffDayOfWeek: number;
    cutoffTime: string;
    timezone: string;
    active: boolean;
  }): Promise<FulfillmentCutoffConfigEntity> {
    const config = this.fulfillmentCutoffConfigRepository.create(params);
    return this.fulfillmentCutoffConfigRepository.save(config);
  }

  async findById(id: string): Promise<FulfillmentCutoffConfigEntity | null> {
    return this.fulfillmentCutoffConfigRepository.findOne({ where: { id } });
  }

  async findByOrganisationId(organisationId: string): Promise<FulfillmentCutoffConfigEntity[]> {
    return this.fulfillmentCutoffConfigRepository.find({
      where: { organisationId },
      order: { createdAt: 'DESC' },
    });
  }

  async findBySocieteId(societeId: string): Promise<FulfillmentCutoffConfigEntity[]> {
    return this.fulfillmentCutoffConfigRepository.find({
      where: { societeId },
      order: { createdAt: 'DESC' },
    });
  }

  async findActiveByOrganisationId(organisationId: string): Promise<FulfillmentCutoffConfigEntity[]> {
    return this.fulfillmentCutoffConfigRepository.find({
      where: { organisationId, active: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findBySocieteIdAndDayOfWeek(
    societeId: string,
    dayOfWeek: number,
  ): Promise<FulfillmentCutoffConfigEntity | null> {
    return this.fulfillmentCutoffConfigRepository.findOne({
      where: { societeId, cutoffDayOfWeek: dayOfWeek, active: true },
    });
  }

  async update(
    id: string,
    params: {
      cutoffDayOfWeek?: number;
      cutoffTime?: string;
      timezone?: string;
      active?: boolean;
    },
  ): Promise<FulfillmentCutoffConfigEntity> {
    const config = await this.findById(id);
    if (!config) {
      throw new NotFoundException('Fulfillment cutoff config not found');
    }

    Object.assign(config, params);
    return this.fulfillmentCutoffConfigRepository.save(config);
  }

  async delete(id: string): Promise<void> {
    const result = await this.fulfillmentCutoffConfigRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Fulfillment cutoff config not found');
    }
  }
}
