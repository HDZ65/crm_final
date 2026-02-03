import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { RetryAttemptEntity, RetryAttemptStatus } from './entities/retry-attempt.entity';
import type { PaginationRequest } from '@crm/proto/retry';

export interface ListRetryAttemptsInput {
  retryScheduleId?: string;
  retryJobId?: string;
  status?: RetryAttemptStatus;
  pagination?: Partial<PaginationRequest>;
}

@Injectable()
export class RetryAttemptService {
  private readonly logger = new Logger(RetryAttemptService.name);

  constructor(
    @InjectRepository(RetryAttemptEntity)
    private readonly attemptRepository: Repository<RetryAttemptEntity>,
  ) {}

  async findById(id: string): Promise<RetryAttemptEntity> {
    const attempt = await this.attemptRepository.findOne({
      where: { id },
      relations: ['schedule'],
    });

    if (!attempt) {
      throw new RpcException({
        code: status.NOT_FOUND,
        message: `Retry attempt ${id} not found`,
      });
    }

    return attempt;
  }

  async findByScheduleId(retryScheduleId: string): Promise<RetryAttemptEntity[]> {
    return this.attemptRepository.find({
      where: { retryScheduleId },
      order: { attemptNumber: 'ASC' },
    });
  }

  async findAll(input: ListRetryAttemptsInput): Promise<{
    attempts: RetryAttemptEntity[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const page = input.pagination?.page ?? 1;
    const limit = input.pagination?.limit ?? 20;
    const sortBy = input.pagination?.sortBy || 'createdAt';
    const sortOrder = (input.pagination?.sortOrder?.toUpperCase() as 'ASC' | 'DESC') || 'DESC';

    const queryBuilder = this.attemptRepository.createQueryBuilder('attempt');

    if (input.retryScheduleId) {
      queryBuilder.andWhere('attempt.retryScheduleId = :retryScheduleId', {
        retryScheduleId: input.retryScheduleId,
      });
    }

    if (input.retryJobId) {
      queryBuilder.andWhere('attempt.retryJobId = :retryJobId', {
        retryJobId: input.retryJobId,
      });
    }

    if (input.status) {
      queryBuilder.andWhere('attempt.status = :status', { status: input.status });
    }

    const [attempts, total] = await queryBuilder
      .orderBy(`attempt.${sortBy}`, sortOrder)
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      attempts,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getStatisticsByJob(retryJobId: string): Promise<{
    total: number;
    succeeded: number;
    failed: number;
    scheduled: number;
    inProgress: number;
    skipped: number;
  }> {
    const attempts = await this.attemptRepository.find({
      where: { retryJobId },
    });

    const stats = {
      total: attempts.length,
      succeeded: 0,
      failed: 0,
      scheduled: 0,
      inProgress: 0,
      skipped: 0,
    };

    for (const attempt of attempts) {
      switch (attempt.status) {
        case RetryAttemptStatus.SUCCEEDED:
          stats.succeeded++;
          break;
        case RetryAttemptStatus.FAILED:
          stats.failed++;
          break;
        case RetryAttemptStatus.SCHEDULED:
          stats.scheduled++;
          break;
        case RetryAttemptStatus.IN_PROGRESS:
          stats.inProgress++;
          break;
        case RetryAttemptStatus.SKIPPED:
          stats.skipped++;
          break;
      }
    }

    return stats;
  }
}
