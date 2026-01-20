import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { CreatePaymentEventUseCase } from '../../../../../applications/usecase/payment-event/create-payment-event.usecase';
import { GetPaymentEventUseCase } from '../../../../../applications/usecase/payment-event/get-payment-event.usecase';
import { UpdatePaymentEventUseCase } from '../../../../../applications/usecase/payment-event/update-payment-event.usecase';
import { DeletePaymentEventUseCase } from '../../../../../applications/usecase/payment-event/delete-payment-event.usecase';
import { CreatePaymentEventDto } from '../../../../../applications/dto/payment-event/create-payment-event.dto';
import { UpdatePaymentEventDto } from '../../../../../applications/dto/payment-event/update-payment-event.dto';
import { PaymentEventResponseDto } from '../../../../../applications/dto/payment-event/payment-event-response.dto';

@Controller('payment-events')
export class PaymentEventController {
  constructor(
    private readonly createUseCase: CreatePaymentEventUseCase,
    private readonly getUseCase: GetPaymentEventUseCase,
    private readonly updateUseCase: UpdatePaymentEventUseCase,
    private readonly deleteUseCase: DeletePaymentEventUseCase,
  ) {}

  @Post()
  async create(
    @Body() dto: CreatePaymentEventDto,
  ): Promise<PaymentEventResponseDto> {
    const entity = await this.createUseCase.execute(dto);
    return this.toResponseDto(entity);
  }

  @Get()
  async findAll(
    @Query('paymentIntentId') paymentIntentId?: string,
    @Query('unprocessed') unprocessed?: string,
  ): Promise<PaymentEventResponseDto[]> {
    let entities;

    if (unprocessed === 'true') {
      entities = await this.getUseCase.findUnprocessed();
    } else if (paymentIntentId) {
      entities = await this.getUseCase.findByPaymentIntentId(paymentIntentId);
    } else {
      entities = await this.getUseCase.findAll();
    }

    return entities.map((e) => this.toResponseDto(e));
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<PaymentEventResponseDto> {
    const entity = await this.getUseCase.execute(id);
    if (!entity) {
      throw new Error('PaymentEvent not found');
    }
    return this.toResponseDto(entity);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdatePaymentEventDto,
  ): Promise<PaymentEventResponseDto> {
    const entity = await this.updateUseCase.execute(id, dto);
    return this.toResponseDto(entity);
  }

  @Delete(':id')
  async delete(@Param('id') id: string): Promise<void> {
    await this.deleteUseCase.execute(id);
  }

  private toResponseDto(entity: any): PaymentEventResponseDto {
    return {
      id: entity.id,
      organisationId: entity.organisationId,
      paymentIntentId: entity.paymentIntentId,
      eventType: entity.eventType,
      rawPayload: entity.rawPayload,
      receivedAt: entity.receivedAt,
      processed: entity.processed,
      processedAt: entity.processedAt,
      errorMessage: entity.errorMessage,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
