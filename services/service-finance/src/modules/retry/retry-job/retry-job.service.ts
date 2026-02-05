import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { RetryJobEntity, RetryJobStatus } from './entities/retry-job.entity';
import type { PaginationRequest } from '@crm/proto/retry';

export interface ListRetryJobsInput {
  organisationId: string;
  status?: RetryJobStatus;
  isManual?: boolean;
  targetDateFrom?: Date;
  targetDateTo?: Date;
  pagination?: Partial<PaginationRequest>;
}

@Injectable()
export class RetryJobService {
  private readonly logger = new Logger(RetryJobService.name);

  constructor(
    @InjectRepository(RetryJobEntity)
    private readonly jobRepository: Repository<RetryJobEntity>,
  ) {}

  async findById(id: string): Promise<RetryJobEntity> {
    const job = await this.jobRepository.findOne({
      where: { id },
    });

    if (!job) {
      throw new RpcException({
        code: status.NOT_FOUND,
        message: `Retry job ${id} not found`,
      });
    }

    return job;
  }

  async findAll(input: ListRetryJobsInput): Promise<{
    jobs: RetryJobEntity[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const page = input.pagination?.page ?? 1;
    const limit = input.pagination?.limit ?? 20;
    const sortBy = input.pagination?.sort_by || 'startedAt';
    const sortOrder = (input.pagination?.sort_order?.toUpperCase() as 'ASC' | 'DESC') || 'DESC';

    const queryBuilder = this.jobRepository
      .createQueryBuilder('job')
      .where('job.organisationId = :organisationId', { organisationId: input.organisationId });

    if (input.status) {
      queryBuilder.andWhere('job.status = :status', { status: input.status });
    }

    if (input.isManual !== undefined) {
      queryBuilder.andWhere('job.isManual = :isManual', { isManual: input.isManual });
    }

    if (input.targetDateFrom && input.targetDateTo) {
      queryBuilder.andWhere('job.targetDate BETWEEN :from AND :to', {
        from: input.targetDateFrom,
        to: input.targetDateTo,
      });
    } else if (input.targetDateFrom) {
      queryBuilder.andWhere('job.targetDate >= :from', { from: input.targetDateFrom });
    } else if (input.targetDateTo) {
      queryBuilder.andWhere('job.targetDate <= :to', { to: input.targetDateTo });
    }

    const [jobs, total] = await queryBuilder
      .orderBy(`job.${sortBy}`, sortOrder)
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      jobs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getRecentJobs(
    organisationId: string,
    limit: number = 10,
  ): Promise<RetryJobEntity[]> {
    return this.jobRepository.find({
      where: { organisationId },
      order: { startedAt: 'DESC' },
      take: limit,
    });
  }

  async getJobStatistics(
    organisationId: string,
    dateFrom?: Date,
    dateTo?: Date,
  ): Promise<{
    totalJobs: number;
    completedJobs: number;
    failedJobs: number;
    partialJobs: number;
    totalAttempts: number;
    successfulAttempts: number;
    failedAttempts: number;
    avgSuccessRate: number;
  }> {
    const queryBuilder = this.jobRepository
      .createQueryBuilder('job')
      .where('job.organisationId = :organisationId', { organisationId });

    if (dateFrom) {
      queryBuilder.andWhere('job.startedAt >= :dateFrom', { dateFrom });
    }
    if (dateTo) {
      queryBuilder.andWhere('job.startedAt <= :dateTo', { dateTo });
    }

    const jobs = await queryBuilder.getMany();

    const stats = {
      totalJobs: jobs.length,
      completedJobs: 0,
      failedJobs: 0,
      partialJobs: 0,
      totalAttempts: 0,
      successfulAttempts: 0,
      failedAttempts: 0,
      avgSuccessRate: 0,
    };

    for (const job of jobs) {
      switch (job.status) {
        case RetryJobStatus.JOB_COMPLETED:
          stats.completedJobs++;
          break;
        case RetryJobStatus.JOB_FAILED:
          stats.failedJobs++;
          break;
        case RetryJobStatus.JOB_PARTIAL:
          stats.partialJobs++;
          break;
      }

      stats.totalAttempts += job.totalAttempts ?? 0;
      stats.successfulAttempts += job.successfulAttempts ?? 0;
      stats.failedAttempts += job.failedAttempts ?? 0;
    }

    if (stats.totalAttempts > 0) {
      stats.avgSuccessRate = (stats.successfulAttempts / stats.totalAttempts) * 100;
    }

    return stats;
  }
}
