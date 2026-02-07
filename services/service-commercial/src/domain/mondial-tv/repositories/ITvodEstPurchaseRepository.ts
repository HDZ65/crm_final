import { TvodEstPurchaseEntity } from '../entities/tvod-est-purchase.entity';

export interface AggregateMetrics {
  totalVolume: number;
  totalRevenue: number;
  averageBasket: number;
  transactionCount: number;
}

export interface ITvodEstPurchaseRepository {
  /**
   * Find a purchase by ID
   */
  findById(id: string): Promise<TvodEstPurchaseEntity | null>;

  /**
   * Find all purchases for a client
   */
  findByClient(
    organisationId: string,
    clientId: string,
    limit?: number,
    offset?: number,
  ): Promise<TvodEstPurchaseEntity[]>;

  /**
   * Find all purchases for a specific content
   */
  findByContentId(
    organisationId: string,
    contentId: string,
    limit?: number,
    offset?: number,
  ): Promise<TvodEstPurchaseEntity[]>;

  /**
   * Find purchases by status
   */
  findByStatus(
    organisationId: string,
    status: string,
    limit?: number,
    offset?: number,
  ): Promise<TvodEstPurchaseEntity[]>;

  /**
   * Create a new purchase
   */
  create(purchase: Partial<TvodEstPurchaseEntity>): Promise<TvodEstPurchaseEntity>;

  /**
   * Update an existing purchase
   */
  update(id: string, purchase: Partial<TvodEstPurchaseEntity>): Promise<TvodEstPurchaseEntity>;

  /**
   * Calculate aggregate metrics for a client
   */
  calculateAggregates(
    organisationId: string,
    clientId: string,
  ): Promise<AggregateMetrics>;

  /**
   * Calculate aggregate metrics for content
   */
  calculateContentAggregates(
    organisationId: string,
    contentId: string,
  ): Promise<AggregateMetrics>;

  /**
   * Count total purchases for a client
   */
  countByClient(organisationId: string, clientId: string): Promise<number>;

  /**
   * Count total purchases for content
   */
  countByContent(organisationId: string, contentId: string): Promise<number>;
}
