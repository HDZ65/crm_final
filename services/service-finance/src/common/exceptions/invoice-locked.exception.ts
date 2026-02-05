import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Exception levée lorsqu'une tentative de modification
 * est faite sur une facture IMMUTABLE (VALIDATED, PAID, etc.)
 *
 * Conformité légale française: Une facture validée ne peut plus être modifiée
 */
export class InvoiceLockedError extends HttpException {
  constructor(
    invoiceNumber: string,
    status: string,
    message?: string,
  ) {
    const defaultMessage =
      message ||
      `La facture ${invoiceNumber} a le statut "${status}" et ne peut plus être modifiée. ` +
        `Seule la création d'un avoir (credit note) est autorisée.`;

    super(
      {
        statusCode: HttpStatus.FORBIDDEN,
        error: 'Invoice Locked',
        message: defaultMessage,
        invoiceNumber,
        currentStatus: status,
        allowedAction: 'Créer un avoir (credit note)',
      },
      HttpStatus.FORBIDDEN,
    );
  }
}
