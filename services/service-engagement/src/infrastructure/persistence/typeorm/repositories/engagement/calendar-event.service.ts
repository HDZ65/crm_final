import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { CalendarEventEntity } from '../../../../../domain/engagement/entities';

@Injectable()
export class CalendarEventAgendaService {
  constructor(
    @InjectRepository(CalendarEventEntity)
    private readonly calendarEventRepository: Repository<CalendarEventEntity>,
  ) {}

  async create(data: Partial<CalendarEventEntity>): Promise<CalendarEventEntity> {
    const event = this.calendarEventRepository.create(data);
    return this.calendarEventRepository.save(event);
  }

  async findById(id: string): Promise<CalendarEventEntity> {
    const event = await this.calendarEventRepository.findOne({
      where: { id },
    });
    if (!event) {
      throw new NotFoundException(`CalendarEvent ${id} non trouvé`);
    }
    return event;
  }

  async update(id: string, data: Partial<CalendarEventEntity>): Promise<CalendarEventEntity> {
    const event = await this.findById(id);
    Object.assign(event, data);
    return this.calendarEventRepository.save(event);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.calendarEventRepository.delete(id);
    return (result.affected ?? 0) > 0;
  }

  async listByDateRange(
    userId: string,
    organisationId: string,
    startDate: string,
    endDate: string,
    pagination?: { page: number; limit: number },
  ): Promise<{
    data: CalendarEventEntity[];
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

    const [data, total] = await this.calendarEventRepository.findAndCount({
      where: whereConditions,
      skip,
      take: limit,
      order: { startTime: 'ASC' },
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async listByClient(
    clientId: string,
    organisationId: string,
    pagination?: { page: number; limit: number },
  ): Promise<{
    data: CalendarEventEntity[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;
    const skip = (page - 1) * limit;

    const queryBuilder = this.calendarEventRepository
      .createQueryBuilder('event')
      .where('event.organisation_id = :organisationId', { organisationId })
      .andWhere("event.attendees::text LIKE :clientId", { clientId: `%${clientId}%` })
      .orderBy('event.start_time', 'DESC')
      .skip(skip)
      .take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async listByUser(
    userId: string,
    organisationId: string,
    pagination?: { page: number; limit: number },
  ): Promise<{
    data: CalendarEventEntity[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;
    const skip = (page - 1) * limit;

    const [data, total] = await this.calendarEventRepository.findAndCount({
      where: { userId, organisationId },
      skip,
      take: limit,
      order: { startTime: 'ASC' },
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
