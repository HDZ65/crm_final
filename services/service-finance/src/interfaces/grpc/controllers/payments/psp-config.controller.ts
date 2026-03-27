import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { PspConfigService } from '../../../../infrastructure/persistence/typeorm/repositories/payments/psp-config.service';
import { PspConnectionTesterService } from '../../../../infrastructure/persistence/psp-connection-tester.service';
import { PspTypeEnum } from '../../../../domain/payments/repositories/IPspConfigRepository';

// ─── Request interfaces (matching proto messages) ───────────

interface SavePSPAccountRequest {
  societe_id: string;
  psp_type: string;
  nom: string;
  // Stripe
  stripe_secret_key?: string;
  stripe_publishable_key?: string;
  stripe_webhook_secret?: string;
  is_test_mode?: boolean;
  // GoCardless
  access_token?: string;
  webhook_secret?: string;
  is_sandbox?: boolean;
  // Slimpay
  app_name?: string;
  app_secret?: string;
  // MultiSafepay
  api_key?: string;
  // Emerchantpay
  api_login?: string;
  api_password?: string;
  terminal_token?: string;
  webhook_public_key?: string;
  // PayPal
  client_id?: string;
  client_secret?: string;
  webhook_id?: string;
}

interface GetPSPAccountRequest {
  societe_id: string;
  psp_type: string;
}

interface TestPSPConnectionRequest {
  societe_id: string;
  psp_type: string;
}

interface DeactivatePSPAccountRequest {
  societe_id: string;
  psp_type: string;
}

// ─── Response interfaces ────────────────────────────────────

interface PSPAccountSummary {
  id: string;
  name: string;
  is_active: boolean;
  is_live_mode: boolean;
  is_configured: boolean;
}

interface SavePSPAccountResponse {
  account: PSPAccountSummary;
}

interface GetPSPAccountResponse {
  id: string;
  societe_id: string;
  nom: string;
  psp_type: string;
  actif: boolean;
  created_at: string;
  updated_at: string;
  // Config fields
  stripe_secret_key?: string;
  stripe_publishable_key?: string;
  stripe_webhook_secret?: string;
  is_test_mode?: boolean;
  access_token?: string;
  webhook_secret?: string;
  is_sandbox?: boolean;
  app_name?: string;
  app_secret?: string;
  api_key?: string;
  api_login?: string;
  api_password?: string;
  terminal_token?: string;
  webhook_public_key?: string;
  client_id?: string;
  client_secret?: string;
  webhook_id?: string;
}

interface TestPSPConnectionResponse {
  success: boolean;
  message: string;
  details?: string;
}

interface DeactivatePSPAccountResponse {
  success: boolean;
  message: string;
}

// ─── Controller ─────────────────────────────────────────────

@Controller()
export class PspConfigController {
  private readonly logger = new Logger(PspConfigController.name);

  constructor(
    private readonly pspConfigRepository: PspConfigService,
    private readonly pspConnectionTester: PspConnectionTesterService,
  ) {}

  @GrpcMethod('PaymentService', 'SavePSPAccount')
  async savePSPAccount(
    data: SavePSPAccountRequest,
  ): Promise<SavePSPAccountResponse> {
    const pspType = this.toPspTypeEnum(data.psp_type);
    const configData = this.extractConfigData(data);

    const saved = await this.pspConfigRepository.save(
      data.societe_id,
      pspType,
      { nom: data.nom, ...configData },
    );

    return {
      account: {
        id: saved.id,
        name: data.nom,
        is_active: saved.actif ?? true,
        is_live_mode: this.isLiveMode(data),
        is_configured: true,
      },
    };
  }

