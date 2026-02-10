import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TrackingEventEntity } from '../../../../../domain/logistics/entities';

@Injectable()
export class TrackingService {
  private readonly logger = new Logger(TrackingService.name);

  constructor(
    @InjectRepository(TrackingEventEntity)
    private readonly trackingEventRepository: Repository<TrackingEventEntity>,
  ) {}

  async create(params: {
    expeditionId: string;
    code: string;
    label: string;
    dateEvenement: string;
    lieu?: string;
    raw?: string;
  }): Promise<TrackingEventEntity> {
    const event = this.trackingEventRepository.create({
      ...params,
      lieu: params.lieu || '',
      raw: params.raw || '',
    });
    return this.trackingEventRepository.save(event);
  }

  async findByExpeditionId(expeditionId: string): Promise<TrackingEventEntity[]> {
    return this.trackingEventRepository.find({
      where: { expeditionId },
      order: { dateEvenement: 'DESC' },
    });
  }

  async findLatestByExpeditionId(expeditionId: string): Promise<TrackingEventEntity | null> {
    return this.trackingEventRepository.findOne({
      where: { expeditionId },
      order: { dateEvenement: 'DESC' },
    });
  }

  async createMultiple(
    expeditionId: string,
    events: Array<{
      code: string;
      label: string;
      dateEvenement: string;
      lieu?: string;
    }>,
  ): Promise<TrackingEventEntity[]> {
    const entities = events.map((event) =>
      this.trackingEventRepository.create({
        expeditionId,
        ...event,
        lieu: event.lieu || '',
        raw: '',
      }),
    );

    return this.trackingEventRepository.save(entities);
  }
}
