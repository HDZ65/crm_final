import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { TrackingService } from './tracking.service.js';
import { TrackingEventEntity } from './entities/tracking-event.entity.js';
import type {
  CreateTrackingEventRequest,
  TrackingEventResponse,
  GetByExpeditionIdRequest,
  TrackingEventListResponse,
} from '@crm/proto/logistics';

@Controller()
export class TrackingController {
  private readonly logger = new Logger(TrackingController.name);

  constructor(private readonly trackingService: TrackingService) {}

  @GrpcMethod('LogisticsService', 'CreateTrackingEvent')
  async createTrackingEvent(data: CreateTrackingEventRequest): Promise<TrackingEventResponse> {
    this.logger.log(`CreateTrackingEvent for expedition: ${data.expeditionId}`);

    const event = await this.trackingService.create({
      expeditionId: data.expeditionId,
      code: data.code,
      label: data.label,
      dateEvenement: data.dateEvenement,
      lieu: data.lieu,
      raw: data.raw,
    });

    return this.mapToResponse(event);
  }

  @GrpcMethod('LogisticsService', 'GetTrackingEvents')
  async getTrackingEvents(data: GetByExpeditionIdRequest): Promise<TrackingEventListResponse> {
    this.logger.log(`GetTrackingEvents for expedition: ${data.expeditionId}`);

    const events = await this.trackingService.findByExpeditionId(data.expeditionId);

    return {
      events: events.map((e) => this.mapToResponse(e)),
      total: events.length,
    };
  }

  @GrpcMethod('LogisticsService', 'GetLatestTrackingEvent')
  async getLatestTrackingEvent(data: GetByExpeditionIdRequest): Promise<TrackingEventResponse> {
    this.logger.log(`GetLatestTrackingEvent for expedition: ${data.expeditionId}`);

    const event = await this.trackingService.findLatestByExpeditionId(data.expeditionId);
    if (!event) {
      throw new Error('No tracking events found');
    }

    return this.mapToResponse(event);
  }

  private mapToResponse(event: TrackingEventEntity): TrackingEventResponse {
    return {
      id: event.id,
      expeditionId: event.expeditionId,
      code: event.code,
      label: event.label,
      dateEvenement: event.dateEvenement,
      lieu: event.lieu,
      raw: event.raw,
      createdAt: event.createdAt?.toISOString() ?? '',
    };
  }
}
