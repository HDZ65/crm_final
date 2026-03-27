import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaremeCommissionEntity } from '../../commercial/entities/bareme-commission.entity';
import { CommissionCalculationService } from '../../commercial/services/commission-calculation.service';
import { SubscriptionEntity, SubscriptionPlanType } from '../../subscriptions/entities/subscription.entity';

/**
 * Service for calculating commissions based on OTT sales channels.
 *
 * Handles channel-specific commission rates for different subscription plan types.
 * FREE_AVOD plans are excluded from commissions as they generate no revenue.
 */
@Injectable()
export class CommissionChannelService {
  constructor(
    @InjectRepository(BaremeCommissionEntity)
    private readonly baremeRepository: Repository<BaremeCommissionEntity>,
    private readonly commissionCalculationService: CommissionCalculationService,
  ) {}

  /**
   * Get the applicable commission rate (barème) for a given plan type and sales channel.
   *
   * @param planType - The subscription plan type (FREE_AVOD, PREMIUM_SVOD, VIP)
   * @param canalVente - The sales channel (web_direct, apple_store, google_store, tv_store, operator, affiliate)
   * @param keycloakGroupId - The organisation ID
   * @returns The applicable BaremeCommissionEntity or null if not found or FREE_AVOD
   */
  async getApplicableBareme(
    planType: SubscriptionPlanType,
    canalVente: string,
    keycloakGroupId: string,
  ): Promise<BaremeCommissionEntity | null> {
    // FREE_AVOD plans do not generate commissions
    if (planType === SubscriptionPlanType.FREE_AVOD) {
      return null;
    }

    // Query for active barème matching plan type and channel
    const bareme = await this.baremeRepository
      .createQueryBuilder('b')
      .leftJoinAndSelect('b.paliers', 'paliers')
      .where('b.keycloakGroupId = :keycloakGroupId', { keycloakGroupId })
      .andWhere('b.actif = true')
      .andWhere('b.typeProduit = :typeProduit', { typeProduit: planType })
      .andWhere('b.canalVente = :canalVente', { canalVente })
      .andWhere('b.dateEffet <= :now', { now: new Date() })
      .andWhere('(b.dateFin IS NULL OR b.dateFin >= :now)', { now: new Date() })
      .orderBy('b.version', 'DESC')
      .getOne();

    return bareme || null;
  }

  /**
   * Calculate commission for a subscription based on its plan type and sales channel.
   *
   * @param subscription - The subscription entity
   * @param apporteurId - The ID of the sales agent (apporteur)
   * @returns The calculated commission amount, or 0 if no commission applies
   */
  async calculateCommission(subscription: SubscriptionEntity, _apporteurId: string): Promise<number> {
    // Map store source to canal_vente
    const canalVente = this.mapStoreSourceToCanal(subscription.storeSource);

    // Get applicable barème
    const bareme = await this.getApplicableBareme(subscription.planType, canalVente, subscription.keycloakGroupId);

    // No barème found or FREE_AVOD → no commission
    if (!bareme) {
      return 0;
    }

    // Calculate commission using the existing commission calculation engine
    const result = this.commissionCalculationService.calculer(
      subscription,
      {
        typeCalcul: bareme.typeCalcul,
        montantFixe: bareme.montantFixe,
        tauxPourcentage: bareme.tauxPourcentage,
        paliers: bareme.paliers?.map((p) => ({
          seuilMin: Number(p.seuilMin),
          seuilMax: p.seuilMax ? Number(p.seuilMax) : null,
          montantPrime: Number(p.montantPrime),
          cumulable: p.cumulable,
          ordre: p.ordre,
        })),
      },
      Number(subscription.amount),
    );

    return result.montantCalcule;
  }

  /**
   * Map StoreSource enum to canal_vente string for barème lookup.
   *
   * @param storeSource - The store source from subscription
   * @returns The corresponding canal_vente string
   */
  private mapStoreSourceToCanal(storeSource: string): string {
    const mapping: Record<string, string> = {
      NONE: 'web_direct',
      WEB_DIRECT: 'web_direct',
      APPLE_STORE: 'apple_store',
      GOOGLE_STORE: 'google_store',
      TV_STORE: 'tv_store',
      BOX: 'operator',
    };

    return mapping[storeSource] || 'web_direct';
  }

  /**
   * Get all available OTT channels.
   *
   * @returns Array of channel identifiers
   */
  getAvailableChannels(): string[] {
    return ['web_direct', 'apple_store', 'google_store', 'tv_store', 'operator', 'affiliate'];
  }

  /**
   * Get commission rates for all channels for a given plan type.
   *
   * @param planType - The subscription plan type
   * @param keycloakGroupId - The organisation ID
   * @returns Map of channel to commission rate (percentage)
   */
  async getChannelRates(planType: SubscriptionPlanType, keycloakGroupId: string): Promise<Map<string, number>> {
    const rates = new Map<string, number>();

    // FREE_AVOD has no commission rates
    if (planType === SubscriptionPlanType.FREE_AVOD) {
      return rates;
    }

    const channels = this.getAvailableChannels();

    for (const channel of channels) {
      const bareme = await this.getApplicableBareme(planType, channel, keycloakGroupId);
      if (bareme?.tauxPourcentage) {
        rates.set(channel, Number(bareme.tauxPourcentage));
      }
    }

    return rates;
  }
}
