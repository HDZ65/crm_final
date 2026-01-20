import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Headers,
  Req,
  HttpCode,
  HttpStatus,
  BadRequestException,
  Logger,
  UseGuards,
  UseFilters,
} from '@nestjs/common';
import { ThrottlerGuard, Throttle, SkipThrottle } from '@nestjs/throttler';
import type { RawBodyRequest } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiHeader,
} from '@nestjs/swagger';
import { Request } from 'express';
import Stripe from 'stripe';

import { StripeService } from '../../../../services/stripe/stripe.service';
import { StripeWebhookService } from '../../../../services/stripe/stripe-webhook.service';
import { StripeExceptionFilter } from '../filters/stripe-exception.filter';
import {
  CreateCheckoutSessionDto,
  CreateStripePaymentIntentDto,
  CreateStripeCustomerDto,
  CreateStripeSubscriptionDto,
  CreateStripeProductDto,
  CreateStripePriceDto,
  CreateRefundDto,
  CreateSetupIntentDto,
  SetupIntentResponseDto,
  CreateBillingPortalSessionDto,
  BillingPortalSessionResponseDto,
  CheckoutSessionResponseDto,
  PaymentIntentResponseDto,
  CustomerResponseDto,
  SubscriptionResponseDto,
  ProductResponseDto,
  PriceResponseDto,
  RefundResponseDto,
  WebhookResponseDto,
} from '../../../../../applications/dto/stripe';

@ApiTags('Stripe')
@Controller('stripe')
@UseGuards(ThrottlerGuard)
@UseFilters(StripeExceptionFilter)
export class StripeController {
  private readonly logger = new Logger(StripeController.name);

  constructor(
    private readonly stripeService: StripeService,
    private readonly stripeWebhookService: StripeWebhookService,
    private readonly configService: ConfigService,
  ) {}

  // ========== CHECKOUT SESSIONS ==========

  @Post('checkout/sessions')
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 sessions per minute max
  @ApiOperation({ summary: 'Create a Stripe Checkout Session' })
  @ApiHeader({
    name: 'x-societe-id',
    description: 'ID de la société (pour multi-compte Stripe)',
    required: false,
  })
  @ApiResponse({
    status: 201,
    description: 'Checkout session created',
    type: CheckoutSessionResponseDto,
  })
  @ApiBody({ type: CreateCheckoutSessionDto })
  async createCheckoutSession(
    @Body() dto: CreateCheckoutSessionDto,
    @Headers('x-societe-id') societeId?: string,
  ): Promise<CheckoutSessionResponseDto> {
    const session = await this.stripeService.createCheckoutSession({
      societeId,
      customerId: dto.customerId,
      customerEmail: dto.customerEmail,
      priceId: dto.priceId,
      amount: dto.amount,
      currency: dto.currency,
      mode: dto.mode,
      successUrl: dto.successUrl,
      cancelUrl: dto.cancelUrl,
      metadata: dto.metadata,
      lineItems: dto.lineItems,
    });

    return {
      id: session.id,
      url: session.url!,
      paymentIntentId: session.payment_intent as string | undefined,
      subscriptionId: session.subscription as string | undefined,
    };
  }

  // ========== PAYMENT INTENTS ==========

  @Post('payment-intents')
  @Throttle({ default: { limit: 20, ttl: 60000 } }) // 20 payment intents per minute max
  @ApiOperation({ summary: 'Create a Stripe Payment Intent' })
  @ApiHeader({
    name: 'x-societe-id',
    description: 'ID de la société (pour multi-compte Stripe)',
    required: false,
  })
  @ApiResponse({
    status: 201,
    description: 'Payment intent created',
    type: PaymentIntentResponseDto,
  })
  @ApiBody({ type: CreateStripePaymentIntentDto })
  async createPaymentIntent(
    @Body() dto: CreateStripePaymentIntentDto,
    @Headers('x-societe-id') societeId?: string,
  ): Promise<PaymentIntentResponseDto> {
    const paymentIntent = await this.stripeService.createPaymentIntent({
      societeId,
      amount: dto.amount,
      currency: dto.currency,
      customerId: dto.customerId,
      description: dto.description,
      receiptEmail: dto.receiptEmail,
      metadata: dto.metadata,
      automaticPaymentMethods: dto.automaticPaymentMethods,
    });

    return {
      id: paymentIntent.id,
      clientSecret: paymentIntent.client_secret!,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: paymentIntent.status,
    };
  }

