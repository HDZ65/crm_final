import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { MeetingEntity } from '../../../../../domain/engagement/entities';

@Injectable()
export class MeetingAgendaService {
  constructor(
    @InjectRepository(MeetingEntity)
    private readonly meetingRepository: Repository<MeetingEntity>,
  ) {}

  async create(data: Partial<MeetingEntity>): Promise<MeetingEntity> {
    const meeting = this.meetingRepository.create(data);
    return this.meetingRepository.save(meeting);
  }

  async findById(id: string): Promise<MeetingEntity> {
    const meeting = await this.meetingRepository.findOne({
      where: { id },
    });
    if (!meeting) {
      throw new NotFoundException(`Meeting ${id} non trouvé`);
    }
    return meeting;
  }

  async listByDateRange(
    userId: string,
    organisationId: string,
    startDate: string,
    endDate: string,
    pagination?: { page: number; limit: number },
  ): Promise<{
    data: MeetingEntity[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;
    const skip = (page - 1) * limit;

    const whereConditions: any = {
      userId,
      organisationId,
    };

    if (startDate && endDate) {
      whereConditions.startTime = MoreThanOrEqual(new Date(startDate));
      whereConditions.endTime = LessThanOrEqual(new Date(endDate));
    } else if (startDate) {
      whereConditions.startTime = MoreThanOrEqual(new Date(startDate));
    } else if (endDate) {
      whereConditions.endTime = LessThanOrEqual(new Date(endDate));
    }

    const [data, total] = await this.meetingRepository.findAndCount({
      where: whereConditions,
      skip,
      take: limit,
      order: { startTime: 'DESC' },
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async matchParticipants(meetingId: string): Promise<{
    participants: any[];
    matchedCount: number;
    unmatchedCount: number;
  }> {
    const meeting = await this.findById(meetingId);
    const participants = meeting.participants || [];

    // Basic participant matching: return participants as-is
    // Real matching logic would cross-reference with client database
    let matchedCount = 0;
    let unmatchedCount = 0;

    const enrichedParticipants = Array.isArray(participants)
      ? participants.map((p: any) => {
          if (p.matched_client_id || p.matchedClientId) {
            matchedCount++;
            return { ...p, match_type: 'email_exact' };
          }
          unmatchedCount++;
          return { ...p, match_type: 'unmatched' };
        })
      : [];

    return {
      participants: enrichedParticipants,
      matchedCount,
      unmatchedCount,
    };
  }

  async updateClientMatch(
    meetingId: string,
    participantEmail: string,
    clientId: string,
    matchType: string,
  ): Promise<MeetingEntity> {
    const meeting = await this.findById(meetingId);
    const participants = Array.isArray(meeting.participants) ? [...meeting.participants] : [];

    const participantIndex = participants.findIndex(
      (p: any) => p.email === participantEmail,
    );

    if (participantIndex >= 0) {
      participants[participantIndex] = {
        ...participants[participantIndex],
        matched_client_id: clientId,
        match_type: matchType,
      };
    } else {
      participants.push({
        email: participantEmail,
        matched_client_id: clientId,
        match_type: matchType,
      });
    }

    meeting.participants = participants;
    return this.meetingRepository.save(meeting);
  }
}
