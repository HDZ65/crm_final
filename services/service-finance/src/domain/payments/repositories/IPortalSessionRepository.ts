import { PortalPaymentSessionEntity } from '../entities/portal-session.entity';

export interface IPortalSessionRepository {
  findById(id: string): Promise<PortalPaymentSessionEntity | null>;
  findByTokenHash(tokenHash: string): Promise<PortalPaymentSessionEntity | null>;
  findByCustomer(customerId: string): Promise<PortalPaymentSessionEntity[]>;
  findActiveByCustomer(customerId: string): Promise<PortalPaymentSessionEntity[]>;
  save(entity: PortalPaymentSessionEntity): Promise<PortalPaymentSessionEntity>;
}
