import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { InvoicesController } from './invoices.controller';
import { InvoicesService } from './invoices.service';
import { Invoice } from './entities/invoice.entity';
import { InvoiceItem } from './entities/invoice-item.entity';
import { ComplianceModule } from '../compliance/compliance.module';
import { PdfGenerationModule } from '../pdf-generation/pdf-generation.module';
import { InvoiceImmutabilityGuard } from './guards/invoice-immutability.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([Invoice, InvoiceItem]),
    ConfigModule,
    ComplianceModule,
    PdfGenerationModule,
  ],
  controllers: [InvoicesController],
  providers: [InvoicesService, InvoiceImmutabilityGuard],
  exports: [InvoicesService],
})
export class InvoicesModule {}
