import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { FactureSettingsService } from './facture-settings.service';
import type { LogoPosition } from './entities/facture-settings.entity';

import type {
  CreateFactureSettingsRequest,
  UpdateFactureSettingsRequest,
  GetFactureSettingsRequest,
  GetFactureSettingsBySocieteRequest,
  DeleteFactureSettingsRequest,
  UploadLogoRequest,
} from '@crm/proto/factures';

@Controller()
export class FactureSettingsController {
  constructor(private readonly settingsService: FactureSettingsService) {}

  @GrpcMethod('FactureSettingsService', 'Create')
  async createSettings(data: CreateFactureSettingsRequest) {
    return this.settingsService.create({
      societeId: data.societeId,
      primaryColor: data.primaryColor,
      secondaryColor: data.secondaryColor,
      companyName: data.companyName,
      companyAddress: data.companyAddress,
      companyPhone: data.companyPhone,
      companyEmail: data.companyEmail,
      companySiret: data.companySiret,
      companyTvaNumber: data.companyTvaNumber,
      companyRcs: data.companyRcs,
      companyCapital: data.companyCapital,
      iban: data.iban,
      bic: data.bic,
      bankName: data.bankName,
      headerText: data.headerText,
      footerText: data.footerText,
      legalMentions: data.legalMentions,
      paymentTerms: data.paymentTerms,
      invoicePrefix: data.invoicePrefix,
      showLogo: data.showLogo,
      logoPosition: data.logoPosition as LogoPosition,
    });
  }

  @GrpcMethod('FactureSettingsService', 'Update')
  async updateSettings(data: UpdateFactureSettingsRequest) {
    return this.settingsService.update({
      id: data.id,
      primaryColor: data.primaryColor,
      secondaryColor: data.secondaryColor,
      companyName: data.companyName,
      companyAddress: data.companyAddress,
      companyPhone: data.companyPhone,
      companyEmail: data.companyEmail,
      companySiret: data.companySiret,
      companyTvaNumber: data.companyTvaNumber,
      companyRcs: data.companyRcs,
      companyCapital: data.companyCapital,
      iban: data.iban,
      bic: data.bic,
      bankName: data.bankName,
      headerText: data.headerText,
      footerText: data.footerText,
      legalMentions: data.legalMentions,
      paymentTerms: data.paymentTerms,
      invoicePrefix: data.invoicePrefix,
      showLogo: data.showLogo,
      logoPosition: data.logoPosition as LogoPosition,
    });
  }

  @GrpcMethod('FactureSettingsService', 'Get')
  async getSettings(data: GetFactureSettingsRequest) {
    return this.settingsService.findById(data.id);
  }

  @GrpcMethod('FactureSettingsService', 'GetBySociete')
  async getSettingsBySociete(data: GetFactureSettingsBySocieteRequest) {
    return this.settingsService.findBySociete(data.societeId);
  }

  @GrpcMethod('FactureSettingsService', 'Delete')
  async deleteSettings(data: DeleteFactureSettingsRequest) {
    const success = await this.settingsService.delete(data.id);
    return { success };
  }

  @GrpcMethod('FactureSettingsService', 'UploadLogo')
  async uploadLogo(data: UploadLogoRequest) {
    return this.settingsService.uploadLogo(
      data.settingsId,
      data.logoBase64,
      data.logoMimeType,
    );
  }
}
