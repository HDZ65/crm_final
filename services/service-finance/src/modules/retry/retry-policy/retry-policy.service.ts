import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { RetryPolicyEntity } from './entities/retry-policy.entity';
import type {
  CreateRetryPolicyRequest,
  UpdateRetryPolicyRequest,
  PaginationRequest,
} from '@crm/proto/retry';

export interface CreateRetryPolicyInput {
  organisationId: string;
  societeId?: string;
  productId?: string;
  channelId?: string;
  name: string;
  description?: string;
  retryDelaysDays: number[];
  maxAttempts: number;
  maxTotalDays: number;
  retryOnAm04: boolean;
  retryableCodes?: string[];
  nonRetryableCodes?: string[];
  stopOnPaymentSettled: boolean;
  stopOnContractCancelled: boolean;
  stopOnMandateRevoked: boolean;
  backoffStrategy?: string;
  isDefault?: boolean;
  priority?: number;
}

export interface UpdateRetryPolicyInput {
  id: string;
  name?: string;
  description?: string;
  retryDelaysDays?: number[];
  maxAttempts?: number;
  maxTotalDays?: number;
  retryOnAm04?: boolean;
  retryableCodes?: string[];
  nonRetryableCodes?: string[];
  stopOnPaymentSettled?: boolean;
  stopOnContractCancelled?: boolean;
  stopOnMandateRevoked?: boolean;
  backoffStrategy?: string;
  isActive?: boolean;
  isDefault?: boolean;
  priority?: number;
}

@Injectable()
export class RetryPolicyService {
  private readonly logger = new Logger(RetryPolicyService.name);

  constructor(
    @InjectRepository(RetryPolicyEntity)
    private readonly policyRepository: Repository<RetryPolicyEntity>,
  ) {}

  async create(input: CreateRetryPolicyInput): Promise<RetryPolicyEntity> {
    this.logger.log(`Creating retry policy: ${input.name} for org ${input.organisationId}`);

    const policy = this.policyRepository.create({
      organisationId: input.organisationId,
      societeId: input.societeId || null,
      productId: input.productId || null,
      channelId: input.channelId || null,
      name: input.name,
      description: input.description || null,
      retryDelaysDays: input.retryDelaysDays,
      maxAttempts: input.maxAttempts,
      maxTotalDays: input.maxTotalDays,
      retryOnAm04: input.retryOnAm04,
      retryableCodes: input.retryableCodes || [],
      nonRetryableCodes: input.nonRetryableCodes || [],
      stopOnPaymentSettled: input.stopOnPaymentSettled,
      stopOnContractCancelled: input.stopOnContractCancelled,
      stopOnMandateRevoked: input.stopOnMandateRevoked,
      backoffStrategy: input.backoffStrategy || 'FIXED',
      isDefault: input.isDefault || false,
      priority: input.priority || 0,
      isActive: true,
    });

    return this.policyRepository.save(policy);
  }

  async update(input: UpdateRetryPolicyInput): Promise<RetryPolicyEntity> {
    const policy = await this.policyRepository.findOne({
      where: { id: input.id },
    });

    if (!policy) {
      throw new RpcException({
        code: status.NOT_FOUND,
        message: `Retry policy ${input.id} not found`,
      });
    }

    if (input.name !== undefined) policy.name = input.name;
    if (input.description !== undefined) policy.description = input.description || null;
    if (input.retryDelaysDays !== undefined) policy.retryDelaysDays = input.retryDelaysDays;
    if (input.maxAttempts !== undefined) policy.maxAttempts = input.maxAttempts;
    if (input.maxTotalDays !== undefined) policy.maxTotalDays = input.maxTotalDays;
    if (input.retryOnAm04 !== undefined) policy.retryOnAm04 = input.retryOnAm04;
    if (input.retryableCodes !== undefined) policy.retryableCodes = input.retryableCodes;
    if (input.nonRetryableCodes !== undefined) policy.nonRetryableCodes = input.nonRetryableCodes;
    if (input.stopOnPaymentSettled !== undefined) policy.stopOnPaymentSettled = input.stopOnPaymentSettled;
    if (input.stopOnContractCancelled !== undefined) policy.stopOnContractCancelled = input.stopOnContractCancelled;
    if (input.stopOnMandateRevoked !== undefined) policy.stopOnMandateRevoked = input.stopOnMandateRevoked;
    if (input.backoffStrategy !== undefined) policy.backoffStrategy = input.backoffStrategy;
    if (input.isActive !== undefined) policy.isActive = input.isActive;
    if (input.isDefault !== undefined) policy.isDefault = input.isDefault;
    if (input.priority !== undefined) policy.priority = input.priority;

    return this.policyRepository.save(policy);
  }

  async findById(id: string): Promise<RetryPolicyEntity> {
    const policy = await this.policyRepository.findOne({
      where: { id },
    });

    if (!policy) {
      throw new RpcException({
        code: status.NOT_FOUND,
        message: `Retry policy ${id} not found`,
      });
    }

    return policy;
  }

  async findAll(input: {
    organisationId: string;
    societeId?: string;
    activeOnly?: boolean;
    pagination?: { page?: number; limit?: number; sortBy?: string; sortOrder?: string };
  }): Promise<{ policies: RetryPolicyEntity[]; pagination: { total: number; page: number; limit: number; totalPages: number } }> {
    const page = input.pagination?.page ?? 1;
    const limit = input.pagination?.limit ?? 20;
    const sortBy = input.pagination?.sortBy || 'priority';
    const sortOrder = (input.pagination?.sortOrder?.toUpperCase() as 'ASC' | 'DESC') || 'DESC';

    const queryBuilder = this.policyRepository
      .createQueryBuilder('policy')
      .where('policy.organisationId = :organisationId', { organisationId: input.organisationId });

    if (input.societeId) {
      queryBuilder.andWhere('(policy.societeId = :societeId OR policy.societeId IS NULL)', { societeId: input.societeId });
    }

    if (input.activeOnly) {
      queryBuilder.andWhere('policy.isActive = :isActive', { isActive: true });
    }

    const [policies, total] = await queryBuilder
      .orderBy(`policy.${sortBy}`, sortOrder)
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      policies,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findApplicablePolicy(organisationId: string, societeId?: string, productId?: string): Promise<RetryPolicyEntity | null> {
    const queryBuilder = this.policyRepository
      .createQueryBuilder('policy')
      .where('policy.organisationId = :organisationId', { organisationId })
      .andWhere('policy.isActive = :isActive', { isActive: true });

    if (productId) {
      queryBuilder.andWhere('(policy.productId = :productId OR policy.productId IS NULL)', { productId });
    }
    if (societeId) {
      queryBuilder.andWhere('(policy.societeId = :societeId OR policy.societeId IS NULL)', { societeId });
    }

    return queryBuilder
      .orderBy('policy.priority', 'DESC')
      .addOrderBy('policy.societeId', 'DESC', 'NULLS LAST')
      .addOrderBy('policy.productId', 'DESC', 'NULLS LAST')
      .getOne();
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.policyRepository.delete(id);
    return (result.affected ?? 0) > 0;
  }
}
