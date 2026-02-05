import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { FactureSettingsEntity, LogoPosition } from './entities/facture-settings.entity';
import type { CreateFactureSettingsRequest } from '@crm/proto/factures';

export type CreateSettingsInput = Omit<CreateFactureSettingsRequest, 'logoPosition'> & {
  logoPosition?: LogoPosition;
};

@Injectable()
export class FactureSettingsService {
  private readonly logger = new Logger(FactureSettingsService.name);

  constructor(
    @InjectRepository(FactureSettingsEntity)
    private readonly repository: Repository<FactureSettingsEntity>,
  ) {}

  async create(input: CreateSettingsInput): Promise<FactureSettingsEntity> {
    const existing = await this.repository.findOne({ where: { societeId: input.societe_id } });
    if (existing) {
      throw new RpcException({ code: status.ALREADY_EXISTS, message: `Settings for societe ${input.societe_id} already exist` });
    }

    const entity = this.repository.create({
      societeId: input.societe_id,
      primaryColor: input.primary_color || '#000000',
      secondaryColor: input.secondary_color || null,
      companyName: input.company_name || null,
      companyAddress: input.company_address || null,
      companyPhone: input.company_phone || null,
      companyEmail: input.company_email || null,
      companySiret: input.company_siret || null,
      companyTvaNumber: input.company_tva_number || null,
      companyRcs: input.company_rcs || null,
      companyCapital: input.company_capital || null,
      iban: input.iban || null,
      bic: input.bic || null,
      bankName: input.bank_name || null,
      headerText: input.header_text || null,
      footerText: input.footer_text || null,
      legalMentions: input.legal_mentions || null,
      paymentTerms: input.payment_terms || null,
      invoicePrefix: input.invoice_prefix || null,
      showLogo: input.show_logo ?? true,
      logoPosition: input.logoPosition || 'left',
    });
    return this.repository.save(entity);
  }

  async update(input: Partial<CreateSettingsInput> & { id: string }): Promise<FactureSettingsEntity> {
    const entity = await this.findById(input.id);

    if (input.primary_color !== undefined) entity.primaryColor = input.primary_color || '#000000';
    if (input.secondary_color !== undefined) entity.secondaryColor = input.secondary_color || null;
    if (input.company_name !== undefined) entity.companyName = input.company_name || null;
    if (input.company_address !== undefined) entity.companyAddress = input.company_address || null;
    if (input.company_phone !== undefined) entity.companyPhone = input.company_phone || null;
    if (input.company_email !== undefined) entity.companyEmail = input.company_email || null;
    if (input.company_siret !== undefined) entity.companySiret = input.company_siret || null;
    if (input.company_tva_number !== undefined) entity.companyTvaNumber = input.company_tva_number || null;
    if (input.company_rcs !== undefined) entity.companyRcs = input.company_rcs || null;
    if (input.company_capital !== undefined) entity.companyCapital = input.company_capital || null;
    if (input.iban !== undefined) entity.iban = input.iban || null;
    if (input.bic !== undefined) entity.bic = input.bic || null;
    if (input.bank_name !== undefined) entity.bankName = input.bank_name || null;
    if (input.header_text !== undefined) entity.headerText = input.header_text || null;
    if (input.footer_text !== undefined) entity.footerText = input.footer_text || null;
    if (input.legal_mentions !== undefined) entity.legalMentions = input.legal_mentions || null;
    if (input.payment_terms !== undefined) entity.paymentTerms = input.payment_terms || null;
    if (input.invoice_prefix !== undefined) entity.invoicePrefix = input.invoice_prefix || null;
    if (input.show_logo !== undefined) entity.showLogo = input.show_logo;
    if (input.logoPosition !== undefined) entity.logoPosition = input.logoPosition || 'left';

    return this.repository.save(entity);
  }

  async findById(id: string): Promise<FactureSettingsEntity> {
    const entity = await this.repository.findOne({ where: { id } });
    if (!entity) {
      throw new RpcException({ code: status.NOT_FOUND, message: `Facture settings ${id} not found` });
    }
    return entity;
  }

  async findBySociete(societeId: string): Promise<FactureSettingsEntity> {
    const entity = await this.repository.findOne({ where: { societeId } });
    if (!entity) {
      throw new RpcException({ code: status.NOT_FOUND, message: `Facture settings for societe ${societeId} not found` });
    }
    return entity;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }

  async uploadLogo(id: string, logoBase64: string, logoMimeType: string): Promise<FactureSettingsEntity> {
    const entity = await this.findById(id);
    entity.logoBase64 = logoBase64;
    entity.logoMimeType = logoMimeType;
    return this.repository.save(entity);
  }
}
