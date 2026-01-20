export class LabelResponseDto {
  trackingNumber: string;
  labelUrl: string;
  estimatedDeliveryDate?: string | null;

  constructor(partial: Partial<LabelResponseDto>) {
    Object.assign(this, partial);
  }
}
