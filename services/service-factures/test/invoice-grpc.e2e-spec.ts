import { Test, TestingModule } from '@nestjs/testing';
import { INestMicroservice } from '@nestjs/common';
import { MicroserviceOptions, Transport, ClientGrpc } from '@nestjs/microservices';
import { join } from 'path';
import { AppModule } from '../src/app.module';

describe('Invoice gRPC Service (e2e)', () => {
  let app: INestMicroservice;
  let client: ClientGrpc;
  let invoiceService: any;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    // Créer le microservice gRPC
    app = moduleFixture.createNestMicroservice<MicroserviceOptions>({
      transport: Transport.GRPC,
      options: {
        package: 'invoice',
        protoPath: join(__dirname, '../proto/invoice.proto'),
        url: '0.0.0.0:50052', // Port de test différent
        loader: {
          keepCase: true,
          longs: String,
          enums: String,
          defaults: true,
          oneofs: true,
        },
      },
    });

    await app.listen();

    // Créer le client gRPC pour les tests
    const clientModule = await Test.createTestingModule({
      imports: [],
    }).compile();

    client = clientModule
      .createNestMicroservice<MicroserviceOptions>({
        transport: Transport.GRPC,
        options: {
          package: 'invoice',
          protoPath: join(__dirname, '../proto/invoice.proto'),
          url: '0.0.0.0:50052',
          loader: {
            keepCase: true,
            longs: String,
            enums: String,
            defaults: true,
            oneofs: true,
          },
        },
      })
      .get(ClientGrpc);

    invoiceService = client.getService('InvoiceService');
  });

  afterAll(async () => {
    await app.close();
  });

  describe('CreateInvoice', () => {
    it('should create a new invoice', (done) => {
      const createInvoiceRequest = {
        customerName: 'Test Client SARL',
        customerAddress: '123 Rue Test, 75001 Paris, France',
        customerSiret: '12345678901234',
        customerTvaNumber: 'FR12345678901',
        customerEmail: 'test@example.com',
        issueDate: '2025-01-15',
        deliveryDate: '2025-01-15',
        paymentTermsDays: 30,
        items: [
          {
            description: 'Prestation de test',
            quantity: 10,
            unit: 'heure',
            unitPriceHT: 80.0,
            vatRate: 20.0,
            discount: 0,
          },
        ],
      };

      invoiceService.CreateInvoice(createInvoiceRequest).subscribe({
        next: (invoice) => {
          expect(invoice).toBeDefined();
          expect(invoice.id).toBeDefined();
          expect(invoice.invoiceNumber).toBeDefined();
          expect(invoice.status).toBe('DRAFT');
          expect(invoice.customerName).toBe('Test Client SARL');
          expect(invoice.items).toHaveLength(1);
          expect(parseFloat(invoice.totalHT)).toBe(800.0);
          expect(parseFloat(invoice.totalTVA)).toBe(160.0);
          expect(parseFloat(invoice.totalTTC)).toBe(960.0);
          done();
        },
        error: (err) => {
          done(err);
        },
      });
    });

    it('should fail with invalid data', (done) => {
      const invalidRequest = {
        // customerName manquant
        customerAddress: '123 Rue Test',
        items: [],
      };

      invoiceService.CreateInvoice(invalidRequest).subscribe({
        next: () => {
          done(new Error('Should have thrown an error'));
        },
        error: (err) => {
          expect(err).toBeDefined();
          done();
        },
      });
    });
  });

  describe('FindAllInvoices', () => {
    it('should return a list of invoices', (done) => {
      invoiceService.FindAllInvoices({}).subscribe({
        next: (response) => {
          expect(response).toBeDefined();
          expect(response.invoices).toBeDefined();
          expect(Array.isArray(response.invoices)).toBe(true);
          expect(response.total).toBeGreaterThanOrEqual(0);
          done();
        },
        error: (err) => {
          done(err);
        },
      });
    });
  });

  describe('Invoice Workflow', () => {
    let createdInvoiceId: string;

    it('should create, validate and mark as paid', (done) => {
      // 1. Créer une facture
      const createRequest = {
        customerName: 'Workflow Test Client',
        customerAddress: '456 Avenue Test, 75002 Paris',
        issueDate: '2025-01-20',
        deliveryDate: '2025-01-20',
        items: [
          {
            description: 'Service de test',
            quantity: 5,
            unitPriceHT: 100.0,
            vatRate: 20.0,
          },
        ],
      };

      invoiceService.CreateInvoice(createRequest).subscribe({
        next: (invoice) => {
          createdInvoiceId = invoice.id;
          expect(invoice.status).toBe('DRAFT');

          // 2. Valider la facture
          invoiceService.ValidateInvoice({ id: createdInvoiceId }).subscribe({
            next: (validatedInvoice) => {
              expect(validatedInvoice.status).toBe('VALIDATED');
              expect(validatedInvoice.pdfPath).toBeDefined();
              expect(validatedInvoice.pdfHash).toBeDefined();
              expect(validatedInvoice.validatedAt).toBeDefined();

              // 3. Marquer comme payée
              invoiceService
                .MarkInvoiceAsPaid({ id: createdInvoiceId })
                .subscribe({
                  next: (paidInvoice) => {
                    expect(paidInvoice.status).toBe('PAID');
                    expect(paidInvoice.paidAt).toBeDefined();
                    done();
                  },
                  error: (err) => done(err),
                });
            },
            error: (err) => done(err),
          });
        },
        error: (err) => done(err),
      });
    });
  });

  describe('Invoice Immutability', () => {
    it('should not allow modification of validated invoice', (done) => {
      // 1. Créer et valider une facture
      const createRequest = {
        customerName: 'Immutability Test',
        customerAddress: '789 Boulevard Test',
        issueDate: '2025-01-25',
        deliveryDate: '2025-01-25',
        items: [
          {
            description: 'Test immutability',
            quantity: 1,
            unitPriceHT: 500.0,
            vatRate: 20.0,
          },
        ],
      };

      invoiceService.CreateInvoice(createRequest).subscribe({
        next: (invoice) => {
          const invoiceId = invoice.id;

          // Valider la facture
          invoiceService.ValidateInvoice({ id: invoiceId }).subscribe({
            next: () => {
              // Tenter de modifier la facture validée
              invoiceService
                .UpdateInvoice({
                  id: invoiceId,
                  customerName: 'Modified Name',
                })
                .subscribe({
                  next: () => {
                    done(new Error('Should not allow update of validated invoice'));
                  },
                  error: (err) => {
                    expect(err).toBeDefined();
                    expect(err.message).toContain('immutable');
                    done();
                  },
                });
            },
            error: (err) => done(err),
          });
        },
        error: (err) => done(err),
      });
    });
  });

  describe('CreateCreditNote', () => {
    it('should create a credit note for validated invoice', (done) => {
      // 1. Créer et valider une facture
      const createRequest = {
        customerName: 'Credit Note Test',
        customerAddress: '999 Rue Test',
        issueDate: '2025-01-30',
        deliveryDate: '2025-01-30',
        items: [
          {
            description: 'Service à rembourser',
            quantity: 3,
            unitPriceHT: 150.0,
            vatRate: 20.0,
          },
        ],
      };

      invoiceService.CreateInvoice(createRequest).subscribe({
        next: (invoice) => {
          const invoiceId = invoice.id;

          // Valider la facture
          invoiceService.ValidateInvoice({ id: invoiceId }).subscribe({
            next: () => {
              // Créer un avoir
              invoiceService.CreateCreditNote({ id: invoiceId }).subscribe({
                next: (creditNote) => {
                  expect(creditNote).toBeDefined();
                  expect(creditNote.status).toBe('CREDIT_NOTE');
                  expect(creditNote.originalInvoiceId).toBe(invoiceId);
                  // Les montants doivent être négatifs
                  expect(parseFloat(creditNote.totalHT)).toBeLessThan(0);
                  expect(parseFloat(creditNote.totalTTC)).toBeLessThan(0);
                  done();
                },
                error: (err) => done(err),
              });
            },
            error: (err) => done(err),
          });
        },
        error: (err) => done(err),
      });
    });
  });

  describe('DownloadInvoicePdf', () => {
    it('should download PDF for validated invoice', (done) => {
      // 1. Créer et valider une facture
      const createRequest = {
        customerName: 'PDF Test',
        customerAddress: '111 Avenue PDF',
        issueDate: '2025-02-01',
        deliveryDate: '2025-02-01',
        items: [
          {
            description: 'Service PDF',
            quantity: 1,
            unitPriceHT: 1000.0,
            vatRate: 20.0,
          },
        ],
      };

      invoiceService.CreateInvoice(createRequest).subscribe({
        next: (invoice) => {
          const invoiceId = invoice.id;

          // Valider la facture
          invoiceService.ValidateInvoice({ id: invoiceId }).subscribe({
            next: () => {
              // Télécharger le PDF
              invoiceService.DownloadInvoicePdf({ id: invoiceId }).subscribe({
                next: (pdfResponse) => {
                  expect(pdfResponse).toBeDefined();
                  expect(pdfResponse.pdfData).toBeDefined();
                  expect(pdfResponse.fileName).toBeDefined();
                  expect(pdfResponse.fileName).toContain('.pdf');
                  expect(pdfResponse.invoiceNumber).toBeDefined();
                  // Vérifier que les données PDF ne sont pas vides
                  expect(pdfResponse.pdfData.length).toBeGreaterThan(0);
                  done();
                },
                error: (err) => done(err),
              });
            },
            error: (err) => done(err),
          });
        },
        error: (err) => done(err),
      });
    });

    it('should fail to download PDF for non-validated invoice', (done) => {
      const createRequest = {
        customerName: 'No PDF Test',
        customerAddress: '222 Avenue',
        issueDate: '2025-02-05',
        deliveryDate: '2025-02-05',
        items: [
          {
            description: 'Service',
            quantity: 1,
            unitPriceHT: 100.0,
            vatRate: 20.0,
          },
        ],
      };

      invoiceService.CreateInvoice(createRequest).subscribe({
        next: (invoice) => {
          // Tenter de télécharger le PDF sans valider
          invoiceService.DownloadInvoicePdf({ id: invoice.id }).subscribe({
            next: () => {
              done(new Error('Should not download PDF for draft invoice'));
            },
            error: (err) => {
              expect(err).toBeDefined();
              done();
            },
          });
        },
        error: (err) => done(err),
      });
    });
  });
});
