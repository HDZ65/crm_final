import { status } from '@grpc/grpc-js';
import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { DataSource, In, Repository } from 'typeorm';
import {
  DocumentProduitEntity,
  ProductAccountingMappingEntity,
  ProduitEntity,
  PublicationProduitEntity,
  TypeDocumentProduit,
  VersionProduitEntity,
} from '../entities';
import { PricingRuleEntity } from '../entities/pricing-rule.entity';
import { AccountingNature } from '../enums/accounting-nature.enum';
import { RevenueModelEnum } from '../enums/revenue-model.enum';

interface PublicationCheck {
  name: string;
  passed: boolean;
  message?: string;
}

@Injectable()
export class ProductValidationService {
  private readonly versionRepo: Repository<VersionProduitEntity>;
  private readonly documentRepo: Repository<DocumentProduitEntity>;
  private readonly publicationRepo: Repository<PublicationProduitEntity>;
  private readonly pricingRuleRepo: Repository<PricingRuleEntity>;
  private readonly accountingMappingRepo: Repository<ProductAccountingMappingEntity>;
  private readonly produitRepo: Repository<ProduitEntity>;

  private static readonly ALLOWED_TAX_RATES = [0, 5.5, 10, 20];

  constructor(private readonly dataSource: DataSource) {
    this.versionRepo = this.dataSource.getRepository(VersionProduitEntity);
    this.documentRepo = this.dataSource.getRepository(DocumentProduitEntity);
    this.publicationRepo = this.dataSource.getRepository(PublicationProduitEntity);
    this.pricingRuleRepo = this.dataSource.getRepository(PricingRuleEntity);
    this.accountingMappingRepo = this.dataSource.getRepository(ProductAccountingMappingEntity);
    this.produitRepo = this.dataSource.getRepository(ProduitEntity);
  }

  validateTaxRate(rate: number): { valid: boolean; message?: string } {
    const numericRate = Number(rate);
    if (!Number.isFinite(numericRate)) {
      return { valid: false, message: 'TVA rate must be a number' };
    }

    const isAllowed = ProductValidationService.ALLOWED_TAX_RATES.some(
      (allowedRate) => Math.abs(allowedRate - numericRate) < 0.0001,
    );

    if (!isAllowed) {
      return {
        valid: false,
        message: 'TVA rate must be one of: 0, 5.5, 10, 20',
      };
    }

    return { valid: true };
  }

  async validateDocumentCompleteness(
    versionId: string,
    channels: string[],
  ): Promise<{ valid: boolean; missing: string[] }> {
    const requiresWebDocuments = channels.some((channel) => channel.toLowerCase().includes('web'));

    if (!requiresWebDocuments) {
      return { valid: true, missing: [] };
    }

    const requiredTypes = [TypeDocumentProduit.DIPA, TypeDocumentProduit.CG];
    const documents = await this.documentRepo.find({
      where: {
        versionProduitId: versionId,
        type: In(requiredTypes),
      },
    });

    const presentTypes = new Set(documents.map((document) => document.type));
    const missing = requiredTypes
      .filter((requiredType) => !presentTypes.has(requiredType))
      .map((requiredType) => requiredType.toLowerCase());

    return {
      valid: missing.length === 0,
      missing,
    };
  }

  async checkPublicationLock(productId: string): Promise<{ locked: boolean; activePublications: number }> {
    const now = new Date();
    const activePublications = await this.publicationRepo
      .createQueryBuilder('publication')
      .innerJoin(
        VersionProduitEntity,
        'version',
        'version.id = publication.version_produit_id AND version.produit_id = :productId',
        { productId },
      )
      .where('publication.start_at <= :now', { now })
      .andWhere('(publication.end_at IS NULL OR publication.end_at >= :now)', { now })
      .getCount();

    return {
      locked: activePublications > 0,
      activePublications,
    };
  }

  async validatePublicationReadiness(
    versionId: string,
    companyId: string,
  ): Promise<{ ready: boolean; checks: Array<{ name: string; passed: boolean; message?: string }> }> {
    const version = await this.versionRepo.findOne({ where: { id: versionId } });
    if (!version) {
      throw new RpcException({
        code: status.NOT_FOUND,
        message: `Version ${versionId} not found`,
      });
    }

    const produit = await this.produitRepo.findOne({ where: { id: version.produitId } });
    if (!produit) {
      throw new RpcException({
        code: status.NOT_FOUND,
        message: `Produit ${version.produitId} not found`,
      });
    }

    const publications = await this.publicationRepo.find({
      where: { versionProduitId: versionId },
    });
    const channels = publications.flatMap((publication) => publication.channels || []);

    const checks: PublicationCheck[] = [];
    const documentCheck = await this.validateDocumentCompleteness(versionId, channels);

    checks.push({
      name: 'dipa_present_if_web',
      passed: !documentCheck.missing.includes('dipa'),
      message: documentCheck.missing.includes('dipa')
        ? 'DIPA document is required for web channel publication'
        : undefined,
    });

    checks.push({
      name: 'cg_present_if_web',
      passed: !documentCheck.missing.includes('cg'),
      message: documentCheck.missing.includes('cg') ? 'CG document is required for web channel publication' : undefined,
    });

    const pricingRules = await this.pricingRuleRepo.find({
      where: { productVersionId: versionId },
    });

    checks.push({
      name: 'pricing_rule_exists',
      passed: pricingRules.length > 0,
      message: pricingRules.length > 0 ? undefined : 'At least one pricing rule must be configured',
    });

    const companyMappings = await this.accountingMappingRepo.find({
      where: {
        productVersionId: versionId,
        companyId,
      },
    });

    const requiresCommissionScheme =
      produit.revenueModel === RevenueModelEnum.COMMISSION || produit.revenueModel === RevenueModelEnum.MIXED;
    const commissionMappings = companyMappings.filter((mapping) => mapping.nature === AccountingNature.COMMISSION);

    checks.push({
      name: 'commission_scheme_exists_if_needed',
      passed: !requiresCommissionScheme || commissionMappings.length > 0,
      message:
        requiresCommissionScheme && commissionMappings.length === 0
          ? 'At least one commission scheme is required for commission or mixed revenue model'
          : undefined,
    });

    checks.push({
      name: 'accounting_mapping_exists',
      passed: companyMappings.length > 0,
      message:
        companyMappings.length > 0 ? undefined : 'At least one accounting mapping must be configured for the company',
    });

    const invalidTaxRates = [Number(produit.tauxTva), ...pricingRules.map((rule) => Number(rule.taxRate))]
      .map((rate) => ({ rate, validation: this.validateTaxRate(rate) }))
      .filter((entry) => !entry.validation.valid)
      .map((entry) => entry.rate);

    checks.push({
      name: 'tva_rates_valid',
      passed: invalidTaxRates.length === 0,
      message: invalidTaxRates.length === 0 ? undefined : `Invalid TVA rates detected: ${invalidTaxRates.join(', ')}`,
    });

    return {
      ready: checks.every((check) => check.passed),
      checks,
    };
  }
}
