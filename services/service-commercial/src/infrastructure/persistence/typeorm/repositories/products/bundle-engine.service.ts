import { Injectable, Logger, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NatsService } from '@crm/shared-kernel';
import { ConfigurationBundleEntity } from '../../../../../domain/products/entities/configuration-bundle.entity';

export enum BundleServiceCode {
  CONCIERGERIE = 'CONCIERGERIE',
  JUSTI_PLUS = 'JUSTI_PLUS',
  WINCASH = 'WINCASH',
}

export interface BundleServicePriceLine {
  service: BundleServiceCode;
  basePrice: number;
  discount: number;
  finalPrice: number;
}

export interface BundlePriceResult {
  clientId: string;
  organisationId: string;
  configurationId: string;
  items: BundleServicePriceLine[];
  sousTotalHt: number;
  remiseBundle: number;
  totalHt: number;
}

export interface RecalculateOnServiceChangeInput {
  clientId: string;
  organisationId: string;
  services: string[];
  serviceChanged: string;
  action: 'added' | 'removed';
  startDate?: Date;
  endDate?: Date;
}

export interface BundlePriceRecalculatedEvent {
  clientId: string;
  organisationId: string;
  configurationId: string;
  services: string[];
  serviceChanged: string;
  action: 'added' | 'removed';
  sousTotalHt: number;
  remiseBundle: number;
  totalHt: number;
  occurredAt: string;
}

@Injectable()
export class BundleEngineService {
  private readonly logger = new Logger(BundleEngineService.name);

  constructor(
    @InjectRepository(ConfigurationBundleEntity)
    private readonly configurationBundleRepository: Repository<ConfigurationBundleEntity>,
    @Optional()
    private readonly natsService?: NatsService,
  ) {}

  async calculatePrice(
    clientId: string,
    services: string[],
    organisationId?: string,
  ): Promise<BundlePriceResult> {
    const configuration = await this.getConfiguration(organisationId);
    return this.calculateFromConfiguration(clientId, configuration, services);
  }

  async recalculateOnServiceChange(input: RecalculateOnServiceChangeInput): Promise<BundlePriceResult> {
    const configuration = await this.getConfiguration(input.organisationId);
    const result = this.calculateFromConfiguration(input.clientId, configuration, input.services);

    const serviceChanged = this.normalizeService(input.serviceChanged);
    if (
      serviceChanged &&
      input.action === 'added' &&
      input.startDate &&
      input.endDate &&
      configuration.proRataEnabled
    ) {
      const changedItem = result.items.find((item) => item.service === serviceChanged);
      if (changedItem) {
        changedItem.finalPrice = this.calculateProRata(changedItem.finalPrice, input.startDate, input.endDate);
        changedItem.discount = this.round(changedItem.basePrice - changedItem.finalPrice);

        result.sousTotalHt = this.round(result.items.reduce((sum, item) => sum + item.basePrice, 0));
        result.remiseBundle = this.round(result.items.reduce((sum, item) => sum + item.discount, 0));
        result.totalHt = this.round(result.items.reduce((sum, item) => sum + item.finalPrice, 0));
      }
    }

    await this.publishPriceRecalculated({
      clientId: input.clientId,
      organisationId: input.organisationId,
      configurationId: result.configurationId,
      services: result.items.map((item) => item.service),
      serviceChanged: serviceChanged || input.serviceChanged,
      action: input.action,
      sousTotalHt: result.sousTotalHt,
      remiseBundle: result.remiseBundle,
      totalHt: result.totalHt,
      occurredAt: new Date().toISOString(),
    });

    return result;
  }

  calculateProRata(price: number, startDate: Date, endDate: Date): number {
    const periodDays = this.diffInDays(startDate, endDate);
    if (periodDays <= 0) {
      return 0;
    }

    const monthDays = Math.max(1, endDate.getDate());
    return this.round((Number(price || 0) * periodDays) / monthDays);
  }

  async getConfigurationById(id: string): Promise<ConfigurationBundleEntity | null> {
    return this.configurationBundleRepository.findOne({ where: { id, actif: true } });
  }

  async getConfigurationByOrganisation(organisationId: string): Promise<ConfigurationBundleEntity | null> {
    return this.configurationBundleRepository.findOne({ where: { organisationId, actif: true } });
  }

  async updateConfiguration(
    id: string,
    payload: Partial<ConfigurationBundleEntity>,
  ): Promise<ConfigurationBundleEntity | null> {
    const configuration = await this.getConfigurationById(id);
    if (!configuration) {
      return null;
    }

    Object.assign(configuration, payload);
    return this.configurationBundleRepository.save(configuration);
  }

