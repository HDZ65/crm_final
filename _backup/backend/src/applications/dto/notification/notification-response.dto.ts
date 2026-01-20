export class NotificationDto {
  id: string;
  organisationId: string;
  utilisateurId: string;
  type: string;
  titre: string;
  message: string;
  lu: boolean;
  metadata?: Record<string, any>;
  lienUrl?: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<NotificationDto>) {
    Object.assign(this, partial);
  }
}

export class NotificationCountDto {
  total: number;
  unread: number;

  constructor(total: number, unread: number) {
    this.total = total;
    this.unread = unread;
  }
}