  @Get('payment-intents/:id')
  @ApiOperation({ summary: 'Retrieve a Payment Intent' })
  @ApiHeader({
    name: 'x-societe-id',
    description: 'ID de la société (pour multi-compte Stripe)',
    required: false,
  })
  @ApiParam({ name: 'id', description: 'Payment Intent ID' })
  @ApiResponse({
    status: 200,
    description: 'Payment intent retrieved',
    type: PaymentIntentResponseDto,
  })
  async retrievePaymentIntent(
    @Param('id') id: string,
    @Headers('x-societe-id') societeId?: string,
  ): Promise<PaymentIntentResponseDto> {
    const paymentIntent = await this.stripeService.retrievePaymentIntent(id, societeId);

    return {
      id: paymentIntent.id,
      clientSecret: paymentIntent.client_secret!,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: paymentIntent.status,
    };
  }

  @Post('payment-intents/:id/cancel')
  @ApiOperation({ summary: 'Cancel a Payment Intent' })
  @ApiHeader({
    name: 'x-societe-id',
    description: 'ID de la société (pour multi-compte Stripe)',
    required: false,
  })
  @ApiParam({ name: 'id', description: 'Payment Intent ID' })
  @ApiResponse({
    status: 200,
    description: 'Payment intent cancelled',
    type: PaymentIntentResponseDto,
  })
  async cancelPaymentIntent(
    @Param('id') id: string,
    @Headers('x-societe-id') societeId?: string,
  ): Promise<PaymentIntentResponseDto> {
    const paymentIntent = await this.stripeService.cancelPaymentIntent(id, undefined, societeId);

    return {
      id: paymentIntent.id,
      clientSecret: paymentIntent.client_secret!,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: paymentIntent.status,
    };
  }

  // ========== CUSTOMERS ==========

  @Post('customers')
  @Throttle({ default: { limit: 30, ttl: 60000 } }) // 30 customers per minute max
  @ApiOperation({ summary: 'Create a Stripe Customer' })
  @ApiHeader({
    name: 'x-societe-id',
    description: 'ID de la société (pour multi-compte Stripe)',
    required: false,
  })
  @ApiResponse({
    status: 201,
    description: 'Customer created',
    type: CustomerResponseDto,
  })
  @ApiBody({ type: CreateStripeCustomerDto })
  async createCustomer(
    @Body() dto: CreateStripeCustomerDto,
    @Headers('x-societe-id') societeId?: string,
  ): Promise<CustomerResponseDto> {
    const customer = await this.stripeService.createCustomer({
      societeId,
      email: dto.email,
      name: dto.name,
      phone: dto.phone,
      metadata: dto.metadata,
      address: dto.address,
    });

    return {
      id: customer.id,
      email: customer.email!,
      name: customer.name || undefined,
      defaultPaymentMethod:
        typeof customer.invoice_settings?.default_payment_method === 'string'
          ? customer.invoice_settings.default_payment_method
          : (customer.invoice_settings?.default_payment_method as any)?.id,
    };
  }

  @Get('customers/:id')
  @ApiOperation({ summary: 'Retrieve a Customer' })
  @ApiHeader({
    name: 'x-societe-id',
    description: 'ID de la société (pour multi-compte Stripe)',
    required: false,
  })
  @ApiParam({ name: 'id', description: 'Customer ID' })
  @ApiResponse({
    status: 200,
    description: 'Customer retrieved',
    type: CustomerResponseDto,
  })
  async retrieveCustomer(
    @Param('id') id: string,
    @Headers('x-societe-id') societeId?: string,
  ): Promise<CustomerResponseDto> {
    const customer = await this.stripeService.retrieveCustomer(id, societeId);

    return {
      id: customer.id,
      email: customer.email!,
      name: customer.name || undefined,
      defaultPaymentMethod:
        typeof customer.invoice_settings?.default_payment_method === 'string'
          ? customer.invoice_settings.default_payment_method
          : (customer.invoice_settings?.default_payment_method as any)?.id,
    };
  }

  // ========== SUBSCRIPTIONS ==========

