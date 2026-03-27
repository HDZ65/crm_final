import { status } from '@grpc/grpc-js';
import { Controller } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { BadgeType } from '../../../domain/products/entities/product-badge.entity';
import { BadgeComputeService } from '../../../domain/products/services/badge-compute.service';

interface AddProductBadgeRequest {
  product_id: string;
  badge_type: string;
  start_at?: string;
  end_at?: string;
  created_by?: string;
}

interface RemoveProductBadgeRequest {
  product_id: string;
  badge_type: string;
}

interface ListProductBadgesRequest {
  product_id: string;
}

@Controller()
export class ProductBadgeGrpcController {
  constructor(private readonly badgeComputeService: BadgeComputeService) {}

  @GrpcMethod('ProductBadgeService', 'AddProductBadge')
  async addProductBadge(request: AddProductBadgeRequest) {
    if (!request.product_id) {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: 'product_id is required',
      });
    }

    if (!request.badge_type) {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: 'badge_type is required',
      });
    }

    try {
      const badge = await this.badgeComputeService.addBadge(request.product_id, request.badge_type as BadgeType, {
        startAt: request.start_at ? new Date(request.start_at) : undefined,
        endAt: request.end_at ? new Date(request.end_at) : undefined,
        createdBy: request.created_by,
        isAutomatic: false,
      });

      return {
        id: badge.id,
        product_id: badge.productId,
        badge_type: badge.badgeType,
        is_automatic: badge.isAutomatic,
        start_at: badge.startAt ? badge.startAt.toISOString() : null,
        end_at: badge.endAt ? badge.endAt.toISOString() : null,
        created_by: badge.createdBy ?? null,
        created_at: badge.createdAt.toISOString(),
      };
    } catch (error) {
      if (error instanceof RpcException) {
        throw error;
      }
      const message = error instanceof Error ? error.message : 'Failed to add badge';
      throw new RpcException({ code: status.INTERNAL, message });
    }
  }

  @GrpcMethod('ProductBadgeService', 'RemoveProductBadge')
  async removeProductBadge(request: RemoveProductBadgeRequest) {
    if (!request.product_id) {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: 'product_id is required',
      });
    }

    if (!request.badge_type) {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: 'badge_type is required',
      });
    }

    try {
      await this.badgeComputeService.removeBadge(request.product_id, request.badge_type as BadgeType);
      return { success: true };
    } catch (error) {
      if (error instanceof RpcException) {
        throw error;
      }
      const message = error instanceof Error ? error.message : 'Failed to remove badge';
      throw new RpcException({ code: status.INTERNAL, message });
    }
  }

  @GrpcMethod('ProductBadgeService', 'ListProductBadges')
  async listProductBadges(request: ListProductBadgesRequest) {
    if (!request.product_id) {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: 'product_id is required',
      });
    }

    try {
      const badges = await this.badgeComputeService.getActiveBadges(request.product_id);
      return {
        badges: badges.map((badge) => ({
          id: badge.id,
          product_id: badge.productId,
          badge_type: badge.badgeType,
          is_automatic: badge.isAutomatic,
          start_at: badge.startAt ? badge.startAt.toISOString() : null,
          end_at: badge.endAt ? badge.endAt.toISOString() : null,
          created_by: badge.createdBy ?? null,
          created_at: badge.createdAt.toISOString(),
        })),
      };
    } catch (error) {
      if (error instanceof RpcException) {
        throw error;
      }
      const message = error instanceof Error ? error.message : 'Failed to list badges';
      throw new RpcException({ code: status.INTERNAL, message });
    }
  }
}
