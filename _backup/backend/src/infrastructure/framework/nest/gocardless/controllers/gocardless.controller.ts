import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';

// DTOs
import {
  SetupMandateDto,
  SetupMandateResponseDto,
} from '../../../../../applications/dto/gocardless/setup-mandate.dto';
import {
  CreateGoCardlessPaymentDto,
  GoCardlessPaymentResponseDto,
} from '../../../../../applications/dto/gocardless/create-payment.dto';
import {
  CreateGoCardlessSubscriptionDto,
  GoCardlessSubscriptionResponseDto,
} from '../../../../../applications/dto/gocardless/create-subscription.dto';
import { GoCardlessMandateDto } from '../../../../../applications/dto/gocardless/gocardless-mandate-response.dto';
import { UpdateGoCardlessMandateDto } from '../../../../../applications/dto/gocardless/update-gocardless-mandate.dto';

// Use Cases
import { SetupMandateUseCase } from '../../../../../applications/usecase/gocardless/setup-mandate.usecase';
import { GetGoCardlessMandateUseCase } from '../../../../../applications/usecase/gocardless/get-gocardless-mandate.usecase';
import { UpdateGoCardlessMandateUseCase } from '../../../../../applications/usecase/gocardless/update-gocardless-mandate.usecase';
import { DeleteGoCardlessMandateUseCase } from '../../../../../applications/usecase/gocardless/delete-gocardless-mandate.usecase';
import { CreateGoCardlessPaymentUseCase } from '../../../../../applications/usecase/gocardless/create-gocardless-payment.usecase';
import { CreateGoCardlessSubscriptionUseCase } from '../../../../../applications/usecase/gocardless/create-gocardless-subscription.usecase';
import { CancelGoCardlessSubscriptionUseCase } from '../../../../../applications/usecase/gocardless/cancel-gocardless-subscription.usecase';

// Service
import { GoCardlessService } from '../../../../services/gocardless.service';

@ApiTags('GoCardless')
@Controller('gocardless')
export class GoCardlessController {
  private readonly logger = new Logger(GoCardlessController.name);

  constructor(
    private readonly setupMandateUseCase: SetupMandateUseCase,
    private readonly getMandateUseCase: GetGoCardlessMandateUseCase,
    private readonly updateMandateUseCase: UpdateGoCardlessMandateUseCase,
    private readonly deleteMandateUseCase: DeleteGoCardlessMandateUseCase,
    private readonly createPaymentUseCase: CreateGoCardlessPaymentUseCase,
    private readonly createSubscriptionUseCase: CreateGoCardlessSubscriptionUseCase,
    private readonly cancelSubscriptionUseCase: CancelGoCardlessSubscriptionUseCase,
    private readonly gocardlessService: GoCardlessService,
  ) {}

  // ============================================
  // MANDATE SETUP
  // ============================================

