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
import { CreatePaymentIntentUseCase } from '../../../../../applications/usecase/payment-intent/create-payment-intent.usecase';
import { GetPaymentIntentUseCase } from '../../../../../applications/usecase/payment-intent/get-payment-intent.usecase';
import { UpdatePaymentIntentUseCase } from '../../../../../applications/usecase/payment-intent/update-payment-intent.usecase';
import { DeletePaymentIntentUseCase } from '../../../../../applications/usecase/payment-intent/delete-payment-intent.usecase';
import { CreatePaymentIntentDto } from '../../../../../applications/dto/payment-intent/create-payment-intent.dto';
import { UpdatePaymentIntentDto } from '../../../../../applications/dto/payment-intent/update-payment-intent.dto';
import { PaymentIntentResponseDto } from '../../../../../applications/dto/payment-intent/payment-intent-response.dto';

@Controller('payment-intents')
export class PaymentIntentController {
  constructor(
    private readonly createUseCase: CreatePaymentIntentUseCase,
    private readonly getUseCase: GetPaymentIntentUseCase,
    private readonly updateUseCase: UpdatePaymentIntentUseCase,
    private readonly deleteUseCase: DeletePaymentIntentUseCase,
  ) {}

  @Post()
  async create(
    @Body() dto: CreatePaymentIntentDto,
  ): Promise<PaymentIntentResponseDto> {
    const entity = await this.createUseCase.execute(dto);
    return this.toResponseDto(entity);
  }

  @Get()
  async findAll(
    @Query('scheduleId') scheduleId?: string,
  ): Promise<PaymentIntentResponseDto[]> {
    let entities;

    if (scheduleId) {
      entities = await this.getUseCase.findByScheduleId(scheduleId);
    } else {
      entities = await this.getUseCase.findAll();
    }

    return entities.map((e) => this.toResponseDto(e));
  }

  @Get('idempotency/:key')
  async findByIdempotencyKey(
    @Param('key') key: string,
  ): Promise<PaymentIntentResponseDto | null> {
    const entity = await this.getUseCase.findByIdempotencyKey(key);
    return entity ? this.toResponseDto(entity) : null;
  }

  @Get('psp/:pspPaymentId')
  async findByPspPaymentId(
    @Param('pspPaymentId') pspPaymentId: string,
  ): Promise<PaymentIntentResponseDto | null> {
    const entity = await this.getUseCase.findByPspPaymentId(pspPaymentId);
    return entity ? this.toResponseDto(entity) : null;
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<PaymentIntentResponseDto> {
    const entity = await this.getUseCase.execute(id);
    if (!entity) {
      throw new Error('PaymentIntent not found');
    }
    return this.toResponseDto(entity);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdatePaymentIntentDto,
  ): Promise<PaymentIntentResponseDto> {
    const entity = await this.updateUseCase.execute(id, dto);
    return this.toResponseDto(entity);
  }

  @Delete(':id')
  async delete(@Param('id') id: string): Promise<void> {
    await this.deleteUseCase.execute(id);
  }

  private toResponseDto(entity: any): PaymentIntentResponseDto {
    return {
      id: entity.id,
      organisationId: entity.organisationId,
      scheduleId: entity.scheduleId,
      pspName: entity.pspName,
      pspPaymentId: entity.pspPaymentId,
      amount: entity.amount,
      currency: entity.currency,
      status: entity.status,
      idempotencyKey: entity.idempotencyKey,
      mandateReference: entity.mandateReference,
      metadata: entity.metadata,
      errorCode: entity.errorCode,
      errorMessage: entity.errorMessage,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
