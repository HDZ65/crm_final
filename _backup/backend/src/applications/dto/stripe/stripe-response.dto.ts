import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CheckoutSessionResponseDto {
  @ApiProperty({ description: 'Checkout session ID' })
  id: string;

  @ApiProperty({ description: 'Checkout URL to redirect the customer' })
  url: string;

  @ApiPropertyOptional({ description: 'Payment intent ID (if mode=payment)' })
  paymentIntentId?: string;

  @ApiPropertyOptional({ description: 'Subscription ID (if mode=subscription)' })
  subscriptionId?: string;
}

export class PaymentIntentResponseDto {
  @ApiProperty({ description: 'Payment intent ID' })
  id: string;

  @ApiProperty({ description: 'Client secret for frontend confirmation' })
  clientSecret: string;

  @ApiProperty({ description: 'Amount in cents' })
  amount: number;

  @ApiProperty({ description: 'Currency' })
  currency: string;

  @ApiProperty({ description: 'Payment status' })
  status: string;
}

export class CustomerResponseDto {
  @ApiProperty({ description: 'Customer ID' })
  id: string;

  @ApiProperty({ description: 'Customer email' })
  email: string;

  @ApiPropertyOptional({ description: 'Customer name' })
  name?: string;

  @ApiPropertyOptional({ description: 'Default payment method ID' })
  defaultPaymentMethod?: string;
}

export class SubscriptionResponseDto {
  @ApiProperty({ description: 'Subscription ID' })
  id: string;

  @ApiProperty({ description: 'Subscription status' })
  status: string;

  @ApiProperty({ description: 'Current period start' })
  currentPeriodStart: Date;

  @ApiProperty({ description: 'Current period end' })
  currentPeriodEnd: Date;

  @ApiPropertyOptional({ description: 'Client secret for payment (if incomplete)' })
  clientSecret?: string;

  @ApiPropertyOptional({ description: 'Cancel at period end' })
  cancelAtPeriodEnd?: boolean;
}

export class RefundResponseDto {
  @ApiProperty({ description: 'Refund ID' })
  id: string;

  @ApiProperty({ description: 'Refund amount in cents' })
  amount: number;

  @ApiProperty({ description: 'Refund status' })
  status: string;

  @ApiProperty({ description: 'Payment intent ID' })
  paymentIntentId: string;
}

export class WebhookResponseDto {
  @ApiProperty({ description: 'Webhook processing status' })
  received: boolean;
}

export class ProductResponseDto {
  @ApiProperty({ description: 'Product ID' })
  id: string;

  @ApiProperty({ description: 'Nom du produit' })
  name: string;

  @ApiPropertyOptional({ description: 'Description du produit' })
  description?: string;

  @ApiProperty({ description: 'Produit actif' })
  active: boolean;
}

export class PriceResponseDto {
  @ApiProperty({ description: 'Price ID' })
  id: string;

  @ApiProperty({ description: 'Product ID' })
  productId: string;

  @ApiProperty({ description: 'Montant en centimes' })
  unitAmount: number;

  @ApiProperty({ description: 'Devise' })
  currency: string;

  @ApiPropertyOptional({ description: 'Intervalle de récurrence (si abonnement)' })
  interval?: string;

  @ApiProperty({ description: 'Prix actif' })
  active: boolean;
}
