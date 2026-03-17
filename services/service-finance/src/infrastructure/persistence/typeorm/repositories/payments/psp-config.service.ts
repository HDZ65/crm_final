import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  IPspConfigRepository,
  PspTypeEnum,
} from '../../../../../domain/payments/repositories/IPspConfigRepository';
import { StripeAccountEntity } from '../../../../../domain/payments/entities/stripe-account.entity';
import { GoCardlessAccountEntity } from '../../../../../domain/payments/entities/gocardless-account.entity';
import { SlimpayAccountEntity } from '../../../../../domain/payments/entities/slimpay-account.entity';
import { MultiSafepayAccountEntity } from '../../../../../domain/payments/entities/multisafepay-account.entity';
import { EmerchantpayAccountEntity } from '../../../../../domain/payments/entities/emerchantpay-account.entity';
import { PaypalAccountEntity } from '../../../../../domain/payments/entities/paypal-account.entity';

@Injectable()
export class PspConfigService implements IPspConfigRepository {
  private readonly logger = new Logger(PspConfigService.name);

  constructor(
    @InjectRepository(StripeAccountEntity)
    private readonly stripeRepo: Repository<StripeAccountEntity>,
    @InjectRepository(GoCardlessAccountEntity)
    private readonly goCardlessRepo: Repository<GoCardlessAccountEntity>,
    @InjectRepository(SlimpayAccountEntity)
    private readonly slimpayRepo: Repository<SlimpayAccountEntity>,
    @InjectRepository(MultiSafepayAccountEntity)
    private readonly multiSafepayRepo: Repository<MultiSafepayAccountEntity>,
    @InjectRepository(EmerchantpayAccountEntity)
    private readonly emerchantpayRepo: Repository<EmerchantpayAccountEntity>,
    @InjectRepository(PaypalAccountEntity)
    private readonly paypalRepo: Repository<PaypalAccountEntity>,
  ) {}

  async findBySocieteIdAndType(
    societeId: string,
    pspType: PspTypeEnum,
  ): Promise<any | null> {
    const repo = this.getRepositoryForType(pspType);
    if (!repo) {
      this.logger.warn(`Unknown PSP type: ${pspType}`);
      return null;
    }

    return repo.findOne({
      where: { societeId, actif: true } as any,
    });
  }

  async save(
    societeId: string,
    pspType: PspTypeEnum,
    data: Record<string, any>,
  ): Promise<any> {
    const repo = this.getRepositoryForType(pspType);
    if (!repo) {
      throw new Error(`Unknown PSP type: ${pspType}`);
    }

    // Upsert: find existing active or inactive account for this societeId
    const existing = await repo.findOne({
      where: { societeId } as any,
    });

    if (existing) {
      // Update existing entity with new data
      Object.assign(existing, data, { actif: true });
      return repo.save(existing);
    }

    // Create new entity
    const entity = repo.create({
      societeId,
      actif: true,
      ...data,
    } as any);

    return repo.save(entity);
  }

  async deactivate(
    societeId: string,
    pspType: PspTypeEnum,
  ): Promise<boolean> {
    const repo = this.getRepositoryForType(pspType);
    if (!repo) {
      this.logger.warn(`Unknown PSP type for deactivation: ${pspType}`);
      return false;
    }

    const existing = await repo.findOne({
      where: { societeId, actif: true } as any,
    });

    if (!existing) {
      return false;
    }

    (existing as any).actif = false;
    await repo.save(existing);
    return true;
  }

  private getRepositoryForType(
    pspType: PspTypeEnum,
  ): Repository<any> | null {
    switch (pspType) {
      case PspTypeEnum.STRIPE:
        return this.stripeRepo;
      case PspTypeEnum.GOCARDLESS:
        return this.goCardlessRepo;
      case PspTypeEnum.SLIMPAY:
        return this.slimpayRepo;
      case PspTypeEnum.MULTISAFEPAY:
        return this.multiSafepayRepo;
      case PspTypeEnum.EMERCHANTPAY:
        return this.emerchantpayRepo;
      case PspTypeEnum.PAYPAL:
        return this.paypalRepo;
      default:
        return null;
    }
  }
}
