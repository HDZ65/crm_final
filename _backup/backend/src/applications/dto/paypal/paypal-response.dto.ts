import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PaypalOrderResponseDto {
  @ApiProperty({ description: 'PayPal Order ID' })
  id: string;

  @ApiProperty({ description: 'Order status' })
  status: string;

  @ApiPropertyOptional({ description: 'Approval URL for buyer redirect' })
  approveUrl?: string;

  @ApiPropertyOptional({ description: 'Capture URL (after approval)' })
  captureUrl?: string;

  @ApiPropertyOptional({ description: 'All HATEOAS links' })
  links?: Array<{
    href: string;
    rel: string;
    method: string;
  }>;
}

export class PaypalCaptureResponseDto {
  @ApiProperty({ description: 'PayPal Order ID' })
  id: string;

  @ApiProperty({ description: 'Order status (should be COMPLETED)' })
  status: string;

  @ApiPropertyOptional({ description: 'Payer info' })
  payer?: {
    emailAddress?: string;
    payerId?: string;
    name?: {
      givenName?: string;
      surname?: string;
    };
  };

  @ApiPropertyOptional({ description: 'Purchase unit captures' })
  purchaseUnits?: Array<{
    referenceId?: string;
    payments?: {
      captures?: Array<{
        id: string;
        status: string;
        amount: {
          currencyCode: string;
          value: string;
        };
      }>;
    };
  }>;
}

export class PaypalPlanResponseDto {
  @ApiProperty({ description: 'PayPal Plan ID' })
  id: string;

  @ApiProperty({ description: 'Plan status' })
  status: string;

  @ApiProperty({ description: 'Plan name' })
  name: string;

  @ApiPropertyOptional({ description: 'Plan description' })
  description?: string;
}

export class PaypalSubscriptionResponseDto {
  @ApiProperty({ description: 'PayPal Subscription ID' })
  id: string;

  @ApiProperty({ description: 'Subscription status' })
  status: string;

  @ApiPropertyOptional({ description: 'Plan ID' })
  planId?: string;

  @ApiPropertyOptional({ description: 'Approval URL for subscriber redirect' })
  approveUrl?: string;

  @ApiPropertyOptional({ description: 'Start time' })
  startTime?: string;

  @ApiPropertyOptional({ description: 'All HATEOAS links' })
  links?: Array<{
    href: string;
    rel: string;
    method: string;
  }>;
}