  @Post('subscriptions')
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 subscriptions per minute max
  @ApiOperation({ summary: 'Create a Subscription' })
  @ApiHeader({
    name: 'x-societe-id',
    description: 'ID de la société (pour multi-compte Stripe)',
    required: false,
  })
  @ApiResponse({
    status: 201,
    description: 'Subscription created',
    type: SubscriptionResponseDto,
  })
  @ApiBody({ type: CreateStripeSubscriptionDto })
  async createSubscription(
    @Body() dto: CreateStripeSubscriptionDto,
    @Headers('x-societe-id') societeId?: string,
  ): Promise<SubscriptionResponseDto> {
    const subscription = await this.stripeService.createSubscription({
      societeId,
      customerId: dto.customerId,
      priceId: dto.priceId,
      metadata: dto.metadata,
      trialPeriodDays: dto.trialPeriodDays,
      paymentBehavior: dto.paymentBehavior as any,
    });

    const latestInvoice = subscription.latest_invoice as Stripe.Invoice;
    const paymentIntent = (latestInvoice as any)?.payment_intent as Stripe.PaymentIntent;
    const sub = subscription as any;

    return {
      id: subscription.id,
      status: subscription.status,
      currentPeriodStart: new Date(sub.current_period_start * 1000),
      currentPeriodEnd: new Date(sub.current_period_end * 1000),
      clientSecret: paymentIntent?.client_secret || undefined,
      cancelAtPeriodEnd: sub.cancel_at_period_end,
    };
  }

  @Get('subscriptions/:id')
  @ApiOperation({ summary: 'Retrieve a Subscription' })
  @ApiHeader({
    name: 'x-societe-id',
    description: 'ID de la société (pour multi-compte Stripe)',
    required: false,
  })
  @ApiParam({ name: 'id', description: 'Subscription ID' })
  @ApiResponse({
    status: 200,
    description: 'Subscription retrieved',
    type: SubscriptionResponseDto,
  })
  async retrieveSubscription(
    @Param('id') id: string,
    @Headers('x-societe-id') societeId?: string,
  ): Promise<SubscriptionResponseDto> {
    const subscription = await this.stripeService.retrieveSubscription(id, societeId);
    const sub = subscription as any;

    return {
      id: subscription.id,
      status: subscription.status,
      currentPeriodStart: new Date(sub.current_period_start * 1000),
      currentPeriodEnd: new Date(sub.current_period_end * 1000),
      cancelAtPeriodEnd: sub.cancel_at_period_end,
    };
  }

  @Delete('subscriptions/:id')
  @ApiOperation({ summary: 'Cancel a Subscription' })
  @ApiHeader({
    name: 'x-societe-id',
    description: 'ID de la société (pour multi-compte Stripe)',
    required: false,
  })
  @ApiParam({ name: 'id', description: 'Subscription ID' })
  @ApiResponse({
    status: 200,
    description: 'Subscription cancelled',
    type: SubscriptionResponseDto,
  })
  async cancelSubscription(
    @Param('id') id: string,
    @Headers('x-societe-id') societeId?: string,
  ): Promise<SubscriptionResponseDto> {
    const subscription = await this.stripeService.cancelSubscription(id, false, societeId);
    const sub = subscription as any;

    return {
      id: subscription.id,
      status: subscription.status,
      currentPeriodStart: new Date(sub.current_period_start * 1000),
      currentPeriodEnd: new Date(sub.current_period_end * 1000),
      cancelAtPeriodEnd: sub.cancel_at_period_end,
    };
  }

  // ========== PRODUCTS ==========

  @Post('products')
  @ApiOperation({ summary: 'Create a Stripe Product' })
  @ApiResponse({
    status: 201,
    description: 'Product created',
    type: ProductResponseDto,
  })
  @ApiBody({ type: CreateStripeProductDto })
  async createProduct(
    @Body() dto: CreateStripeProductDto,
  ): Promise<ProductResponseDto> {
    const product = await this.stripeService.createProduct({
      name: dto.name,
      description: dto.description,
      metadata: dto.metadata,
    });

    return {
      id: product.id,
      name: product.name,
      description: product.description || undefined,
      active: product.active,
    };
  }

  @Get('products')
  @ApiOperation({ summary: 'List Stripe Products' })
  @ApiResponse({
    status: 200,
    description: 'Products list',
    type: [ProductResponseDto],
  })
  async listProducts(): Promise<ProductResponseDto[]> {
    const products = await this.stripeService.listProducts();

    return products.map((product) => ({
      id: product.id,
      name: product.name,
      description: product.description || undefined,
      active: product.active,
    }));
  }

  // ========== PRICES ==========

