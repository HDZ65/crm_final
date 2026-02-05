import { InvoiceEntity } from '../entities/invoice.entity';

export interface IInvoiceRepository {
  findById(id: string): Promise<InvoiceEntity | null>;
  findByInvoiceNumber(invoiceNumber: string): Promise<InvoiceEntity | null>;
  save(entity: InvoiceEntity): Promise<InvoiceEntity>;
  delete(id: string): Promise<void>;
}
