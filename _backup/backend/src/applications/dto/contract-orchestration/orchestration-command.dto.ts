import { IsOptional, IsObject } from 'class-validator';

export class OrchestrationCommandDto {
  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>;
}
