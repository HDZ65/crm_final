import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { ProviderStatusMappingService } from '../../persistence/typeorm/repositories/payments/provider-status-mapping.service';
import {
  ListProviderStatusMappingsRequest,
  ListProviderStatusMappingsResponse,
  UpdateProviderStatusMappingRequest,
  ProviderStatusMappingResponse,
} from '@proto/payment';

@Controller()
export class StatusMappingController {
  constructor(
    private readonly statusMappingService: ProviderStatusMappingService,
  ) {}

  @GrpcMethod('PaymentService', 'ListProviderStatusMappings')
  async listProviderStatusMappings(
    data: ListProviderStatusMappingsRequest,
  ): Promise<ListProviderStatusMappingsResponse> {
    const mappings = await this.statusMappingService.listMappings(
      data.provider_name,
    );

    return {
      mappings: mappings.map((m) => this.toProtoResponse(m)),
      total: mappings.length,
    };
  }

  @GrpcMethod('PaymentService', 'UpdateProviderStatusMapping')
  async updateProviderStatusMapping(
    data: UpdateProviderStatusMappingRequest,
  ): Promise<ProviderStatusMappingResponse> {
    const updated = await this.statusMappingService.updateMapping(data.id, {
      statusCode: data.internal_status,
      retryAdvice: data.retry_advice as any,
    });

    return this.toProtoResponse(updated);
  }

  private toProtoResponse(
    mapping: any,
  ): ProviderStatusMappingResponse {
    return {
      id: mapping.id,
      provider_name: mapping.providerId,
      provider_status: mapping.providerRawStatus,
      internal_status: mapping.statusCode,
      event_type: '', // Not stored in entity, can be derived from status
      rejection_category: '', // Not stored in entity
      retry_advice: mapping.retryAdvice,
      is_active: true, // All mappings are active
      updated_at: mapping.updatedAt?.toISOString() || new Date().toISOString(),
    };
  }
}