  @Post('setup-mandate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Setup a new Direct Debit mandate for a client' })
  @ApiResponse({
    status: 200,
    description: 'Returns billing request ID and authorization URL',
    type: SetupMandateResponseDto,
  })
  async setupMandate(@Body() dto: SetupMandateDto): Promise<SetupMandateResponseDto> {
    this.logger.log(`Setting up mandate for client: ${dto.clientId}`);
    return this.setupMandateUseCase.execute(dto);
  }

  // ============================================
  // MANDATES (Database Records)
  // ============================================

  @Get('mandates')
  @ApiOperation({ summary: 'List all mandate records' })
  @ApiQuery({ name: 'clientId', required: false })
  async listMandates(
    @Query('clientId') clientId?: string,
  ): Promise<GoCardlessMandateDto[]> {
    if (clientId) {
      const entities = await this.getMandateUseCase.executeByClientId(clientId);
      return entities.map((e) => new GoCardlessMandateDto(e));
    }
    const entities = await this.getMandateUseCase.executeAll();
    return entities.map((e) => new GoCardlessMandateDto(e));
  }

  @Get('mandates/:id')
  @ApiOperation({ summary: 'Get a mandate record by ID' })
  async getMandate(@Param('id') id: string): Promise<GoCardlessMandateDto> {
    const entity = await this.getMandateUseCase.execute(id);
    return new GoCardlessMandateDto(entity);
  }

  @Get('mandates/client/:clientId/active')
  @ApiOperation({ summary: 'Get active mandate for a client' })
  async getActiveMandateForClient(
    @Param('clientId') clientId: string,
  ): Promise<GoCardlessMandateDto | null> {
    const entity = await this.getMandateUseCase.executeActiveByClientId(clientId);
    return entity ? new GoCardlessMandateDto(entity) : null;
  }

  @Put('mandates/:id')
  @ApiOperation({ summary: 'Update a mandate record' })
  async updateMandate(
    @Param('id') id: string,
    @Body() dto: UpdateGoCardlessMandateDto,
  ): Promise<GoCardlessMandateDto> {
    const entity = await this.updateMandateUseCase.execute(id, dto);
    return new GoCardlessMandateDto(entity);
  }

  @Delete('mandates/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a mandate record' })
  async deleteMandate(@Param('id') id: string): Promise<void> {
    await this.deleteMandateUseCase.execute(id);
  }

  @Post('mandates/:mandateId/cancel')
  @ApiOperation({ summary: 'Cancel a mandate in GoCardless' })
  async cancelMandate(@Param('mandateId') mandateId: string): Promise<any> {
    this.logger.log(`Cancelling mandate: ${mandateId}`);
    const mandate = await this.gocardlessService.cancelMandate(mandateId);

    // Update local record
    await this.updateMandateUseCase.executeByMandateId(mandateId, {
      mandateStatus: 'cancelled',
    });

    return mandate;
  }

  // ============================================
  // PAYMENTS
  // ============================================

  @Post('payments')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a one-off payment' })
  async createPayment(
    @Body() dto: CreateGoCardlessPaymentDto,
  ): Promise<GoCardlessPaymentResponseDto> {
    return this.createPaymentUseCase.execute(dto);
  }

  @Post('payments/client/:clientId')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a payment for a client using their active mandate' })
  async createPaymentForClient(
    @Param('clientId') clientId: string,
    @Body() body: { amount: number; currency?: string; reference?: string; description?: string },
  ): Promise<GoCardlessPaymentResponseDto> {
    return this.createPaymentUseCase.executeByClientId(
      clientId,
      body.amount,
      body.currency,
      {
        reference: body.reference,
        description: body.description,
      },
    );
  }

  @Get('payments/:paymentId')
  @ApiOperation({ summary: 'Get payment details from GoCardless' })
  async getPayment(@Param('paymentId') paymentId: string): Promise<any> {
    return this.gocardlessService.getPayment(paymentId);
  }

  @Get('payments')
  @ApiOperation({ summary: 'List payments from GoCardless' })
  @ApiQuery({ name: 'mandateId', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async listPayments(
    @Query('mandateId') mandateId?: string,
    @Query('status') status?: string,
    @Query('limit') limit?: number,
  ): Promise<any[]> {
    return this.gocardlessService.listPayments({
      mandate: mandateId,
      status,
      limit,
    });
  }

  @Post('payments/:paymentId/cancel')
  @ApiOperation({ summary: 'Cancel a pending payment' })
  async cancelPayment(@Param('paymentId') paymentId: string): Promise<any> {
    return this.gocardlessService.cancelPayment(paymentId);
  }

  @Post('payments/:paymentId/retry')
  @ApiOperation({ summary: 'Retry a failed payment' })
  async retryPayment(@Param('paymentId') paymentId: string): Promise<any> {
    return this.gocardlessService.retryPayment(paymentId);
  }

  // ============================================
  // SUBSCRIPTIONS
  // ============================================

  @Post('subscriptions')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a recurring subscription' })
  async createSubscription(
    @Body() dto: CreateGoCardlessSubscriptionDto,
  ): Promise<GoCardlessSubscriptionResponseDto> {
    return this.createSubscriptionUseCase.execute(dto);
  }

  @Post('subscriptions/client/:clientId')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a subscription for a client using their active mandate' })
  async createSubscriptionForClient(
    @Param('clientId') clientId: string,
    @Body()
    body: {
      amount: number;
      currency?: string;
      name?: string;
      intervalUnit?: 'weekly' | 'monthly' | 'yearly';
      dayOfMonth?: number;
    },
  ): Promise<GoCardlessSubscriptionResponseDto> {
    return this.createSubscriptionUseCase.executeByClientId(
      clientId,
      body.amount,
      body.currency,
      {
        name: body.name,
        intervalUnit: body.intervalUnit,
        dayOfMonth: body.dayOfMonth,
      },
    );
  }

  @Get('subscriptions/:subscriptionId')
  @ApiOperation({ summary: 'Get subscription details from GoCardless' })
  async getSubscription(@Param('subscriptionId') subscriptionId: string): Promise<any> {
    return this.gocardlessService.getSubscription(subscriptionId);
  }

  @Get('subscriptions')
  @ApiOperation({ summary: 'List subscriptions from GoCardless' })
  @ApiQuery({ name: 'mandateId', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async listSubscriptions(
    @Query('mandateId') mandateId?: string,
    @Query('status') status?: string,
    @Query('limit') limit?: number,
  ): Promise<any[]> {
    return this.gocardlessService.listSubscriptions({
      mandate: mandateId,
      status,
      limit,
    });
  }

  @Post('subscriptions/:subscriptionId/cancel')
  @ApiOperation({ summary: 'Cancel a subscription' })
  async cancelSubscription(
    @Param('subscriptionId') subscriptionId: string,
  ): Promise<GoCardlessSubscriptionResponseDto> {
    return this.cancelSubscriptionUseCase.execute(subscriptionId);
  }

  @Post('subscriptions/:subscriptionId/pause')
  @ApiOperation({ summary: 'Pause a subscription' })
  async pauseSubscription(@Param('subscriptionId') subscriptionId: string): Promise<any> {
    return this.gocardlessService.pauseSubscription(subscriptionId);
  }

  @Post('subscriptions/:subscriptionId/resume')
  @ApiOperation({ summary: 'Resume a paused subscription' })
  async resumeSubscription(@Param('subscriptionId') subscriptionId: string): Promise<any> {
    return this.gocardlessService.resumeSubscription(subscriptionId);
  }
}
