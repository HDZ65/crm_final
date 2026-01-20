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
import { CreateScheduleUseCase } from '../../../../../applications/usecase/schedule/create-schedule.usecase';
import { GetScheduleUseCase } from '../../../../../applications/usecase/schedule/get-schedule.usecase';
import { UpdateScheduleUseCase } from '../../../../../applications/usecase/schedule/update-schedule.usecase';
import { DeleteScheduleUseCase } from '../../../../../applications/usecase/schedule/delete-schedule.usecase';
import { RenewScheduleUseCase } from '../../../../../applications/usecase/schedule/renew-schedule.usecase';
import { CreateScheduleDto } from '../../../../../applications/dto/schedule/create-schedule.dto';
import { UpdateScheduleDto } from '../../../../../applications/dto/schedule/update-schedule.dto';
import { RenewScheduleDto } from '../../../../../applications/dto/schedule/renew-schedule.dto';
import { ScheduleResponseDto } from '../../../../../applications/dto/schedule/schedule-response.dto';
import { PaymentSchedulerService } from '../../../../services/payment-scheduler.service';

@Controller('schedules')
export class ScheduleController {
  constructor(
    private readonly createUseCase: CreateScheduleUseCase,
    private readonly getUseCase: GetScheduleUseCase,
    private readonly updateUseCase: UpdateScheduleUseCase,
    private readonly deleteUseCase: DeleteScheduleUseCase,
    private readonly renewUseCase: RenewScheduleUseCase,
    private readonly paymentSchedulerService: PaymentSchedulerService,
  ) {}

  @Post()
  async create(@Body() dto: CreateScheduleDto): Promise<ScheduleResponseDto> {
    const entity = await this.createUseCase.execute(dto);
    return this.toResponseDto(entity);
  }

  @Get()
  async findAll(
    @Query('factureId') factureId?: string,
    @Query('contratId') contratId?: string,
  ): Promise<ScheduleResponseDto[]> {
    let entities;

    if (factureId) {
      entities = await this.getUseCase.findByFactureId(factureId);
    } else if (contratId) {
      entities = await this.getUseCase.findByContratId(contratId);
    } else {
      entities = await this.getUseCase.findAll();
    }

    return entities.map((e) => this.toResponseDto(e));
  }

  @Get('due')
  async findDue(@Query('date') date?: string): Promise<ScheduleResponseDto[]> {
    const checkDate = date ? new Date(date) : new Date();
    const entities = await this.getUseCase.findDueSchedules(checkDate);
    return entities.map((e) => this.toResponseDto(e));
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ScheduleResponseDto> {
    const entity = await this.getUseCase.execute(id);
    if (!entity) {
      throw new Error('Schedule not found');
    }
    return this.toResponseDto(entity);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateScheduleDto,
  ): Promise<ScheduleResponseDto> {
    const entity = await this.updateUseCase.execute(id, dto);
    return this.toResponseDto(entity);
  }

  @Delete(':id')
  async delete(@Param('id') id: string): Promise<void> {
    await this.deleteUseCase.execute(id);
  }

  /**
   * Manually trigger payment processing for all due schedules
   * This is useful for testing or manual intervention
   */
  @Post('process')
  async triggerProcessing(): Promise<{ processed: number; failed: number }> {
    return this.paymentSchedulerService.triggerPaymentProcessing();
  }

  /**
   * Renew an expired schedule with a new price
   * This reactivates the schedule and updates the associated contract
   */
  @Post(':id/renew')
  async renew(
    @Param('id') id: string,
    @Body() dto: RenewScheduleDto,
  ): Promise<ScheduleResponseDto> {
    const entity = await this.renewUseCase.execute(id, dto);
    return this.toResponseDto(entity);
  }

  private toResponseDto(entity: any): ScheduleResponseDto {
    return {
      id: entity.id,
      organisationId: entity.organisationId,
      factureId: entity.factureId,
      contratId: entity.contratId,
      societeId: entity.societeId,
      clientId: entity.clientId,
      produitId: entity.produitId,
      pspName: entity.pspName,
      amount: entity.amount,
      originalAmount: entity.originalAmount,
      currency: entity.currency,
      contractStartDate: entity.contractStartDate,
      contractEndDate: entity.contractEndDate,
      priceLockedAt: entity.priceLockedAt,
      dueDate: entity.dueDate,
      nextDueDate: entity.nextDueDate,
      isRecurring: entity.isRecurring,
      intervalUnit: entity.intervalUnit,
      intervalCount: entity.intervalCount,
      status: entity.status,
      retryCount: entity.retryCount,
      maxRetries: entity.maxRetries,
      lastFailureAt: entity.lastFailureAt,
      lastFailureReason: entity.lastFailureReason,
      pspMandateId: entity.pspMandateId,
      pspCustomerId: entity.pspCustomerId,
      metadata: entity.metadata,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
