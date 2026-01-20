import { Module } from '@nestjs/common';
import { InvoiceGrpcClient } from '../../../grpc/invoice.client';
import { InvoiceServiceController } from './invoice-service.controller';
import { FactureSettingsModule } from '../groupe/facture-settings.module';

@Module({
  imports: [FactureSettingsModule],
  controllers: [InvoiceServiceController],
  providers: [InvoiceGrpcClient],
  exports: [InvoiceGrpcClient],
})
export class InvoiceServiceModule {}
