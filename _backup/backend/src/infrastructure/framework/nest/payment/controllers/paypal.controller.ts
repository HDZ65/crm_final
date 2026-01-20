import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Headers,
  Req,
  HttpCode,
  HttpStatus,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import { Request } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiHeader,
} from '@nestjs/swagger';
import {
  CreatePaypalOrderDto,
  CapturePaypalOrderDto,
  PaypalOrderResponseDto,
  PaypalCaptureResponseDto,
} from '../../../../../applications/dto/paypal';
import { PaypalService } from '../../../../services/paypal/paypal.service';
import { PaypalWebhookService } from '../../../../services/paypal/paypal-webhook.service';
import type { PaypalWebhookEvent, PaypalWebhookHeaders } from '../../../../services/paypal/paypal-webhook.service';

@ApiTags('PayPal')
@Controller('paypal')
export class PaypalController {
  private readonly logger = new Logger(PaypalController.name);

  constructor(
    private readonly paypalService: PaypalService,
    private readonly webhookService: PaypalWebhookService,
  ) {}

  // ==================== ORDERS API ====================

  @Post('orders')
  @ApiOperation({ summary: 'Créer un ordre PayPal' })
  @ApiResponse({
    status: 201,
    description: 'Ordre créé avec succès',
    type: PaypalOrderResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  async createOrder(@Body() dto: CreatePaypalOrderDto): Promise<PaypalOrderResponseDto> {
    if (!dto.societeId) {
      throw new BadRequestException('societeId est requis');
    }

    const order = await this.paypalService.createOrder({
      societeId: dto.societeId,
      intent: dto.intent,
      purchaseUnits: dto.purchaseUnits.map((unit) => ({
        referenceId: unit.referenceId,
        amount: unit.amount,
        currency: unit.currency,
        description: unit.description,
        customId: unit.customId,
        invoiceId: unit.invoiceId,
      })),
      returnUrl: dto.returnUrl,
      cancelUrl: dto.cancelUrl,
      metadata: dto.metadata,
    });

    return {
      id: order.id!,
      status: order.status!,
      approveUrl: this.paypalService.extractApproveUrl(order),
      captureUrl: this.paypalService.extractCaptureUrl(order),
      links: order.links?.map((link) => ({
        href: link.href!,
        rel: link.rel!,
        method: link.method!,
      })),
    };
  }

  @Get('orders/:id')
  @ApiOperation({ summary: 'Récupérer un ordre PayPal' })
  @ApiParam({ name: 'id', description: 'ID de l\'ordre PayPal' })
  @ApiResponse({
    status: 200,
    description: 'Ordre trouvé',
    type: PaypalOrderResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Ordre non trouvé' })
  async getOrder(
    @Param('id') orderId: string,
    @Headers('x-societe-id') societeId: string,
  ): Promise<PaypalOrderResponseDto> {
    if (!societeId) {
      throw new BadRequestException('Header x-societe-id est requis');
    }

    const order = await this.paypalService.getOrder(societeId, orderId);

    return {
      id: order.id!,
      status: order.status!,
      approveUrl: this.paypalService.extractApproveUrl(order),
      captureUrl: this.paypalService.extractCaptureUrl(order),
      links: order.links?.map((link) => ({
        href: link.href!,
        rel: link.rel!,
        method: link.method!,
      })),
    };
  }

  @Post('orders/:id/capture')
  @ApiOperation({ summary: 'Capturer un ordre PayPal approuvé' })
  @ApiParam({ name: 'id', description: 'ID de l\'ordre PayPal' })
  @ApiResponse({
    status: 200,
    description: 'Ordre capturé avec succès',
    type: PaypalCaptureResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Ordre non approuvé ou déjà capturé' })
  async captureOrder(
    @Param('id') orderId: string,
    @Body() dto: CapturePaypalOrderDto,
  ): Promise<PaypalCaptureResponseDto> {
    if (!dto.societeId) {
      throw new BadRequestException('societeId est requis');
    }

    const order = await this.paypalService.captureOrder({
      societeId: dto.societeId,
      orderId,
    });

    return {
      id: order.id!,
      status: order.status!,
      payer: order.payer
        ? {
            emailAddress: order.payer.emailAddress,
            payerId: order.payer.payerId,
            name: order.payer.name
              ? {
                  givenName: order.payer.name.givenName,
                  surname: order.payer.name.surname,
                }
              : undefined,
          }
        : undefined,
      purchaseUnits: order.purchaseUnits?.map((unit) => ({
        referenceId: unit.referenceId,
        payments: unit.payments
          ? {
              captures: unit.payments.captures?.map((capture) => ({
                id: capture.id!,
                status: capture.status!,
                amount: {
                  currencyCode: capture.amount!.currencyCode!,
                  value: capture.amount!.value!,
                },
              })),
            }
          : undefined,
      })),
    };
  }

  @Post('orders/:id/authorize')
  @ApiOperation({ summary: 'Autoriser un ordre PayPal (sans capture immédiate)' })
  @ApiParam({ name: 'id', description: 'ID de l\'ordre PayPal' })
  @ApiResponse({
    status: 200,
    description: 'Ordre autorisé avec succès',
    type: PaypalOrderResponseDto,
  })
  async authorizeOrder(
    @Param('id') orderId: string,
    @Headers('x-societe-id') societeId: string,
  ): Promise<PaypalOrderResponseDto> {
    if (!societeId) {
      throw new BadRequestException('Header x-societe-id est requis');
    }

    const order = await this.paypalService.authorizeOrder(societeId, orderId);

    return {
      id: order.id!,
      status: order.status!,
      links: order.links?.map((link) => ({
        href: link.href!,
        rel: link.rel!,
        method: link.method!,
      })),
    };
  }

  // ==================== WEBHOOKS ====================

  @Post('webhooks')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Endpoint pour recevoir les webhooks PayPal' })
  @ApiHeader({ name: 'paypal-transmission-id', description: 'PayPal Transmission ID' })
  @ApiHeader({ name: 'paypal-transmission-time', description: 'PayPal Transmission Time' })
  @ApiHeader({ name: 'paypal-transmission-sig', description: 'PayPal Transmission Signature' })
  @ApiHeader({ name: 'paypal-cert-url', description: 'PayPal Certificate URL' })
  @ApiHeader({ name: 'paypal-auth-algo', description: 'PayPal Auth Algorithm' })
  @ApiResponse({ status: 200, description: 'Webhook traité' })
  @ApiResponse({ status: 400, description: 'Webhook invalide' })
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers() headers: Record<string, string>,
    @Body() body: PaypalWebhookEvent,
  ): Promise<{ received: boolean }> {
    this.logger.log(`Received PayPal webhook: ${body.event_type} - ID: ${body.id}`);

    const rawBody = req.rawBody?.toString() || JSON.stringify(body);

    // Extract PayPal headers
    const paypalHeaders: PaypalWebhookHeaders = {
      'paypal-transmission-id': headers['paypal-transmission-id'],
      'paypal-transmission-time': headers['paypal-transmission-time'],
      'paypal-transmission-sig': headers['paypal-transmission-sig'],
      'paypal-cert-url': headers['paypal-cert-url'],
      'paypal-auth-algo': headers['paypal-auth-algo'],
    };

    // Find societe by webhook ID from the custom_id or resource data
    // You may need to adjust this based on how you track which societe owns which webhook
    const webhookId = headers['x-paypal-webhook-id']; // Custom header if you set it up

    if (webhookId) {
      // Verify webhook signature
      const isValid = await this.webhookService.verifyWebhookSignature(
        paypalHeaders,
        rawBody,
        webhookId,
      );

      if (!isValid) {
        this.logger.warn(`Invalid PayPal webhook signature: ${body.id}`);
        throw new BadRequestException('Invalid webhook signature');
      }
    }

    // Process the webhook event
    await this.webhookService.handleEvent(body);

    return { received: true };
  }
}
