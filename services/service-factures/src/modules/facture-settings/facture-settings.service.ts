import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { FactureSettingsEntity, LogoPosition } from './entities/facture-settings.entity';
import type { CreateFactureSettingsRequest } from '@proto/factures/factures';

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
    const existing = await this.repository.findOne({ where: { societeId: input.societeId } });
    if (existing) {
      throw new RpcException({ code: status.ALREADY_EXISTS, message: `Settings for societe ${input.societeId} already exist` });
    }

    const entity = this.repository.create({
      societeId: input.societeId,
      primaryColor: input.primaryColor || '#000000',
      secondaryColor: input.secondaryColor || null,
      companyName: input.companyName || null,
      companyAddress: input.companyAddress || null,
      companyPhone: input.companyPhone || null,
      companyEmail: input.companyEmail || null,
      companySiret: input.companySiret || null,
      companyTvaNumber: input.companyTvaNumber || null,
      companyRcs: input.companyRcs || null,
      companyCapital: input.companyCapital || null,
      iban: input.iban || null,
      bic: input.bic || null,
      bankName: input.bankName || null,
      headerText: input.headerText || null,
      footerText: input.footerText || null,
      legalMentions: input.legalMentions || null,
      paymentTerms: input.paymentTerms || null,
      invoicePrefix: input.invoicePrefix || null,
      showLogo: input.showLogo ?? true,
      logoPosition: input.logoPosition || 'left',
    });
    return this.repository.save(entity);
  }

  async update(input: Partial<CreateSettingsInput> & { id: string }): Promise<FactureSettingsEntity> {
    const entity = await this.findById(input.id);

    if (input.primaryColor !== undefined) entity.primaryColor = input.primaryColor || '#000000';
    if (input.secondaryColor !== undefined) entity.secondaryColor = input.secondaryColor || null;
    if (input.companyName !== undefined) entity.companyName = input.companyName || null;
    if (input.companyAddress !== undefined) entity.companyAddress = input.companyAddress || null;
    if (input.companyPhone !== undefined) entity.companyPhone = input.companyPhone || null;
    if (input.companyEmail !== undefined) entity.companyEmail = input.companyEmail || null;
    if (input.companySiret !== undefined) entity.companySiret = input.companySiret || null;
    if (input.companyTvaNumber !== undefined) entity.companyTvaNumber = input.companyTvaNumber || null;
    if (input.companyRcs !== undefined) entity.companyRcs = input.companyRcs || null;
    if (input.companyCapital !== undefined) entity.companyCapital = input.companyCapital || null;
    if (input.iban !== undefined) entity.iban = input.iban || null;
    if (input.bic !== undefined) entity.bic = input.bic || null;
    if (input.bankName !== undefined) entity.bankName = input.bankName || null;
    if (input.headerText !== undefined) entity.headerText = input.headerText || null;
    if (input.footerText !== undefined) entity.footerText = input.footerText || null;
    if (input.legalMentions !== undefined) entity.legalMentions = input.legalMentions || null;
    if (input.paymentTerms !== undefined) entity.paymentTerms = input.paymentTerms || null;
    if (input.invoicePrefix !== undefined) entity.invoicePrefix = input.invoicePrefix || null;
    if (input.showLogo !== undefined) entity.showLogo = input.showLogo;
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
