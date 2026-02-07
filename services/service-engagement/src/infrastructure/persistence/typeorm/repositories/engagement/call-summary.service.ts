import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CallSummaryEntity } from '../../../../../domain/engagement/entities';

@Injectable()
export class CallSummaryAgendaService {
  constructor(
    @InjectRepository(CallSummaryEntity)
    private readonly callSummaryRepository: Repository<CallSummaryEntity>,
  ) {}

  async findById(id: string): Promise<CallSummaryEntity> {
    const summary = await this.callSummaryRepository.findOne({
      where: { id },
    });
    if (!summary) {
      throw new NotFoundException(`CallSummary ${id} non trouvé`);
    }
    return summary;
  }

  async findByMeetingId(meetingId: string): Promise<CallSummaryEntity> {
    const summary = await this.callSummaryRepository.findOne({
      where: { meetingId },
    });
    if (!summary) {
      throw new NotFoundException(`CallSummary for meeting ${meetingId} non trouvé`);
    }
    return summary;
  }

  async regenerate(meetingId: string, aiModel?: string): Promise<CallSummaryEntity> {
    // Find existing summary or create a new one
    let summary = await this.callSummaryRepository.findOne({
      where: { meetingId },
    });

    if (summary) {
      // Reset fields for regeneration
      summary.executiveSummary = undefined as any;
      summary.keyPoints = undefined as any;
      summary.decisions = undefined as any;
      summary.actionItems = undefined as any;
      summary.generatedAt = undefined as any;
      summary.rawAiResponse = undefined as any;
      if (aiModel) {
        summary.aiModel = aiModel;
      }
    } else {
      // Create a new summary placeholder
      summary = this.callSummaryRepository.create({
        meetingId,
        aiModel: aiModel || undefined,
      });
    }

    return this.callSummaryRepository.save(summary);
  }
}