  @Post('prices')
  @ApiOperation({ summary: 'Create a Stripe Price' })
  @ApiResponse({
    status: 201,
    description: 'Price created',
    type: PriceResponseDto,
  })
  @ApiBody({ type: CreateStripePriceDto })
  async createPrice(
    @Body() dto: CreateStripePriceDto,
  ): Promise<PriceResponseDto> {
    const price = await this.stripeService.createPrice({
      productId: dto.productId,
      unitAmount: dto.unitAmount,
      currency: dto.currency,
      recurring: dto.recurring,
      metadata: dto.metadata,
    });

    return {
      id: price.id,
      productId: typeof price.product === 'string' ? price.product : price.product.id,
      unitAmount: price.unit_amount || 0,
      currency: price.currency,
      interval: price.recurring?.interval,
      active: price.active,
    };
  }

  @Get('prices')
  @ApiOperation({ summary: 'List Stripe Prices' })
  @ApiResponse({
    status: 200,
    description: 'Prices list',
    type: [PriceResponseDto],
  })
  async listPrices(): Promise<PriceResponseDto[]> {
    const prices = await this.stripeService.listPrices();

    return prices.map((price) => ({
      id: price.id,
      productId: typeof price.product === 'string' ? price.product : price.product.id,
      unitAmount: price.unit_amount || 0,
      currency: price.currency,
      interval: price.recurring?.interval,
      active: price.active,
    }));
  }

  // ========== REFUNDS ==========

  @Post('refunds')
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 refunds per minute max
  @ApiOperation({ summary: 'Create a Refund' })
  @ApiResponse({
    status: 201,
    description: 'Refund created',
    type: RefundResponseDto,
  })
  @ApiBody({ type: CreateRefundDto })
  async createRefund(@Body() dto: CreateRefundDto): Promise<RefundResponseDto> {
    const refund = await this.stripeService.createRefund(
      dto.paymentIntentId,
      dto.amount,
      dto.reason as any,
    );

    return {
      id: refund.id,
      amount: refund.amount,
      status: refund.status!,
      paymentIntentId: refund.payment_intent as string,
    };
  }

  // ========== SETUP INTENTS ==========

  @Post('setup-intents')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiOperation({
    summary: 'Create a SetupIntent',
    description: 'Create a SetupIntent to save a payment method for future use without immediate payment. Use cases: free trials, saving cards, multi-payment methods.',
  })
  @ApiResponse({
    status: 201,
    description: 'SetupIntent created',
    type: SetupIntentResponseDto,
  })
  @ApiBody({ type: CreateSetupIntentDto })
  async createSetupIntent(
    @Body() dto: CreateSetupIntentDto,
  ): Promise<SetupIntentResponseDto> {
    const setupIntent = await this.stripeService.createSetupIntent({
      customerId: dto.customerId,
      paymentMethodTypes: dto.paymentMethodTypes,
      metadata: dto.metadata,
      usage: dto.usage,
      description: dto.description,
    });

    return {
      id: setupIntent.id,
      clientSecret: setupIntent.client_secret!,
      status: setupIntent.status,
      customerId: setupIntent.customer as string | undefined,
      paymentMethodId: setupIntent.payment_method as string | undefined,
    };
  }

  @Get('setup-intents/:id')
  @ApiOperation({ summary: 'Retrieve a SetupIntent' })
  @ApiParam({ name: 'id', description: 'SetupIntent ID' })
  @ApiResponse({
    status: 200,
    description: 'SetupIntent retrieved',
    type: SetupIntentResponseDto,
  })
  async retrieveSetupIntent(
    @Param('id') id: string,
  ): Promise<SetupIntentResponseDto> {
    const setupIntent = await this.stripeService.retrieveSetupIntent(id);

    return {
      id: setupIntent.id,
      clientSecret: setupIntent.client_secret!,
      status: setupIntent.status,
      customerId: setupIntent.customer as string | undefined,
      paymentMethodId: setupIntent.payment_method as string | undefined,
    };
  }

  @Post('setup-intents/:id/cancel')
  @ApiOperation({ summary: 'Cancel a SetupIntent' })
  @ApiParam({ name: 'id', description: 'SetupIntent ID' })
  @ApiResponse({
    status: 200,
    description: 'SetupIntent cancelled',
    type: SetupIntentResponseDto,
  })
  async cancelSetupIntent(
    @Param('id') id: string,
  ): Promise<SetupIntentResponseDto> {
    const setupIntent = await this.stripeService.cancelSetupIntent(id);

    return {
      id: setupIntent.id,
      clientSecret: setupIntent.client_secret!,
      status: setupIntent.status,
      customerId: setupIntent.customer as string | undefined,
      paymentMethodId: setupIntent.payment_method as string | undefined,
    };
  }

