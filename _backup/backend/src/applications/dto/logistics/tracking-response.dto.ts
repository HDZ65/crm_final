export class TrackingEventDto {
  code: string;
  label: string;
  date: string;
  location?: string | null;

  constructor(partial: Partial<TrackingEventDto>) {
    Object.assign(this, partial);
  }
}

export class TrackingResponseDto {
  trackingNumber: string;
  status: string;
  events: TrackingEventDto[];
  lastUpdatedAt: string;

  constructor(partial: Partial<TrackingResponseDto>) {
    Object.assign(this, partial);
  }
}
