import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { StripeService } from '../stripe/stripe.service';
import { PaypalService } from '../paypal/paypal.service';
import { GoCardlessService } from '../gocardless/gocardless.service';
import { SlimpayService } from '../slimpay/slimpay.service';
import { MultiSafepayService } from '../multisafepay/multisafepay.service';
import { EmerchantpayService } from '../emerchantpay/emerchantpay.service';
import type {
  GetPSPAccountsRequest,
  PSPAccountsSummaryResponse,
} from '@crm/proto/payments';

@Controller()
export class PspAccountsController {
  private readonly logger = new Logger(PspAccountsController.name);

  constructor(
    private readonly stripeService: StripeService,
    private readonly paypalService: PaypalService,
    private readonly goCardlessService: GoCardlessService,
    private readonly slimpayService: SlimpayService,
    private readonly multisafepayService: MultiSafepayService,
    private readonly emerchantpayService: EmerchantpayService,
  ) {}

  @GrpcMethod('PaymentService', 'GetPSPAccountsSummary')
  async getPSPAccountsSummary(data: GetPSPAccountsRequest): Promise<PSPAccountsSummaryResponse> {
    try {
      this.logger.log(`GetPSPAccountsSummary for societe: ${data.societe_id}`);

      const [stripeInfo, paypalInfo, gocardlessInfo, slimpayInfo, multisafepayInfo, emerchantpayInfo] = await Promise.all([
        this.stripeService.getAccountInfo(data.societe_id),
        this.paypalService.getAccountInfo(data.societe_id),
        this.goCardlessService.getAccountInfo(data.societe_id),
        this.slimpayService.getAccountInfo(data.societe_id),
        this.multisafepayService.getAccountInfo(data.societe_id),
        this.emerchantpayService.getAccountInfo(data.societe_id),
      ]);

      const [stripeAccount, paypalAccount, gocardlessAccount, slimpayAccount, multisafepayAccount, emerchantpayAccount] = await Promise.all([
        this.stripeService.getAccountBySocieteId(data.societe_id),
        this.paypalService.getAccountBySocieteId(data.societe_id),
        this.goCardlessService.getAccountBySocieteId(data.societe_id),
        this.slimpayService.getAccountBySocieteId(data.societe_id),
        this.multisafepayService.getAccountBySocieteId(data.societe_id),
        this.emerchantpayService.getAccountBySocieteId(data.societe_id),
      ]);

      return {
        stripe: stripeAccount
          ? {
              id: stripeAccount.id,
              name: stripeAccount.nom,
              is_active: stripeAccount.actif,
              is_live_mode: stripeInfo.testMode === false,
              is_configured: stripeInfo.configured,
            }
          : undefined,
        paypal: paypalAccount
          ? {
              id: paypalAccount.id,
              name: paypalAccount.nom,
              is_active: paypalAccount.actif,
              is_live_mode: paypalInfo.sandboxMode === false,
              is_configured: paypalInfo.configured,
            }
          : undefined,
        gocardless: gocardlessAccount
          ? {
              id: gocardlessAccount.id,
              name: gocardlessAccount.nom,
              is_active: gocardlessAccount.actif,
              is_live_mode: gocardlessInfo.sandboxMode === false,
              is_configured: gocardlessInfo.configured,
            }
          : undefined,
        emerchantpay: emerchantpayAccount
          ? {
              id: emerchantpayAccount.id,
              name: emerchantpayAccount.nom,
              is_active: emerchantpayAccount.actif,
              is_live_mode: emerchantpayInfo.testMode === false,
              is_configured: emerchantpayInfo.configured,
            }
          : undefined,
        slimpay: slimpayAccount
          ? {
              id: slimpayAccount.id,
              name: slimpayAccount.nom,
              is_active: slimpayAccount.actif,
              is_live_mode: slimpayInfo.testMode === false,
              is_configured: slimpayInfo.configured,
            }
          : undefined,
        multisafepay: multisafepayAccount
          ? {
              id: multisafepayAccount.id,
              name: multisafepayAccount.nom,
              is_active: multisafepayAccount.actif,
              is_live_mode: multisafepayInfo.testMode === false,
              is_configured: multisafepayInfo.configured,
            }
          : undefined,
      };
    } catch (e: unknown) {
      this.logger.error('GetPSPAccountsSummary failed', e);
      throw new RpcException({ code: status.INTERNAL, message: e instanceof Error ? e.message : String(e) });
    }
  }
}
