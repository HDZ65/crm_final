import {
  Injectable,
  Logger,
  OnModuleInit,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ProviderStatusMappingEntity,
  RetryAdvice,
  AlertEntity,
  AlertScope,
  AlertSeverity,
} from '../../../../../domain/payments/entities';

interface StatusMappingResult {
  statusCode: string;
  retryAdvice: string;
}

@Injectable()
export class ProviderStatusMappingService implements OnModuleInit {
  private readonly logger = new Logger(ProviderStatusMappingService.name);
  private cache: Map<string, ProviderStatusMappingEntity> = new Map();

  constructor(
    @InjectRepository(ProviderStatusMappingEntity)
    private readonly mappingRepository: Repository<ProviderStatusMappingEntity>,
    @InjectRepository(AlertEntity)
    private readonly alertRepository: Repository<AlertEntity>,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.loadCache();
  }

  /**
   * Load all provider status mappings into memory cache
   */
  private async loadCache(): Promise<void> {
    try {
      const mappings = await this.mappingRepository.find();
      this.cache.clear();

      for (const mapping of mappings) {
        const key = this.getCacheKey(mapping.providerId, mapping.providerRawStatus, mapping.providerRawReason || undefined);
        this.cache.set(key, mapping);
      }

      this.logger.log(`Loaded ${mappings.length} provider status mappings into cache`);
    } catch (error) {
      this.logger.error('Failed to load provider status mappings cache', error);
      throw error;
    }
  }

  /**
   * Map a PSP-specific raw status to internal payment status code
   * If mapping not found, creates UNKNOWN_STATUS_MAPPING alert and returns API_ERROR
   */
  async mapStatus(
    provider: string,
    rawStatus: string,
    rawReason?: string,
  ): Promise<StatusMappingResult> {
    const key = this.getCacheKey(provider, rawStatus, rawReason);
    const mapping = this.cache.get(key);

    if (!mapping) {
      // Create alert for unknown status mapping
      await this.createUnknownStatusAlert(provider, rawStatus, rawReason);

      return {
        statusCode: 'API_ERROR',
        retryAdvice: 'MANUAL',
      };
    }

    return {
      statusCode: mapping.statusCode,
      retryAdvice: mapping.retryAdvice,
    };
  }

  /**
   * Invalidate cache and reload from database
   */
  async invalidateCache(): Promise<void> {
    this.logger.log('Invalidating provider status mapping cache');
    await this.loadCache();
  }

  /**
   * List all provider status mappings, optionally filtered by provider
   */
  async listMappings(providerId?: string): Promise<ProviderStatusMappingEntity[]> {
    if (providerId) {
      return this.mappingRepository.find({
        where: { providerId },
        order: { createdAt: 'DESC' },
      });
    }

    return this.mappingRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Update a provider status mapping
   */
  async updateMapping(
    id: string,
    data: Partial<ProviderStatusMappingEntity>,
  ): Promise<ProviderStatusMappingEntity> {
    const mapping = await this.mappingRepository.findOne({ where: { id } });

    if (!mapping) {
      throw new NotFoundException(`Provider status mapping with id ${id} not found`);
    }

    // Update allowed fields
    if (data.statusCode !== undefined) {
      mapping.statusCode = data.statusCode;
    }
    if (data.retryAdvice !== undefined) {
      mapping.retryAdvice = data.retryAdvice;
    }

    const updated = await this.mappingRepository.save(mapping);

    // Invalidate cache after update
    await this.invalidateCache();

    return updated;
  }

  /**
   * Generate cache key from provider, raw status, and optional reason
   */
  private getCacheKey(provider: string, rawStatus: string, rawReason?: string): string {
    const reason = rawReason || '';
    return `${provider}:${rawStatus}:${reason}`;
  }

  /**
   * Create an alert for unknown status mapping
   */
  private async createUnknownStatusAlert(
    provider: string,
    rawStatus: string,
    rawReason?: string,
  ): Promise<void> {
    try {
      const alert = this.alertRepository.create({
        scope: AlertScope.PROVIDER,
        scopeRef: provider,
        severity: AlertSeverity.WARNING,
        code: 'UNKNOWN_STATUS_MAPPING',
        message: `Unknown status mapping for provider ${provider}: ${rawStatus}${rawReason ? ` (${rawReason})` : ''}`,
        notifiedChannels: [],
      });

      await this.alertRepository.save(alert);
      this.logger.warn(
        `Created alert for unknown status mapping: provider=${provider}, status=${rawStatus}, reason=${rawReason}`,
      );
    } catch (error) {
      this.logger.error('Failed to create unknown status mapping alert', error);
      // Don't throw - alert creation failure should not block status mapping
    }
  }
}
