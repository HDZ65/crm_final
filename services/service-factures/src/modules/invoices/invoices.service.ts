import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Invoice } from './entities/invoice.entity';
import { InvoiceItem } from './entities/invoice-item.entity';
import { InvoiceStatus, IMMUTABLE_STATUSES } from './entities/invoice-status.enum';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { LegalMentionsService } from '../compliance/services/legal-mentions.service';
import { FacturXService } from '../pdf-generation/services/facturx.service';
import { InvoiceLockedError } from '../../common/exceptions/invoice-locked.exception';
import { CompanyBranding } from '../../common/interfaces/company-branding.interface';
import dayjs from 'dayjs';

@Injectable()
export class InvoicesService {
  constructor(
    @InjectRepository(Invoice)
    private readonly invoiceRepository: Repository<Invoice>,
    @InjectRepository(InvoiceItem)
    private readonly invoiceItemRepository: Repository<InvoiceItem>,
    private readonly legalMentionsService: LegalMentionsService,
    private readonly facturXService: FacturXService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Crée une nouvelle facture
   */
  async create(createInvoiceDto: CreateInvoiceDto): Promise<Invoice> {
    console.log('[InvoicesService.create] Input:', JSON.stringify(createInvoiceDto, null, 2));

    try {
      // 1. Créer l'entité Invoice
      const invoiceNumber = await this.generateInvoiceNumber();
      console.log('[InvoicesService.create] Generated invoice number:', invoiceNumber);

      const invoice = this.invoiceRepository.create({
        ...createInvoiceDto,
        status: InvoiceStatus.DRAFT,
        invoiceNumber,
      });

    // 2. Calculer la date d'échéance si non fournie
    if (!invoice.dueDate) {
      invoice.dueDate = dayjs(invoice.issueDate)
        .add(invoice.paymentTermsDays || 30, 'days')
        .toDate();
    }

    // 3. Créer les lignes de facture
    invoice.items = createInvoiceDto.items.map((itemDto, index) => {
      const item = this.invoiceItemRepository.create({
        ...itemDto,
        lineNumber: index + 1,
      });

      // Calculer les montants
      item.totalHT = Number(
        (item.quantity * item.unitPriceHT - (item.discount || 0)).toFixed(2),
      );
      item.totalTVA = Number((item.totalHT * (item.vatRate / 100)).toFixed(2));
      item.totalTTC = Number((item.totalHT + item.totalTVA).toFixed(2));

      return item;
    });

    // 4. Calculer les totaux globaux
    this.calculateTotals(invoice);

    // 5. Valider la conformité légale
    console.log('[InvoicesService.create] Validating compliance...');
    const validation =
      this.legalMentionsService.validateInvoiceCompliance(invoice);
    console.log('[InvoicesService.create] Validation result:', JSON.stringify(validation, null, 2));

    if (!validation.isValid) {
      throw new BadRequestException({
        message: 'Facture non conforme',
        errors: validation.errors,
        warnings: validation.warnings,
      });
    }

    // 6. Sauvegarder
    console.log('[InvoicesService.create] Saving invoice...');
    const saved = await this.invoiceRepository.save(invoice);
    console.log('[InvoicesService.create] Invoice saved:', saved.id);
    return saved;
    } catch (error) {
      console.error('[InvoicesService.create] ERROR:', error);
      throw error;
    }
  }

  /**
   * Liste toutes les factures
   */
  async findAll(): Promise<Invoice[]> {
    return await this.invoiceRepository.find({
      relations: ['items'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Récupère une facture par ID
   */
  async findOne(id: string): Promise<Invoice> {
    const invoice = await this.invoiceRepository.findOne({
      where: { id },
      relations: ['items'],
    });

    if (!invoice) {
      throw new NotFoundException(`Facture avec l'ID "${id}" introuvable`);
    }

    return invoice;
  }

  /**
   * Met à jour une facture (uniquement si status = DRAFT)
   */
  async update(
    id: string,
    updateInvoiceDto: UpdateInvoiceDto,
  ): Promise<Invoice> {
    const invoice = await this.findOne(id);

    // Vérifier si la facture est modifiable
    if (IMMUTABLE_STATUSES.includes(invoice.status)) {
      throw new InvoiceLockedError(invoice.invoiceNumber, invoice.status);
    }

    // Mise à jour des champs
    Object.assign(invoice, updateInvoiceDto);

    // Recalculer les montants si les items ont changé
    if (updateInvoiceDto.items) {
      invoice.items = updateInvoiceDto.items.map((itemDto, index) => {
        const item = this.invoiceItemRepository.create({
          ...itemDto,
          lineNumber: index + 1,
        });

        item.totalHT = Number(
          (item.quantity * item.unitPriceHT - (item.discount || 0)).toFixed(2),
        );
        item.totalTVA = Number(
          (item.totalHT * (item.vatRate / 100)).toFixed(2),
        );
        item.totalTTC = Number((item.totalHT + item.totalTVA).toFixed(2));

        return item;
      });

      this.calculateTotals(invoice);
    }

    // Valider la conformité
    const validation =
      this.legalMentionsService.validateInvoiceCompliance(invoice);
    if (!validation.isValid) {
      throw new BadRequestException({
        message: 'Facture non conforme',
        errors: validation.errors,
      });
    }

    return await this.invoiceRepository.save(invoice);
  }

  /**
   * Supprime une facture (uniquement si status = DRAFT)
   */
  async remove(id: string): Promise<void> {
    const invoice = await this.findOne(id);

    if (IMMUTABLE_STATUSES.includes(invoice.status)) {
      throw new InvoiceLockedError(invoice.invoiceNumber, invoice.status);
    }

    await this.invoiceRepository.remove(invoice);
  }

  /**
   * Valide une facture et génère le PDF Factur-X
   * Une fois validée, la facture devient IMMUTABLE
   * @param branding - Branding personnalisé de la société (optionnel)
   */
  async validate(id: string, branding?: CompanyBranding): Promise<Invoice> {
    const invoice = await this.findOne(id);

    if (invoice.status !== InvoiceStatus.DRAFT) {
      throw new BadRequestException(
        `Impossible de valider: la facture a déjà le statut "${invoice.status}"`,
      );
    }

    // Valider la conformité légale
    const validation =
      this.legalMentionsService.validateInvoiceCompliance(invoice);
    if (!validation.isValid) {
      throw new BadRequestException({
        message: 'Facture non conforme - validation impossible',
        errors: validation.errors,
        warnings: validation.warnings,
      });
    }

    // Générer le PDF Factur-X avec branding personnalisé
    const { pdfPath, pdfHash } =
      await this.facturXService.generateFacturXInvoice(invoice, branding);

    // Mettre à jour le statut
    invoice.status = InvoiceStatus.VALIDATED;
    invoice.validatedAt = new Date();
    invoice.pdfPath = pdfPath;
    invoice.pdfHash = pdfHash;

    return await this.invoiceRepository.save(invoice);
  }

  /**
   * Marque une facture comme payée
   */
  async markAsPaid(id: string): Promise<Invoice> {
    const invoice = await this.findOne(id);

    if (invoice.status !== InvoiceStatus.VALIDATED) {
      throw new BadRequestException(
        'Seule une facture validée peut être marquée comme payée',
      );
    }

    invoice.status = InvoiceStatus.PAID;
    invoice.paidAt = new Date();

    return await this.invoiceRepository.save(invoice);
  }

  /**
   * Crée un avoir (credit note) pour une facture existante
   */
  async createCreditNote(originalInvoiceId: string): Promise<Invoice> {
    const originalInvoice = await this.findOne(originalInvoiceId);

    if (
      originalInvoice.status !== InvoiceStatus.VALIDATED &&
      originalInvoice.status !== InvoiceStatus.PAID
    ) {
      throw new BadRequestException(
        'Un avoir ne peut être créé que pour une facture validée ou payée',
      );
    }

    // Créer un avoir en inversant les montants
    const newInvoiceNumber = await this.generateInvoiceNumber('AV');

    const creditNote = this.invoiceRepository.create({
      customerName: originalInvoice.customerName,
      customerAddress: originalInvoice.customerAddress,
      customerSiret: originalInvoice.customerSiret,
      customerTvaNumber: originalInvoice.customerTvaNumber,
      customerEmail: originalInvoice.customerEmail,
      customerPhone: originalInvoice.customerPhone,
      issueDate: new Date(),
      deliveryDate: originalInvoice.deliveryDate,
      dueDate: originalInvoice.dueDate,
      invoiceNumber: newInvoiceNumber,
      status: InvoiceStatus.CREDIT_NOTE,
      originalInvoiceId: originalInvoice.id,
      totalHT: -originalInvoice.totalHT,
      totalTVA: -originalInvoice.totalTVA,
      totalTTC: -originalInvoice.totalTTC,
      paymentTermsDays: originalInvoice.paymentTermsDays,
      latePaymentInterestRate: originalInvoice.latePaymentInterestRate,
      recoveryIndemnity: originalInvoice.recoveryIndemnity,
      vatMention: originalInvoice.vatMention,
      notes: `Avoir pour facture ${originalInvoice.invoiceNumber}`,
    });

    // Créer les lignes avec montants inversés
    creditNote.items = originalInvoice.items.map((item, index) =>
      this.invoiceItemRepository.create({
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        unitPriceHT: item.unitPriceHT,
        vatRate: item.vatRate,
        discount: item.discount,
        lineNumber: index + 1,
        totalHT: -item.totalHT,
        totalTVA: -item.totalTVA,
        totalTTC: -item.totalTTC,
      }),
    );

    return await this.invoiceRepository.save(creditNote);
  }

  /**
   * Génère un numéro de facture séquentiel unique
   * Format: {PREFIX}{YEAR}{SEQUENCE}
   * Exemple: INV2025001, INV2025002, AV2025001
   */
  private async generateInvoiceNumber(prefix?: string): Promise<string> {
    const invoicePrefix =
      prefix || this.configService.get<string>('INVOICE_PREFIX') || 'INV';
    const currentYear = new Date().getFullYear();
    const yearReset =
      this.configService.get<boolean>('INVOICE_YEAR_RESET') !== false;

    const patternPrefix = yearReset ? `${invoicePrefix}${currentYear}` : invoicePrefix;

    // Récupérer la dernière facture avec ce préfixe (tri numérique correct)
    const lastInvoice = await this.invoiceRepository
      .createQueryBuilder('invoice')
      .where('invoice.invoiceNumber LIKE :pattern', {
        pattern: `${patternPrefix}%`,
      })
      .orderBy('LENGTH(invoice.invoiceNumber)', 'DESC')
      .addOrderBy('invoice.invoiceNumber', 'DESC')
      .getOne();

    let sequence = 1;

    if (lastInvoice) {
      // Extraire le numéro de séquence (les chiffres à la fin après le préfixe)
      const sequencePart = lastInvoice.invoiceNumber.slice(patternPrefix.length);
      const sequenceNum = parseInt(sequencePart, 10);
      if (!isNaN(sequenceNum)) {
        sequence = sequenceNum + 1;
      }
    }

    // Formater avec padding (ex: 001, 002, etc.)
    const sequenceStr = sequence.toString().padStart(3, '0');
    const newInvoiceNumber = `${patternPrefix}${sequenceStr}`;

    // Vérifier que ce numéro n'existe pas déjà (protection contre les collisions)
    const existing = await this.invoiceRepository.findOne({
      where: { invoiceNumber: newInvoiceNumber },
    });

    if (existing) {
      // Si collision, trouver le prochain numéro disponible
      console.warn(`[InvoicesService] Collision detected for ${newInvoiceNumber}, finding next available...`);
      const allWithPrefix = await this.invoiceRepository
        .createQueryBuilder('invoice')
        .where('invoice.invoiceNumber LIKE :pattern', { pattern: `${patternPrefix}%` })
        .select('invoice.invoiceNumber')
        .getMany();

      // Trouver le max
      let maxSeq = 0;
      for (const inv of allWithPrefix) {
        const seqPart = inv.invoiceNumber.slice(patternPrefix.length);
        const seqNum = parseInt(seqPart, 10);
        if (!isNaN(seqNum) && seqNum > maxSeq) {
          maxSeq = seqNum;
        }
      }

      const nextSeq = (maxSeq + 1).toString().padStart(3, '0');
      return `${patternPrefix}${nextSeq}`;
    }

    return newInvoiceNumber;
  }

  /**
   * Calcule les totaux globaux de la facture
   */
  private calculateTotals(invoice: Invoice): void {
    invoice.totalHT = Number(
      invoice.items.reduce((sum, item) => sum + Number(item.totalHT), 0).toFixed(2),
    );
    invoice.totalTVA = Number(
      invoice.items.reduce((sum, item) => sum + Number(item.totalTVA), 0).toFixed(2),
    );
    invoice.totalTTC = Number(
      invoice.items.reduce((sum, item) => sum + Number(item.totalTTC), 0).toFixed(2),
    );
  }
}