  // ========== BILLING PORTAL ==========

  @Post('billing-portal/sessions')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({
    summary: 'Create a Billing Portal session',
    description: 'Create a session for customer self-service portal. Allows customers to manage subscriptions, payment methods, and view invoices.',
  })
  @ApiResponse({
    status: 201,
    description: 'Billing Portal session created',
    type: BillingPortalSessionResponseDto,
  })
  @ApiBody({ type: CreateBillingPortalSessionDto })
  async createBillingPortalSession(
    @Body() dto: CreateBillingPortalSessionDto,
  ): Promise<BillingPortalSessionResponseDto> {
    const session = await this.stripeService.createBillingPortalSession({
      customerId: dto.customerId,
      returnUrl: dto.returnUrl,
      configuration: dto.configuration,
    });

    return {
      id: session.id,
      url: session.url,
      returnUrl: session.return_url || dto.returnUrl,
    };
  }

  // ========== WEBHOOKS ==========

  @Post('webhooks')
  @SkipThrottle() // Webhooks come from Stripe servers, should not be rate limited
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Handle Stripe Webhooks' })
  @ApiResponse({
    status: 200,
    description: 'Webhook processed',
    type: WebhookResponseDto,
  })
  async handleWebhook(
    @Req() request: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ): Promise<WebhookResponseDto> {
    const webhookSecret = this.configService.get<string>(
      'STRIPE_WEBHOOK_SECRET',
    );

    if (!webhookSecret) {
      this.logger.error('STRIPE_WEBHOOK_SECRET not configured');
      throw new BadRequestException('Webhook secret not configured');
    }

    if (!signature) {
      this.logger.error('Missing stripe-signature header');
      throw new BadRequestException('Missing stripe-signature header');
    }

    const rawBody = request.rawBody;
    if (!rawBody) {
      this.logger.error('Raw body not available');
      throw new BadRequestException('Raw body not available');
    }

    let event: Stripe.Event;

    try {
      event = this.stripeService.constructWebhookEvent(
        rawBody,
        signature,
        webhookSecret,
      );
    } catch (err) {
      this.logger.error(`Webhook signature verification failed: ${err}`);
      throw new BadRequestException('Webhook signature verification failed');
    }

    this.logger.log(`Received Stripe event: ${event.type} (${event.id})`);

    // Check idempotency - skip if event already processed
    if (await this.stripeWebhookService.isEventAlreadyProcessed(event.id)) {
      return { received: true };
    }

    // Route event to appropriate handler
    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.stripeWebhookService.handlePaymentIntentSucceeded(
          event as Stripe.PaymentIntentSucceededEvent,
        );
        break;
      case 'payment_intent.payment_failed':
        await this.stripeWebhookService.handlePaymentIntentFailed(
          event as Stripe.PaymentIntentPaymentFailedEvent,
        );
        break;
      case 'payment_intent.processing':
        await this.stripeWebhookService.handlePaymentIntentProcessing(
          event as Stripe.PaymentIntentProcessingEvent,
        );
        break;
      case 'payment_intent.canceled':
        await this.stripeWebhookService.handlePaymentIntentCanceled(
          event as Stripe.PaymentIntentCanceledEvent,
        );
        break;
      case 'checkout.session.completed':
        await this.stripeWebhookService.handleCheckoutSessionCompleted(
          event as Stripe.CheckoutSessionCompletedEvent,
        );
        break;
      case 'checkout.session.expired':
        await this.stripeWebhookService.handleCheckoutSessionExpired(
          event as Stripe.CheckoutSessionExpiredEvent,
        );
        break;
      case 'customer.subscription.created':
        await this.stripeWebhookService.handleSubscriptionCreated(
          event as Stripe.CustomerSubscriptionCreatedEvent,
        );
        break;
      case 'customer.subscription.updated':
        await this.stripeWebhookService.handleSubscriptionUpdated(
          event as Stripe.CustomerSubscriptionUpdatedEvent,
        );
        break;
      case 'customer.subscription.deleted':
        await this.stripeWebhookService.handleSubscriptionDeleted(
          event as Stripe.CustomerSubscriptionDeletedEvent,
        );
        break;
      case 'invoice.paid':
        await this.stripeWebhookService.handleInvoicePaid(
          event as Stripe.InvoicePaidEvent,
        );
        break;
      case 'invoice.payment_failed':
        await this.stripeWebhookService.handleInvoicePaymentFailed(
          event as Stripe.InvoicePaymentFailedEvent,
        );
        break;
      case 'charge.refunded':
        await this.stripeWebhookService.handleChargeRefunded(
          event as Stripe.ChargeRefundedEvent,
        );
        break;
      default:
        await this.stripeWebhookService.handleUnknownEvent(event);
    }

