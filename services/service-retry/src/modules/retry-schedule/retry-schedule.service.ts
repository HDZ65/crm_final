import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, Between } from 'typeorm';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { RetryScheduleEntity, RetryEligibility } from './entities/retry-schedule.entity';

interface ListRetrySchedulesInput {
  organisationId: string;
  societeId?: string;
  clientId?: string;
  contratId?: string;
  eligibility?: RetryEligibility;
  isResolved?: boolean;
  nextRetryDateFrom?: Date;
  nextRetryDateTo?: Date;
  pagination?: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: string;
  };
}

interface CancelRetryScheduleInput {
  id: string;
  reason: string;
  cancelledBy: string;
}

@Injectable()
export class RetryScheduleService {
  private readonly logger = new Logger(RetryScheduleService.name);

  constructor(
    @InjectRepository(RetryScheduleEntity)
    private readonly scheduleRepository: Repository<RetryScheduleEntity>,
  ) {}

  async findById(id: string): Promise<RetryScheduleEntity> {
    const schedule = await this.scheduleRepository.findOne({
      where: { id },
      relations: ['policy', 'attempts', 'reminders'],
    });

    if (!schedule) {
      throw new RpcException({
        code: status.NOT_FOUND,
        message: `Retry schedule ${id} not found`,
      });
    }

    return schedule;
  }