  @GrpcMethod('PaymentService', 'GetPSPAccount')
  async getPSPAccount(
    data: GetPSPAccountRequest,
  ): Promise<GetPSPAccountResponse> {
    const pspType = this.toPspTypeEnum(data.psp_type);

    const account = await this.pspConfigRepository.findBySocieteIdAndType(
      data.societe_id,
      pspType,
    );

    if (!account) {
      return {
        id: '',
        societe_id: data.societe_id,
        nom: '',
        psp_type: data.psp_type,
        actif: false,
        created_at: '',
        updated_at: '',
      };
    }

    return this.toGetPSPAccountResponse(account, data.societe_id, data.psp_type);
  }

  @GrpcMethod('PaymentService', 'TestPSPConnection')
  async testPSPConnection(
    data: TestPSPConnectionRequest,
  ): Promise<TestPSPConnectionResponse> {
    const pspType = this.toPspTypeEnum(data.psp_type);

    const account = await this.pspConfigRepository.findBySocieteIdAndType(
      data.societe_id,
      pspType,
    );

    if (!account) {
      return {
        success: false,
        message: `No active PSP account found for type ${data.psp_type}.`,
      };
    }

    const result = await this.pspConnectionTester.testConnection(
      data.psp_type,
      account,
    );

    return {
      success: result.success,
      message: result.message,
      details: result.details,
    };
  }

  @GrpcMethod('PaymentService', 'DeactivatePSPAccount')
  async deactivatePSPAccount(
    data: DeactivatePSPAccountRequest,
  ): Promise<DeactivatePSPAccountResponse> {
    const pspType = this.toPspTypeEnum(data.psp_type);

    const deactivated = await this.pspConfigRepository.deactivate(
      data.societe_id,
      pspType,
    );

    if (!deactivated) {
      return {
        success: false,
        message: `No active PSP account found for type ${data.psp_type}.`,
      };
    }

    return {
      success: true,
      message: `PSP account ${data.psp_type} deactivated successfully.`,
    };
  }

  // ─── Private helpers ────────────────────────────────────────

  private mapPspType(pspType: string | number): string {
    // Handle enum name format (e.g., 'PSP_TYPE_STRIPE')
    if (typeof pspType === 'string') {
      const normalized = pspType.trim().toUpperCase();
      const mapping: Record<string, string> = {
        'PSP_TYPE_STRIPE': 'stripe',
        'PSP_TYPE_PAYPAL': 'paypal',
        'PSP_TYPE_GOCARDLESS': 'gocardless',
        'PSP_TYPE_EMERCHANTPAY': 'emerchantpay',
        'PSP_TYPE_SLIMPAY': 'slimpay',
        'PSP_TYPE_MULTISAFEPAY': 'multisafepay',
      };
      const result = mapping[normalized];
      if (result) return result;
    }
    // Handle integer format (e.g., 1 for STRIPE)
    const intMapping: Record<number, string> = {
      1: 'stripe',
      2: 'paypal',
      3: 'gocardless',
      4: 'emerchantpay',
      5: 'slimpay',
      6: 'multisafepay',
    };
    const intResult = intMapping[Number(pspType)];
    if (intResult) return intResult;
    // Fallback: assume already lowercase
    return (pspType || '').toString().trim().toLowerCase();
  }

  private toPspTypeEnum(pspType: string | number): PspTypeEnum {
    const normalized = this.mapPspType(pspType);
    const mapping: Record<string, PspTypeEnum> = {
      stripe: PspTypeEnum.STRIPE,
      paypal: PspTypeEnum.PAYPAL,
      gocardless: PspTypeEnum.GOCARDLESS,
      emerchantpay: PspTypeEnum.EMERCHANTPAY,
      slimpay: PspTypeEnum.SLIMPAY,
      multisafepay: PspTypeEnum.MULTISAFEPAY,
    };

    const result = mapping[normalized];
    if (!result) {
      throw new Error(`Unsupported PSP type: ${pspType}`);
    }

    return result;
  }

