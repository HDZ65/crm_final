import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { MeetingAgendaService } from '../../persistence/typeorm/repositories/engagement/meeting.service';
import { MeetingEntity } from '../../../domain/engagement/entities';

@Controller()
export class MeetingController {
  constructor(private readonly meetingService: MeetingAgendaService) {}

  @GrpcMethod('MeetingService', 'Create')
  async create(data: any): Promise<any> {
    const meeting = await this.meetingService.create({
      userId: data.user_id,
      organisationId: data.organisation_id,
      provider: data.provider,
      externalMeetingId: data.external_meeting_id,
      title: data.title,
      startTime: data.start_time ? new Date(data.start_time) : undefined,
      endTime: data.end_time ? new Date(data.end_time) : undefined,
      durationMinutes: data.duration_minutes,
      participants: data.participants ? JSON.parse(data.participants) : null,
      recordingUrl: data.recording_url,
      transcriptUrl: data.transcript_url,
      calendarEventId: data.calendar_event_id || null,
    });
    return this.toProto(meeting);
  }

  @GrpcMethod('MeetingService', 'Get')
  async get(data: any): Promise<any> {
    const meeting = await this.meetingService.findById(data.id);
    return this.toProto(meeting);
  }

  @GrpcMethod('MeetingService', 'ListByDateRange')
  async listByDateRange(data: any): Promise<any> {
    const result = await this.meetingService.listByDateRange(
      data.user_id,
      data.organisation_id,
      data.start_date,
      data.end_date,
      data.pagination,
    );
    return {
      meetings: result.data.map((m) => this.toProto(m)),
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        total_pages: result.totalPages,
      },
    };
  }

  @GrpcMethod('MeetingService', 'MatchParticipants')
  async matchParticipants(data: any): Promise<any> {
    const result = await this.meetingService.matchParticipants(data.meeting_id);
    return {
      participants: result.participants,
      matched_count: result.matchedCount,
      unmatched_count: result.unmatchedCount,
    };
  }

  @GrpcMethod('MeetingService', 'UpdateClientMatch')
  async updateClientMatch(data: any): Promise<any> {
    const meeting = await this.meetingService.updateClientMatch(
      data.meeting_id,
      data.participant_email,
      data.client_id,
      data.match_type,
    );
    return this.toProto(meeting);
  }

  private toProto(entity: MeetingEntity): any {
    return {
      id: entity.id,
      user_id: entity.userId,
      organisation_id: entity.organisationId,
      provider: entity.provider ?? 0,
      external_meeting_id: entity.externalMeetingId ?? '',
      title: entity.title ?? '',
      start_time: entity.startTime?.toISOString() ?? '',
      end_time: entity.endTime?.toISOString() ?? '',
      duration_minutes: entity.durationMinutes ?? 0,
      participants: entity.participants ? JSON.stringify(entity.participants) : '',
      recording_url: entity.recordingUrl ?? '',
      transcript_url: entity.transcriptUrl ?? '',
      summary_status: entity.summaryStatus ?? 0,
      calendar_event_id: entity.calendarEventId ?? '',
      created_at: entity.createdAt?.toISOString() ?? '',
      updated_at: entity.updatedAt?.toISOString() ?? '',
    };
  }
}
