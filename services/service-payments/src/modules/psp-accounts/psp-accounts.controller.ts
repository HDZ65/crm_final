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
      this.logger.log(`GetPSPAccountsSummary for societe: ${data.societeId}`);

      const [stripeInfo, paypalInfo, gocardlessInfo, slimpayInfo, multisafepayInfo, emerchantpayInfo] = await Promise.all([
        this.stripeService.getAccountInfo(data.societeId),
        this.paypalService.getAccountInfo(data.societeId),
        this.goCardlessService.getAccountInfo(data.societeId),
        this.slimpayService.getAccountInfo(data.societeId),
        this.multisafepayService.getAccountInfo(data.societeId),
        this.emerchantpayService.getAccountInfo(data.societeId),
      ]);

      const [stripeAccount, paypalAccount, gocardlessAccount, slimpayAccount, multisafepayAccount, emerchantpayAccount] = await Promise.all([
        this.stripeService.getAccountBySocieteId(data.societeId),
        this.paypalService.getAccountBySocieteId(data.societeId),
        this.goCardlessService.getAccountBySocieteId(data.societeId),
        this.slimpayService.getAccountBySocieteId(data.societeId),
        this.multisafepayService.getAccountBySocieteId(data.societeId),
        this.emerchantpayService.getAccountBySocieteId(data.societeId),
      ]);

      return {
        stripe: stripeAccount
          ? {
              id: stripeAccount.id,
              name: stripeAccount.nom,
              isActive: stripeAccount.actif,
              isLiveMode: stripeInfo.testMode === false,
              isConfigured: stripeInfo.configured,
            }
          : undefined,
        paypal: paypalAccount
          ? {
              id: paypalAccount.id,
              name: paypalAccount.nom,
              isActive: paypalAccount.actif,
              isLiveMode: paypalInfo.sandboxMode === false,
              isConfigured: paypalInfo.configured,
            }
          : undefined,
        gocardless: gocardlessAccount
          ? {
              id: gocardlessAccount.id,
              name: gocardlessAccount.nom,
              isActive: gocardlessAccount.actif,
              isLiveMode: gocardlessInfo.sandboxMode === false,
              isConfigured: gocardlessInfo.configured,
            }
          : undefined,
        emerchantpay: emerchantpayAccount
          ? {
              id: emerchantpayAccount.id,
              name: emerchantpayAccount.nom,
              isActive: emerchantpayAccount.actif,
              isLiveMode: emerchantpayInfo.testMode === false,
              isConfigured: emerchantpayInfo.configured,
            }
          : undefined,
        slimpay: slimpayAccount
          ? {
              id: slimpayAccount.id,
              name: slimpayAccount.nom,
              isActive: slimpayAccount.actif,
              isLiveMode: slimpayInfo.testMode === false,
              isConfigured: slimpayInfo.configured,
            }
          : undefined,
        multisafepay: multisafepayAccount
          ? {
              id: multisafepayAccount.id,
              name: multisafepayAccount.nom,
              isActive: multisafepayAccount.actif,
              isLiveMode: multisafepayInfo.testMode === false,
              isConfigured: multisafepayInfo.configured,
            }
          : undefined,
      };
    } catch (e: unknown) {
      this.logger.error('GetPSPAccountsSummary failed', e);
      throw new RpcException({ code: status.INTERNAL, message: e instanceof Error ? e.message : String(e) });
    }
  }
}
