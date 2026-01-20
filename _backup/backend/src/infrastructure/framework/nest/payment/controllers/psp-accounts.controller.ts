import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { GetStripeAccountUseCase } from '../../../../../applications/usecase/stripe-account';
import { GetGoCardlessAccountUseCase } from '../../../../../applications/usecase/gocardless-account';
import { GetEmerchantpayAccountUseCase } from '../../../../../applications/usecase/emerchantpay-account';
import { GetSlimpayAccountUseCase } from '../../../../../applications/usecase/slimpay-account';
import { GetMultisafepayAccountUseCase } from '../../../../../applications/usecase/multisafepay-account';
import { GetPaypalAccountUseCase } from '../../../../../applications/usecase/paypal-account';

interface PspAccountSummary {
  id: string;
  societeId: string;
  nom: string;
  environment: string;
  actif: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface AllPspAccountsResponse {
  stripe: PspAccountSummary | null;
  gocardless: PspAccountSummary | null;
  emerchantpay: PspAccountSummary | null;
  slimpay: PspAccountSummary | null;
  multisafepay: PspAccountSummary | null;
  paypal: PspAccountSummary | null;
}

@ApiTags('PSP Accounts')
@Controller('psp-accounts')
export class PspAccountsController {
  constructor(
    private readonly stripeUseCase: GetStripeAccountUseCase,
    private readonly gocardlessUseCase: GetGoCardlessAccountUseCase,
    private readonly emerchantpayUseCase: GetEmerchantpayAccountUseCase,
    private readonly slimpayUseCase: GetSlimpayAccountUseCase,
    private readonly multisafepayUseCase: GetMultisafepayAccountUseCase,
    private readonly paypalUseCase: GetPaypalAccountUseCase,
  ) {}

  @Get('societe/:societeId')
  @ApiOperation({ summary: 'Récupérer tous les comptes PSP d\'une société' })
  @ApiParam({ name: 'societeId', description: 'ID de la société' })
  @ApiResponse({
    status: 200,
    description: 'Tous les comptes PSP de la société',
  })
  async findAllBySocieteId(
    @Param('societeId', ParseUUIDPipe) societeId: string,
  ): Promise<AllPspAccountsResponse> {
    // Exécuter toutes les requêtes en parallèle
    const [stripe, gocardless, emerchantpay, slimpay, multisafepay, paypal] = await Promise.all([
      this.stripeUseCase.findBySocieteId(societeId).catch(() => null),
      this.gocardlessUseCase.findBySocieteId(societeId).catch(() => null),
      this.emerchantpayUseCase.findBySocieteId(societeId).catch(() => null),
      this.slimpayUseCase.findBySocieteId(societeId).catch(() => null),
      this.multisafepayUseCase.findBySocieteId(societeId).catch(() => null),
      this.paypalUseCase.findBySocieteId(societeId).catch(() => null),
    ]);

    // Mapper vers un format unifié (sans les clés sensibles)
    const mapToSummary = (account: any): PspAccountSummary | null => {
      if (!account) return null;
      return {
        id: account.id,
        societeId: account.societeId,
        nom: account.nom,
        environment: account.environment,
        actif: account.actif,
        createdAt: account.createdAt,
        updatedAt: account.updatedAt,
      };
    };

    return {
      stripe: mapToSummary(stripe),
      gocardless: mapToSummary(gocardless),
      emerchantpay: mapToSummary(emerchantpay),
      slimpay: mapToSummary(slimpay),
      multisafepay: mapToSummary(multisafepay),
      paypal: mapToSummary(paypal),
    };
  }
}