  private extractConfigData(data: SavePSPAccountRequest): Record<string, any> {
    const config: Record<string, any> = {};

    // Extract from oneof nested structure
    // The proto uses oneof config with variants: stripe, gocardless, slimpay, multisafepay, emerchantpay, paypal
    const nestedConfig = (data as any).stripe ||
      (data as any).gocardless ||
      (data as any).slimpay ||
      (data as any).multisafepay ||
      (data as any).emerchantpay ||
      (data as any).paypal ||
      {};

    // Stripe
    if (nestedConfig.stripeSecretKey !== undefined) config.stripeSecretKey = nestedConfig.stripeSecretKey;
    if (nestedConfig.stripePublishableKey !== undefined) config.stripePublishableKey = nestedConfig.stripePublishableKey;
    if (nestedConfig.stripeWebhookSecret !== undefined) config.stripeWebhookSecret = nestedConfig.stripeWebhookSecret;
    if (nestedConfig.isTestMode !== undefined) config.isTestMode = nestedConfig.isTestMode;

    // GoCardless
    if (nestedConfig.accessToken !== undefined) config.accessToken = nestedConfig.accessToken;
    if (nestedConfig.webhookSecret !== undefined) config.webhookSecret = nestedConfig.webhookSecret;
    if (nestedConfig.isSandbox !== undefined) config.isSandbox = nestedConfig.isSandbox;

    // Slimpay
    if (nestedConfig.appName !== undefined) config.appName = nestedConfig.appName;
    if (nestedConfig.appSecret !== undefined) config.appSecret = nestedConfig.appSecret;

    // MultiSafepay
    if (nestedConfig.apiKey !== undefined) config.apiKey = nestedConfig.apiKey;

    // Emerchantpay
    if (nestedConfig.apiLogin !== undefined) config.apiLogin = nestedConfig.apiLogin;
    if (nestedConfig.apiPassword !== undefined) config.apiPassword = nestedConfig.apiPassword;
    if (nestedConfig.terminalToken !== undefined) config.terminalToken = nestedConfig.terminalToken;
    if (nestedConfig.webhookPublicKey !== undefined) config.webhookPublicKey = nestedConfig.webhookPublicKey;

    // PayPal
    if (nestedConfig.clientId !== undefined) config.clientId = nestedConfig.clientId;
    if (nestedConfig.clientSecret !== undefined) config.clientSecret = nestedConfig.clientSecret;
    if (nestedConfig.webhookId !== undefined) config.webhookId = nestedConfig.webhookId;

    return config;
  }

  private isLiveMode(data: SavePSPAccountRequest): boolean {
    if (data.is_test_mode !== undefined) return !data.is_test_mode;
    if (data.is_sandbox !== undefined) return !data.is_sandbox;
    return true;
  }

  private toGetPSPAccountResponse(
    account: any,
    societeId: string,
    pspType: string,
  ): GetPSPAccountResponse {
    return {
      id: account.id || '',
      societe_id: societeId,
      nom: account.nom || '',
      psp_type: pspType,
      actif: account.actif ?? false,
      created_at: account.createdAt ? account.createdAt.toISOString() : '',
      updated_at: account.updatedAt ? account.updatedAt.toISOString() : '',
      // Stripe
      stripe_secret_key: account.stripeSecretKey,
      stripe_publishable_key: account.stripePublishableKey,
      stripe_webhook_secret: account.stripeWebhookSecret,
      is_test_mode: account.isTestMode,
      // GoCardless
      access_token: account.accessToken,
      webhook_secret: account.webhookSecret,
      is_sandbox: account.isSandbox,
      // Slimpay
      app_name: account.appName,
      app_secret: account.appSecret,
      // MultiSafepay
      api_key: account.apiKey,
      // Emerchantpay
      api_login: account.apiLogin,
      api_password: account.apiPassword,
      terminal_token: account.terminalToken,
      webhook_public_key: account.webhookPublicKey,
      // PayPal
      client_id: account.clientId,
      client_secret: account.clientSecret,
      webhook_id: account.webhookId,
    };
  }
}