  private calculateFromConfiguration(
    clientId: string,
    configuration: ConfigurationBundleEntity,
    services: string[],
  ): BundlePriceResult {
    const uniqueServices = this.normalizeServices(services);

    const basePriceMap: Record<BundleServiceCode, number> = {
      [BundleServiceCode.CONCIERGERIE]: this.round(
        Number(configuration.prixConciergerieStandalone || configuration.prixStandalone || 0),
      ),
      [BundleServiceCode.JUSTI_PLUS]: this.round(
        Number(configuration.prixJustiPlusStandalone || configuration.prixStandalone || 0),
      ),
      [BundleServiceCode.WINCASH]: this.round(
        Number(configuration.prixWincashStandalone || configuration.prixStandalone || 0),
      ),
    };

    const hasConciergerie = uniqueServices.includes(BundleServiceCode.CONCIERGERIE);
    const hasJustiPlus = uniqueServices.includes(BundleServiceCode.JUSTI_PLUS);
    const hasWincash = uniqueServices.includes(BundleServiceCode.WINCASH);

    const discountByService: Record<BundleServiceCode, number> = {
      [BundleServiceCode.CONCIERGERIE]: 0,
      [BundleServiceCode.JUSTI_PLUS]: 0,
      [BundleServiceCode.WINCASH]: 0,
    };

    if (hasConciergerie && hasJustiPlus && hasWincash) {
      const justiBase = basePriceMap[BundleServiceCode.JUSTI_PLUS];
      const wincashBase = basePriceMap[BundleServiceCode.WINCASH];
      const bundleDiscount = Math.min(
        Number(configuration.remiseBothAvecConciergerie || 0),
        this.round(justiBase + wincashBase),
      );

      const bothBase = justiBase + wincashBase;
      if (bothBase > 0) {
        const justiPart = this.round(bundleDiscount * (justiBase / bothBase));
        discountByService[BundleServiceCode.JUSTI_PLUS] = this.round(Math.min(justiBase, justiPart));
        discountByService[BundleServiceCode.WINCASH] = this.round(
          Math.min(wincashBase, this.round(bundleDiscount - justiPart)),
        );
      }
    } else {
      if (hasConciergerie && hasJustiPlus) {
        discountByService[BundleServiceCode.JUSTI_PLUS] = this.round(
          Math.min(
            basePriceMap[BundleServiceCode.JUSTI_PLUS],
            Number(configuration.remiseJustiPlusAvecConciergerie || 0),
          ),
        );
      }

      if (hasConciergerie && hasWincash) {
        discountByService[BundleServiceCode.WINCASH] = this.round(
          Math.min(
            basePriceMap[BundleServiceCode.WINCASH],
            Number(configuration.remiseWincashAvecConciergerie || 0),
          ),
        );
      }
    }

    const items = uniqueServices.map((service) => {
      const basePrice = basePriceMap[service] || 0;
      const discount = discountByService[service] || 0;
      const finalPrice = this.round(Math.max(0, basePrice - discount));

      return {
        service,
        basePrice: this.round(basePrice),
        discount: this.round(discount),
        finalPrice,
      };
    });

    const sousTotalHt = this.round(items.reduce((sum, item) => sum + item.basePrice, 0));
    const remiseBundle = this.round(items.reduce((sum, item) => sum + item.discount, 0));
    const totalHt = this.round(items.reduce((sum, item) => sum + item.finalPrice, 0));

    return {
      clientId,
      organisationId: configuration.organisationId,
      configurationId: configuration.id,
      items,
      sousTotalHt,
      remiseBundle,
      totalHt,
    };
  }

  private async getConfiguration(organisationId?: string): Promise<ConfigurationBundleEntity> {
    const configuration = organisationId
      ? await this.configurationBundleRepository.findOne({ where: { organisationId, actif: true } })
      : await this.configurationBundleRepository.findOne({ where: { actif: true }, order: { updatedAt: 'DESC' } });

    if (!configuration) {
      throw new Error('Aucune configuration bundle active');
    }

    return configuration;
  }

  private normalizeServices(services: string[]): BundleServiceCode[] {
    const normalized = services
      .map((service) => this.normalizeService(service))
      .filter((service): service is BundleServiceCode => Boolean(service));
    return Array.from(new Set(normalized));
  }

  private normalizeService(service: string): BundleServiceCode | null {
    const value = String(service || '')
      .trim()
      .toUpperCase()
      .replace(/[-\s+]/g, '_');

    if (value.includes('CONCIERGERIE')) {
      return BundleServiceCode.CONCIERGERIE;
    }

    if (value.includes('JUSTI')) {
      return BundleServiceCode.JUSTI_PLUS;
    }

    if (value.includes('WINCASH')) {
      return BundleServiceCode.WINCASH;
    }

    return null;
  }

  private async publishPriceRecalculated(payload: BundlePriceRecalculatedEvent): Promise<void> {
    if (!this.natsService) {
      return;
    }

    if (!this.natsService.isConnected()) {
      this.logger.warn('NATS indisponible, event bundle.price.recalculated non publie');
      return;
    }

    await this.natsService.publish('bundle.price.recalculated', payload);
  }

  private diffInDays(startDate: Date, endDate: Date): number {
    const start = Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate());
    const end = Date.UTC(endDate.getUTCFullYear(), endDate.getUTCMonth(), endDate.getUTCDate());

    return Math.max(0, Math.floor((end - start) / (24 * 60 * 60 * 1000)));
  }

  private round(value: number): number {
    return Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;
  }
}
