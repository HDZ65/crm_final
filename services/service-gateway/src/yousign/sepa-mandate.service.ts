import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { YousignApiClient } from './yousign-api.client';
import { NatsPublisherService } from '../nats/nats-publisher.service';

// --------------------------------------------------------------------------
// SEPA Mandate Types
// --------------------------------------------------------------------------

export interface InitiateSepaMandateParams {
  contratId: string;
  clientName: string;
  iban: string;
  bic: string;
  organisationId: string;
}

export interface SepaMandateResult {
  signatureRequestId: string;
  status: string;
  signerLink: string | undefined;
}

export interface SepaMandateStatus {
  contratId: string;
  signatureRequestId: string;
  status: string;
  signers: Array<{
    email: string;
    status: string;
  }>;
}

// --------------------------------------------------------------------------
// NATS subject
// --------------------------------------------------------------------------

const NATS_SEPA_MANDATE_INITIATED = 'crm.document.sepa_mandate.initiated';
const NATS_DOCUMENT_SIGNED = 'crm.document.signed';

@Injectable()
export class SepaMandateService {
  private readonly logger = new Logger(SepaMandateService.name);

  constructor(
    private readonly yousignClient: YousignApiClient,
    private readonly natsPublisher: NatsPublisherService,
  ) {}

  // --------------------------------------------------------------------------
  // Initiate SEPA Mandate Signature
  // --------------------------------------------------------------------------

  async initiateSepaMandate(params: InitiateSepaMandateParams): Promise<SepaMandateResult> {
    const { contratId, clientName, iban, bic, organisationId } = params;

    this.logger.log(
      `Initiating SEPA mandate signature for contrat ${contratId} (organisation ${organisationId})`,
    );

    // 1. Create signature request in Yousign
    const signatureRequest = await this.yousignClient.createSignatureRequest({
      name: `Mandat SEPA — ${clientName} — ${contratId}`,
      delivery_mode: 'email',
      external_id: contratId,
      ordered_signers: false,
      signers: [
        {
          info: {
            first_name: this.extractFirstName(clientName),
            last_name: this.extractLastName(clientName),
            email: '', // Will be set by the caller or Yousign configuration
            locale: 'fr',
          },
          signature_level: 'electronic_signature',
          signature_authentication_mode: 'otp_email',
        },
      ],
    });

    // 2. Generate and upload SEPA mandate document
    const mandateBuffer = this.generateSepaMandateHtml(clientName, iban, bic, contratId);

    await this.yousignClient.uploadDocument(signatureRequest.id, {
      file: mandateBuffer,
      filename: `mandat-sepa-${contratId}.pdf`,
      nature: 'signable_document',
    });

    // 3. Activate the signature request (send to signers)
    const activated = await this.yousignClient.activateSignatureRequest(
      signatureRequest.id,
    );

    // 4. Publish NATS event
    await this.natsPublisher.publish(NATS_SEPA_MANDATE_INITIATED, {
      contrat_id: contratId,
      organisation_id: organisationId,
      signature_request_id: signatureRequest.id,
      timestamp: new Date().toISOString(),
    });

    this.logger.log(
      `SEPA mandate signature request ${signatureRequest.id} activated for contrat ${contratId}`,
    );

    // Find signer link from response
    const signerLink = activated.signers?.[0]?.signature_link;

    return {
      signatureRequestId: signatureRequest.id,
      status: activated.status,
      signerLink,
    };
  }

  // --------------------------------------------------------------------------
  // Handle SEPA Mandate Signed (called from webhook)
  // --------------------------------------------------------------------------

