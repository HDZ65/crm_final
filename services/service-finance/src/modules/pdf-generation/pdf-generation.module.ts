import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { XmlGeneratorService } from './services/xml-generator.service';
import { FacturXService } from './services/facturx.service';
import { ComplianceModule } from '../compliance/compliance.module';

@Module({
  imports: [ConfigModule, ComplianceModule],
  providers: [XmlGeneratorService, FacturXService],
  exports: [FacturXService],
})
export class PdfGenerationModule {}
