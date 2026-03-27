import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import type {
  ListPaymentsRequest,
  ListPaymentsResponse,
  GetPaymentStatsRequest,
  GetPaymentStatsResponse,
} from '@proto/payment';
import { PaymentQueryService } from '../../../../application/queries/payment-query.service';

/**
 * PaymentQuery gRPC Controller — Exposes payment listing and stats RPCs.
 *
 * Proto RPCs:
 *   - ListPayments(ListPaymentsRequest) → ListPaymentsResponse
 *   - GetPaymentStats(GetPaymentStatsRequest) → GetPaymentStatsResponse
 *
 * CDC: Page Paiements — filtres, pagination, KPI cards
 */
@Controller()
export class PaymentQueryController {
  private readonly logger = new Logger(PaymentQueryController.name);

  constructor(private readonly paymentQueryService: PaymentQueryService) {}

  /**
   * List payments with filtering and pagination.
   * Supports 12 optional filters + global search.
   *
   * Proto: ListPaymentsRequest → ListPaymentsResponse
   */
  @GrpcMethod('PaymentService', 'ListPayments')
  async listPayments(data: ListPaymentsRequest): Promise<ListPaymentsResponse> {
    this.logger.debug(
      `ListPayments: societe=${data.societe_id}, page=${data.page}, limit=${data.limit}, status=${data.status}`,
    );

    return this.paymentQueryService.listPayments(data);
  }

  /**
   * Get payment statistics aggregated by status.
   * Calculates counts, sums, averages, and reject rate.
   *
   * Proto: GetPaymentStatsRequest → GetPaymentStatsResponse
   */
  @GrpcMethod('PaymentService', 'GetPaymentStats')
  async getPaymentStats(data: GetPaymentStatsRequest): Promise<GetPaymentStatsResponse> {
    this.logger.debug(
      `GetPaymentStats: societe=${data.societe_id}, from=${data.date_from}, to=${data.date_to}`,
    );

    return this.paymentQueryService.getPaymentStats(data);
  }
}