  async handleSepaMandateSigned(signatureRequestId: string): Promise<void> {
    this.logger.log(
      `Handling SEPA mandate signed for signature_request ${signatureRequestId}`,
    );

    // 1. Get the signature request details
    const sigReq = await this.yousignClient.getSignatureRequest(signatureRequestId);

    if (!sigReq.documents.length) {
      throw new NotFoundException(
        `No documents found for signature request ${signatureRequestId}`,
      );
    }

    // 2. Download the signed document
    const signedDoc = sigReq.documents[0];
    const signedBuffer = await this.yousignClient.downloadSignedDocument(
      signatureRequestId,
      signedDoc.id,
    );

    this.logger.log(
      `Downloaded signed SEPA mandate (${signedBuffer.length} bytes) for signature_request ${signatureRequestId}`,
    );

    // 3. Publish NATS event with signed info
    const completedSigner = sigReq.signers.find((s) => s.status === 'signed');

    await this.natsPublisher.publish(NATS_DOCUMENT_SIGNED, {
      signature_request_id: signatureRequestId,
      document_id: signedDoc.id,
      contrat_id: sigReq.external_id ?? '',
      organisation_id: '',
      signer_email: completedSigner?.info.email ?? '',
      signed_at: new Date().toISOString(),
      timestamp: new Date().toISOString(),
    });

    this.logger.log(
      `Published document.signed for SEPA mandate ${signatureRequestId}`,
    );
  }

  // --------------------------------------------------------------------------
  // Get SEPA Mandate Status
  // --------------------------------------------------------------------------

  async getSepaMandateStatus(contratId: string): Promise<SepaMandateStatus> {
    // Use external_id (contratId) to fetch — but Yousign V3 doesn't support
    // direct lookup by external_id. The caller must store the signatureRequestId.
    // For now, we require the signatureRequestId to be passed as contratId
    // (this will be improved when we add a mapping layer).
    const sigReq = await this.yousignClient.getSignatureRequest(contratId);

    return {
      contratId: sigReq.external_id ?? contratId,
      signatureRequestId: sigReq.id,
      status: sigReq.status,
      signers: sigReq.signers.map((s) => ({
        email: s.info.email,
        status: s.status,
      })),
    };
  }

  // --------------------------------------------------------------------------
  // Private Helpers
  // --------------------------------------------------------------------------

  /** Generate a simple HTML SEPA mandate template as a Buffer */
  private generateSepaMandateHtml(
    clientName: string,
    iban: string,
    bic: string,
    contratId: string,
  ): Buffer {
    // Mask IBAN for security (show first 4 and last 4)
    const maskedIban =
      iban.length > 8
        ? `${iban.slice(0, 4)}${'*'.repeat(iban.length - 8)}${iban.slice(-4)}`
        : iban;

    const html = `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><title>Mandat SEPA</title></head>
<body style="font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto;">
  <h1 style="text-align: center; color: #333;">MANDAT DE PRELEVEMENT SEPA</h1>
  <hr />
  <p><strong>Reference du mandat :</strong> ${contratId}</p>
  <p><strong>Date :</strong> ${new Date().toLocaleDateString('fr-FR')}</p>
  <h2>Debiteur</h2>
  <p><strong>Nom :</strong> ${clientName}</p>
  <p><strong>IBAN :</strong> ${maskedIban}</p>
  <p><strong>BIC :</strong> ${bic}</p>
  <h2>Autorisation</h2>
  <p>En signant ce formulaire de mandat, vous autorisez le creancier a envoyer des instructions
  a votre banque pour debiter votre compte, et votre banque a debiter votre compte conformement
  aux instructions du creancier.</p>
  <p>Vous beneficiez du droit d'etre rembourse par votre banque selon les conditions decrites
  dans la convention que vous avez passee avec elle.</p>
  <br />
  <p><strong>Signature :</strong></p>
  <br /><br />
  <hr />
  <p style="font-size: 0.8em; color: #666;">Document genere automatiquement — Contrat ${contratId}</p>
</body>
</html>`.trim();

    return Buffer.from(html, 'utf-8');
  }

  private extractFirstName(fullName: string): string {
    const parts = fullName.trim().split(/\s+/);
    return parts[0] ?? fullName;
  }

  private extractLastName(fullName: string): string {
    const parts = fullName.trim().split(/\s+/);
    return parts.length > 1 ? parts.slice(1).join(' ') : fullName;
  }
}
