import { Controller } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { CalendarEventAgendaService } from '../../persistence/typeorm/repositories/engagement/calendar-event.service';
import { CalendarEventEntity } from '../../../domain/engagement/entities';

@Controller()
export class CalendarEventController {
  constructor(private readonly calendarEventService: CalendarEventAgendaService) {}

  @GrpcMethod('CalendarEventService', 'Create')
  async create(data: any): Promise<any> {
    if (!data.user_id || !data.organisation_id) {
      throw new RpcException({ code: status.INVALID_ARGUMENT, message: 'user_id and organisation_id are required' });
    }
    const event = await this.calendarEventService.create({
      userId: data.user_id,
      organisationId: data.organisation_id,
      provider: data.provider,
      externalId: data.external_id,
      title: data.title,
      description: data.description,
      startTime: data.start_time ? new Date(data.start_time) : undefined,
      endTime: data.end_time ? new Date(data.end_time) : undefined,
      location: data.location,
      attendees: data.attendees ? JSON.parse(data.attendees) : null,
      isAllDay: data.is_all_day ?? false,
      source: data.source,
      sourceUrl: data.source_url,
      meetingId: data.meeting_id || null,
    });
    return this.toProto(event);
  }

  @GrpcMethod('CalendarEventService', 'Get')
  async get(data: any): Promise<any> {
    const event = await this.calendarEventService.findById(data.id);
    return this.toProto(event);
  }

  @GrpcMethod('CalendarEventService', 'Update')
  async update(data: any): Promise<any> {
    const updateData: Partial<CalendarEventEntity> = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.start_time) updateData.startTime = new Date(data.start_time);
    if (data.end_time) updateData.endTime = new Date(data.end_time);
    if (data.location !== undefined) updateData.location = data.location;
    if (data.attendees !== undefined) updateData.attendees = data.attendees ? JSON.parse(data.attendees) : null;
    if (data.is_all_day !== undefined) updateData.isAllDay = data.is_all_day;
    if (data.source_url !== undefined) updateData.sourceUrl = data.source_url;
    if (data.meeting_id !== undefined) updateData.meetingId = data.meeting_id || null;

    const event = await this.calendarEventService.update(data.id, updateData);
    return this.toProto(event);
  }

  @GrpcMethod('CalendarEventService', 'Delete')
  async delete(data: any): Promise<any> {
    const success = await this.calendarEventService.delete(data.id);
    return { success };
  }

  @GrpcMethod('CalendarEventService', 'ListByDateRange')
  async listByDateRange(data: any): Promise<any> {
    const result = await this.calendarEventService.listByDateRange(
      data.user_id,
      data.organisation_id,
      data.start_date,
      data.end_date,
      data.pagination,
    );
    return {
      events: result.data.map((e) => this.toProto(e)),
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        total_pages: result.totalPages,
      },
    };
  }

  @GrpcMethod('CalendarEventService', 'ListByClient')
  async listByClient(data: any): Promise<any> {
    const result = await this.calendarEventService.listByClient(
      data.client_id,
      data.organisation_id,
      data.pagination,
    );
    return {
      events: result.data.map((e) => this.toProto(e)),
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        total_pages: result.totalPages,
      },
    };
  }

  @GrpcMethod('CalendarEventService', 'SyncFromProvider')
  async syncFromProvider(data: any): Promise<any> {
    // SyncFromProvider requires external OAuth integration
    // For now, return zeros - actual sync logic will call provider APIs
    return { synced_count: 0, created_count: 0, updated_count: 0, deleted_count: 0 };
  }

  private toProto(entity: CalendarEventEntity): any {
    return {
      id: entity.id,
      user_id: entity.userId,
      organisation_id: entity.organisationId,
      provider: entity.provider ?? 0,
      external_id: entity.externalId ?? '',
      title: entity.title ?? '',
      description: entity.description ?? '',
      start_time: entity.startTime?.toISOString() ?? '',
      end_time: entity.endTime?.toISOString() ?? '',
      location: entity.location ?? '',
      attendees: entity.attendees ? JSON.stringify(entity.attendees) : '',
      is_all_day: entity.isAllDay ?? false,
      source: entity.source ?? 0,
      source_url: entity.sourceUrl ?? '',
      meeting_id: entity.meetingId ?? '',
      created_at: entity.createdAt?.toISOString() ?? '',
      updated_at: entity.updatedAt?.toISOString() ?? '',
    };
  }
}