  async findAll(input: ListRetrySchedulesInput): Promise<{
    schedules: RetryScheduleEntity[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const page = input.pagination?.page ?? 1;
    const limit = input.pagination?.limit ?? 20;
    const sortBy = input.pagination?.sortBy || 'createdAt';
    const sortOrder = (input.pagination?.sortOrder?.toUpperCase() as 'ASC' | 'DESC') || 'DESC';

    const queryBuilder = this.scheduleRepository
      .createQueryBuilder('schedule')
      .leftJoinAndSelect('schedule.policy', 'policy')
      .where('schedule.organisationId = :organisationId', { organisationId: input.organisationId });

    if (input.societeId) {
      queryBuilder.andWhere('schedule.societeId = :societeId', { societeId: input.societeId });
    }

    if (input.clientId) {
      queryBuilder.andWhere('schedule.clientId = :clientId', { clientId: input.clientId });
    }

    if (input.contratId) {
      queryBuilder.andWhere('schedule.contratId = :contratId', { contratId: input.contratId });
    }

    if (input.eligibility) {
      queryBuilder.andWhere('schedule.eligibility = :eligibility', { eligibility: input.eligibility });
    }

    if (input.isResolved !== undefined) {
      queryBuilder.andWhere('schedule.isResolved = :isResolved', { isResolved: input.isResolved });
    }

    if (input.nextRetryDateFrom && input.nextRetryDateTo) {
      queryBuilder.andWhere('schedule.nextRetryDate BETWEEN :from AND :to', {
        from: input.nextRetryDateFrom,
        to: input.nextRetryDateTo,
      });
    } else if (input.nextRetryDateFrom) {
      queryBuilder.andWhere('schedule.nextRetryDate >= :from', { from: input.nextRetryDateFrom });
    } else if (input.nextRetryDateTo) {
      queryBuilder.andWhere('schedule.nextRetryDate <= :to', { to: input.nextRetryDateTo });
    }

    const [schedules, total] = await queryBuilder
      .orderBy(`schedule.${sortBy}`, sortOrder)
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      schedules,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findDueForRetry(
    organisationId: string,
    cutoffDate: Date,
  ): Promise<RetryScheduleEntity[]> {
    return this.scheduleRepository.find({
      where: {
        organisationId,
        isResolved: false,
        eligibility: RetryEligibility.ELIGIBLE,
        nextRetryDate: LessThanOrEqual(cutoffDate),
      },
      relations: ['policy'],
      order: { nextRetryDate: 'ASC' },
    });
  }

  async cancel(input: CancelRetryScheduleInput): Promise<RetryScheduleEntity> {
    const schedule = await this.findById(input.id);

    if (schedule.isResolved) {
      throw new RpcException({
        code: status.FAILED_PRECONDITION,
        message: `Retry schedule ${input.id} is already resolved`,
      });
    }

    schedule.isResolved = true;
    schedule.eligibility = RetryEligibility.NOT_ELIGIBLE_MANUAL_CANCEL;
    schedule.resolutionReason = `Manually cancelled: ${input.reason}`;
    schedule.resolvedAt = new Date();
    schedule.nextRetryDate = null;
    schedule.metadata = {
      ...schedule.metadata,
      cancelledBy: input.cancelledBy,
      cancelledAt: new Date().toISOString(),
      cancelReason: input.reason,
    };

    this.logger.log(`Cancelling retry schedule ${input.id}: ${input.reason}`);

    return this.scheduleRepository.save(schedule);
  }

  async updateNextRetryDate(id: string, nextRetryDate: Date | null): Promise<RetryScheduleEntity> {
    const schedule = await this.findById(id);
    schedule.nextRetryDate = nextRetryDate;
    return this.scheduleRepository.save(schedule);
  }

  async markResolved(
    id: string,
    resolutionReason: string,
    eligibility?: RetryEligibility,
  ): Promise<RetryScheduleEntity> {
    const schedule = await this.findById(id);
    
    schedule.isResolved = true;
    schedule.resolutionReason = resolutionReason;
    schedule.resolvedAt = new Date();
    schedule.nextRetryDate = null;
    
    if (eligibility) {
      schedule.eligibility = eligibility;
    }

    return this.scheduleRepository.save(schedule);
  }

  async getStatistics(
    organisationId: string,
    dateFrom?: Date,
    dateTo?: Date,
  ): Promise<{
    total: number;
    eligible: number;
    resolved: number;
    pending: number;
    byEligibility: { eligibility: RetryEligibility; count: number }[];
    avgAttemptsBeforeSuccess: number;
  }> {
    const queryBuilder = this.scheduleRepository
      .createQueryBuilder('schedule')
      .where('schedule.organisationId = :organisationId', { organisationId });

    if (dateFrom) {
      queryBuilder.andWhere('schedule.createdAt >= :dateFrom', { dateFrom });
    }
    if (dateTo) {
      queryBuilder.andWhere('schedule.createdAt <= :dateTo', { dateTo });
    }

    const total = await queryBuilder.getCount();

    const eligible = await this.scheduleRepository.count({
      where: {
        organisationId,
        eligibility: RetryEligibility.ELIGIBLE,
        isResolved: false,
      },
    });

    const resolved = await this.scheduleRepository.count({
      where: { organisationId, isResolved: true },
    });

    const pending = total - resolved;

    const byEligibilityRaw = await this.scheduleRepository
      .createQueryBuilder('schedule')
      .select('schedule.eligibility', 'eligibility')
      .addSelect('COUNT(*)', 'count')
      .where('schedule.organisationId = :organisationId', { organisationId })
      .groupBy('schedule.eligibility')
      .getRawMany();

    const byEligibility = byEligibilityRaw.map((row) => ({
      eligibility: row.eligibility as RetryEligibility,
      count: parseInt(row.count, 10),
    }));

    const avgResult = await this.scheduleRepository
      .createQueryBuilder('schedule')
      .select('AVG(schedule.currentAttempt)', 'avg')
      .where('schedule.organisationId = :organisationId', { organisationId })
      .andWhere('schedule.isResolved = :isResolved', { isResolved: true })
      .andWhere('schedule.resolutionReason = :reason', { reason: 'RETRY_SUCCEEDED' })
      .getRawOne();

    const avgAttemptsBeforeSuccess = parseFloat(avgResult?.avg || '0');

    return {
      total,
      eligible,
      resolved,
      pending,
      byEligibility,
      avgAttemptsBeforeSuccess,
    };
  }
}
