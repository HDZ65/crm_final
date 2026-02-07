import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { CallSummaryAgendaService } from '../../persistence/typeorm/repositories/engagement/call-summary.service';
import { CallSummaryEntity } from '../../../domain/engagement/entities';

@Controller()
export class CallSummaryController {
  constructor(private readonly callSummaryService: CallSummaryAgendaService) {}

  @GrpcMethod('CallSummaryService', 'Get')
  async get(data: any): Promise<any> {
    const summary = await this.callSummaryService.findById(data.id);
    return this.toProto(summary);
  }

  @GrpcMethod('CallSummaryService', 'GetByMeeting')
  async getByMeeting(data: any): Promise<any> {
    const summary = await this.callSummaryService.findByMeetingId(data.meeting_id);
    return this.toProto(summary);
  }

  @GrpcMethod('CallSummaryService', 'Regenerate')
  async regenerate(data: any): Promise<any> {
    const summary = await this.callSummaryService.regenerate(data.meeting_id, data.ai_model);
    return this.toProto(summary);
  }

  private toProto(entity: CallSummaryEntity): any {
    return {
      id: entity.id,
      meeting_id: entity.meetingId,
      executive_summary: entity.executiveSummary ?? '',
      key_points: entity.keyPoints ? JSON.stringify(entity.keyPoints) : '',
      decisions: entity.decisions ? JSON.stringify(entity.decisions) : '',
      action_items: entity.actionItems ? JSON.stringify(entity.actionItems) : '',
      generated_at: entity.generatedAt?.toISOString() ?? '',
      ai_model: entity.aiModel ?? '',
      raw_ai_response: entity.rawAiResponse ?? '',
      created_at: entity.createdAt?.toISOString() ?? '',
      updated_at: entity.updatedAt?.toISOString() ?? '',
    };
  }
}