    return { received: true };
  }

  @Post('webhooks/:societeId')
  @SkipThrottle()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Handle Stripe Webhooks for a specific Société',
    description: 'Endpoint dédié pour recevoir les webhooks Stripe d\'une société spécifique. Chaque société peut avoir son propre webhook secret configuré.',
  })
  @ApiParam({ name: 'societeId', description: 'ID de la société' })
  @ApiResponse({
    status: 200,
    description: 'Webhook processed',
    type: WebhookResponseDto,
  })
  async handleWebhookForSociete(
    @Param('societeId') societeId: string,
    @Req() request: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ): Promise<WebhookResponseDto> {
    if (!signature) {
      this.logger.error('Missing stripe-signature header');
      throw new BadRequestException('Missing stripe-signature header');
    }

    const rawBody = request.rawBody;
    if (!rawBody) {
      this.logger.error('Raw body not available');
      throw new BadRequestException('Raw body not available');
    }

    let event: Stripe.Event;

    try {
      event = await this.stripeService.constructWebhookEventForSociete(
        rawBody,
        signature,
        societeId,
      );
    } catch (err) {
      this.logger.error(`Webhook signature verification failed for societe ${societeId}: ${err}`);
      throw new BadRequestException('Webhook signature verification failed');
    }

    this.logger.log(`Received Stripe event for societe ${societeId}: ${event.type} (${event.id})`);

    // Check idempotency - skip if event already processed
    if (await this.stripeWebhookService.isEventAlreadyProcessed(event.id)) {
      return { received: true };
    }

    // Route event to appropriate handler (same logic as default webhook)
    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.stripeWebhookService.handlePaymentIntentSucceeded(
          event as Stripe.PaymentIntentSucceededEvent,
        );
        break;
      case 'payment_intent.payment_failed':
        await this.stripeWebhookService.handlePaymentIntentFailed(
          event as Stripe.PaymentIntentPaymentFailedEvent,
        );
        break;
      case 'payment_intent.processing':
        await this.stripeWebhookService.handlePaymentIntentProcessing(
          event as Stripe.PaymentIntentProcessingEvent,
        );
        break;
      case 'payment_intent.canceled':
        await this.stripeWebhookService.handlePaymentIntentCanceled(
          event as Stripe.PaymentIntentCanceledEvent,
        );
        break;
      case 'checkout.session.completed':
        await this.stripeWebhookService.handleCheckoutSessionCompleted(
          event as Stripe.CheckoutSessionCompletedEvent,
        );
        break;
      case 'checkout.session.expired':
        await this.stripeWebhookService.handleCheckoutSessionExpired(
          event as Stripe.CheckoutSessionExpiredEvent,
        );
        break;
      case 'customer.subscription.created':
        await this.stripeWebhookService.handleSubscriptionCreated(
          event as Stripe.CustomerSubscriptionCreatedEvent,
        );
        break;
      case 'customer.subscription.updated':
        await this.stripeWebhookService.handleSubscriptionUpdated(
          event as Stripe.CustomerSubscriptionUpdatedEvent,
        );
        break;
      case 'customer.subscription.deleted':
        await this.stripeWebhookService.handleSubscriptionDeleted(
          event as Stripe.CustomerSubscriptionDeletedEvent,
        );
        break;
      case 'invoice.paid':
        await this.stripeWebhookService.handleInvoicePaid(
          event as Stripe.InvoicePaidEvent,
        );
        break;
      case 'invoice.payment_failed':
        await this.stripeWebhookService.handleInvoicePaymentFailed(
          event as Stripe.InvoicePaymentFailedEvent,
        );
        break;
      case 'charge.refunded':
        await this.stripeWebhookService.handleChargeRefunded(
          event as Stripe.ChargeRefundedEvent,
        );
        break;
      default:
        await this.stripeWebhookService.handleUnknownEvent(event);
    }

    return { received: true };
  }
}
