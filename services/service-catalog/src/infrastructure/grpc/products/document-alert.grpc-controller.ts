import { status } from '@grpc/grpc-js';
import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { DocumentAlertService } from '../../../domain/products/services/document-alert.service';

interface ListDocumentAlertsRequest {
  status?: string;
  severity?: string;
  product_id?: string;
}

interface AcknowledgeDocumentAlertRequest {
  id: string;
  acknowledged_by: string;
}

interface GetDocumentAlertCountRequest {
  product_id: string;
}

@Controller()
export class DocumentAlertGrpcController {
  private readonly logger = new Logger(DocumentAlertGrpcController.name);

  constructor(private readonly documentAlertService: DocumentAlertService) {}

  @GrpcMethod('DocumentAlertService', 'ListDocumentAlerts')
  async listDocumentAlerts(request: ListDocumentAlertsRequest) {
    try {
      const alerts = await this.documentAlertService.listAlerts({
        status: request.status,
        severity: request.severity,
        productId: request.product_id,
      });

      return {
        alerts: alerts.map((a) => ({
          id: a.id,
          product_id: a.productId,
          product_document_id: a.productDocumentId ?? '',
          alert_type: a.alertType,
          severity: a.severity,
          message: a.message,
          acknowledged: a.acknowledged,
          acknowledged_by: a.acknowledgedBy ?? '',
          acknowledged_at: a.acknowledgedAt?.toISOString() ?? '',
          created_at: a.createdAt.toISOString(),
        })),
      };
    } catch (error) {
      this.logger.error('ListDocumentAlerts failed', error);
      throw new RpcException({
        code: status.INTERNAL,
        message: error instanceof Error ? error.message : 'Internal error',
      });
    }
  }

  @GrpcMethod('DocumentAlertService', 'AcknowledgeDocumentAlert')
  async acknowledgeDocumentAlert(request: AcknowledgeDocumentAlertRequest) {
    if (!request.id) {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: 'id is required',
      });
    }

    if (!request.acknowledged_by) {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: 'acknowledged_by is required',
      });
    }

    try {
      const alert = await this.documentAlertService.acknowledgeAlert(request.id, request.acknowledged_by);

      return {
        id: alert.id,
        product_id: alert.productId,
        product_document_id: alert.productDocumentId ?? '',
        alert_type: alert.alertType,
        severity: alert.severity,
        message: alert.message,
        acknowledged: alert.acknowledged,
        acknowledged_by: alert.acknowledgedBy ?? '',
        acknowledged_at: alert.acknowledgedAt?.toISOString() ?? '',
        created_at: alert.createdAt.toISOString(),
      };
    } catch (error) {
      if (error instanceof RpcException) {
        throw error;
      }

      const message = error instanceof Error ? error.message : 'Internal error';
      const code = message.includes('not found') ? status.NOT_FOUND : status.INTERNAL;

      throw new RpcException({ code, message });
    }
  }

  @GrpcMethod('DocumentAlertService', 'GetDocumentAlertCount')
  async getDocumentAlertCount(request: GetDocumentAlertCountRequest) {
    if (!request.product_id) {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: 'product_id is required',
      });
    }

    try {
      const count = await this.documentAlertService.getAlertCountForProduct(request.product_id);

      return { count };
    } catch (error) {
      this.logger.error('GetDocumentAlertCount failed', error);
      throw new RpcException({
        code: status.INTERNAL,
        message: error instanceof Error ? error.message : 'Internal error',
      });
    }
  }
}
