import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { BadgeType, ProductBadgeEntity } from '../entities/product-badge.entity';

@Injectable()
export class BadgeComputeService {
  private readonly logger = new Logger(BadgeComputeService.name);

  constructor(
    @InjectRepository(ProductBadgeEntity)
    private readonly badgeRepo: Repository<ProductBadgeEntity>,
  ) {}

  async addBadge(
    productId: string,
    type: BadgeType,
    options?: {
      startAt?: Date;
      endAt?: Date;
      createdBy?: string;
      isAutomatic?: boolean;
    },
  ): Promise<ProductBadgeEntity> {
    try {
      const existing = await this.badgeRepo.findOne({
        where: { productId, badgeType: type },
      });

      if (existing) {
        existing.startAt = options?.startAt ?? existing.startAt;
        existing.endAt = options?.endAt ?? existing.endAt;
        existing.isAutomatic = options?.isAutomatic ?? existing.isAutomatic;
        return await this.badgeRepo.save(existing);
      }

      const badge = this.badgeRepo.create({
        productId,
        badgeType: type,
        isAutomatic: options?.isAutomatic ?? false,
        startAt: options?.startAt ?? null,
        endAt: options?.endAt ?? null,
        createdBy: options?.createdBy ?? null,
      });

      return await this.badgeRepo.save(badge);
    } catch (error) {
      this.logger.error(
        `Failed to add badge ${type} for product ${productId}: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  async removeBadge(productId: string, type: BadgeType): Promise<void> {
    try {
      await this.badgeRepo.delete({ productId, badgeType: type });
    } catch (error) {
      this.logger.error(
        `Failed to remove badge ${type} for product ${productId}: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  async getActiveBadges(productId: string): Promise<ProductBadgeEntity[]> {
    try {
      const now = new Date();
      return await this.badgeRepo
        .createQueryBuilder('badge')
        .where('badge.product_id = :productId', { productId })
        .andWhere('(badge.end_at IS NULL OR badge.end_at > :now)', { now })
        .orderBy('badge.created_at', 'ASC')
        .getMany();
    } catch (error) {
      this.logger.error(
        `Failed to get active badges for product ${productId}: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  async cleanNewBadges(): Promise<void> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const badgesToRemove = await this.badgeRepo
        .createQueryBuilder('badge')
        .innerJoin('produit_versions', 'version', 'version.produit_id = badge.product_id')
        .innerJoin('produit_publications', 'pub', 'pub.version_produit_id = version.id')
        .where('badge.badge_type = :type', { type: 'new' })
        .andWhere('pub.start_at < :cutoff', { cutoff: thirtyDaysAgo })
        .select('badge.id', 'id')
        .getRawMany<{ id: string }>();

      if (badgesToRemove.length === 0) {
        return;
      }

      const ids = badgesToRemove.map((r) => r.id);
      await this.badgeRepo.delete(ids);
      this.logger.log(`Cleaned ${ids.length} expired 'new' badge(s)`);
    } catch (error) {
      this.logger.error(`Failed to clean new badges: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  async cleanExpiredPromoBadges(): Promise<void> {
    try {
      const now = new Date();
      const expired = await this.badgeRepo.find({
        where: {
          badgeType: 'promo',
          endAt: LessThan(now),
        },
      });

      if (expired.length === 0) {
        return;
      }

      const ids = expired.map((b) => b.id);
      await this.badgeRepo.delete(ids);
      this.logger.log(`Cleaned ${ids.length} expired 'promo' badge(s)`);
    } catch (error) {
      this.logger.error(
        `Failed to clean expired promo badges: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  async syncBetaBadge(productId: string, lifecycleStatus: string): Promise<void> {
    try {
      if (lifecycleStatus === 'TEST') {
        await this.addBadge(productId, 'beta', { isAutomatic: true });
        this.logger.log(`Added beta badge for product ${productId} (status=TEST)`);
      } else {
        await this.removeBadge(productId, 'beta');
      }
    } catch (error) {
      this.logger.error(
        `Failed to sync beta badge for product ${productId}: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  async onProductPublished(productId: string): Promise<void> {
    try {
      await this.addBadge(productId, 'new', { isAutomatic: true });
      this.logger.log(`Added 'new' badge for published product ${productId}`);
    } catch (error) {
      this.logger.error(
        `Failed to add new badge on publication for product ${productId}: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }
}
