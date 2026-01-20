import { IsOptional, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CapturePaypalOrderDto {
  @ApiPropertyOptional({ description: 'ID de la société (pour multi-compte)' })
  @IsUUID()
  @IsOptional()
  societeId?: string;
}
