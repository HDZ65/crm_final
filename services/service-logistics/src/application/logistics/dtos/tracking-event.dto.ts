import { IsString, IsUUID, IsOptional } from 'class-validator';

export class CreateTrackingEventDto {
  @IsUUID()
  expeditionId: string;

  @IsString()
  code: string;

  @IsString()
  label: string;

  @IsString()
  dateEvenement: string;

  @IsOptional()
  @IsString()
  lieu?: string;

  @IsOptional()
  @IsString()
  raw?: string;
}

export class TrackingEventResponseDto {
  id: string;
  expeditionId: string;
  code: string;
  label: string;
  dateEvenement: string;
  lieu?: string;
  raw?: string;
  createdAt: string;
}
