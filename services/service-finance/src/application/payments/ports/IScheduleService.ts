import {
  CreateScheduleDto,
  UpdateScheduleDto,
  ScheduleResponseDto,
} from '../dtos';
import { PaginationDto, PaginationResponseDto } from '../../shared/dtos';

export interface IScheduleService {
  create(dto: CreateScheduleDto): Promise<ScheduleResponseDto>;
  update(dto: UpdateScheduleDto): Promise<ScheduleResponseDto>;
  findById(id: string): Promise<ScheduleResponseDto>;
  findByClient(
    clientId: string,
    pagination?: PaginationDto,
  ): Promise<{
    schedules: ScheduleResponseDto[];
    pagination: PaginationResponseDto;
  }>;
  pause(id: string): Promise<ScheduleResponseDto>;
  resume(id: string): Promise<ScheduleResponseDto>;
  cancel(id: string): Promise<ScheduleResponseDto>;
}

export const SCHEDULE_SERVICE = Symbol('IScheduleService');
