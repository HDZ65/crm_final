export enum PspTypeEnum {
  STRIPE = 'stripe',
  PAYPAL = 'paypal',
  GOCARDLESS = 'gocardless',
  EMERCHANTPAY = 'emerchantpay',
  SLIMPAY = 'slimpay',
  MULTISAFEPAY = 'multisafepay',
}

export interface IPspConfigRepository {
  /**
   * Find an active PSP account config for a given société and PSP type.
   * Returns null if not found or not active.
   */
  findBySocieteIdAndType(societeId: string, pspType: PspTypeEnum): Promise<any | null>;

  /**
   * Create or update (upsert) a PSP account config.
   * Sets actif = true. If account already exists for this societeId+pspType, updates it.
   */
  save(societeId: string, pspType: PspTypeEnum, data: Record<string, any>): Promise<any>;

  /**
   * Soft-delete: sets actif = false without deleting the entity.
   */
  deactivate(societeId: string, pspType: PspTypeEnum): Promise<boolean>;
}

export const I_PSP_CONFIG_REPOSITORY = Symbol('IPspConfigRepository');
