import {
  Injectable,
  CanActivate,
  ExecutionContext,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invoice } from '../entities/invoice.entity';
import { InvoiceStatus, IMMUTABLE_STATUSES } from '../entities/invoice-status.enum';
import { InvoiceLockedError } from '../../../common/exceptions/invoice-locked.exception';

/**
 * Guard NestJS pour protéger les factures validées contre toute modification
 *
 * Usage:
 * @UseGuards(InvoiceImmutabilityGuard)
 * async updateInvoice(@Param('id') id: string, @Body() dto: UpdateInvoiceDto)
 *
 * Bloque automatiquement toute tentative de modification (UPDATE/DELETE)
 * sur une facture ayant un statut IMMUTABLE (VALIDATED, PAID, CANCELLED, CREDIT_NOTE)
 */
@Injectable()
export class InvoiceImmutabilityGuard implements CanActivate {
  constructor(
    @InjectRepository(Invoice)
    private readonly invoiceRepository: Repository<Invoice>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const invoiceId = request.params.id;

    if (!invoiceId) {
      // Pas d'ID = création de nouvelle facture = autorisé
      return true;
    }

    // Récupérer la facture depuis la DB
    const invoice = await this.invoiceRepository.findOne({
      where: { id: invoiceId },
    });

    if (!invoice) {
      throw new NotFoundException(
        `Facture avec l'ID "${invoiceId}" introuvable`,
      );
    }

    // Vérifier si la facture est dans un statut IMMUTABLE
    if (IMMUTABLE_STATUSES.includes(invoice.status)) {
      throw new InvoiceLockedError(
        invoice.invoiceNumber,
        invoice.status,
        `Impossible de modifier la facture ${invoice.invoiceNumber}. ` +
          `Une facture avec le statut "${invoice.status}" ne peut plus être modifiée. ` +
          `Pour annuler ou corriger, veuillez créer un avoir (credit note).`,
      );
    }

    // Si status = DRAFT, modification autorisée
    return true;
  }
}
