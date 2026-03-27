import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'node:crypto';
import { ContratEntity } from '../entities/contrat.entity';

// ── Types ────────────────────────────────────────────────────────────────────

export interface ExternalContract {
  reference: string;
  statut: string;
  date_debut: string;
  client_id: string;
  commercial_id: string;
  montant?: number;
  devise?: string;
  jour_prelevement?: number;
  titre?: string;
  description?: string;
  type?: string;
  date_fin?: string;
  date_signature?: string;
  frequence_facturation?: string;
  document_url?: string;
  fournisseur?: string;
  societe_id?: string;
  notes?: string;
}

export interface ImportConfig {
  organisationId: string;
  sourceUrl: string;
  apiKey: string;
  dryRun: boolean;
}

export interface ImportErrorItem {
  row: number;
  reference: string;
  errorMessage: string;
}

export interface ImportResult {
  importId: string;
  totalRows: number;
  createdCount: number;
  updatedCount: number;
  skippedCount: number;
  errors: ImportErrorItem[];
}

export interface ImportStatus {
  importId: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  totalRows: number;
  processedRows: number;
  createdCount: number;
  updatedCount: number;
  skippedCount: number;
  errors: ImportErrorItem[];
}

// ── Service ──────────────────────────────────────────────────────────────────

@Injectable()
export class ContratImportService {
  private readonly logger = new Logger(ContratImportService.name);
  private readonly importStatuses = new Map<string, ImportStatus>();

  constructor(
    @InjectRepository(ContratEntity)
    private readonly contratRepository: Repository<ContratEntity>,
  ) {}

  // ── Import from external API ──────────────────────────────────────────────

  async importFromExternal(config: ImportConfig): Promise<ImportResult> {
    const importId = randomUUID();

    this.importStatuses.set(importId, {
      importId,
      status: 'in_progress',
      totalRows: 0,
      processedRows: 0,
      createdCount: 0,
      updatedCount: 0,
      skippedCount: 0,
      errors: [],
    });

    try {
      // 1. Fetch external data
      const externalContracts = await this.fetchExternalContracts(
        config.sourceUrl,
        config.apiKey,
      );

      const status = this.importStatuses.get(importId)!;
      status.totalRows = externalContracts.length;

      let createdCount = 0;
      let updatedCount = 0;
      let skippedCount = 0;
      const errors: ImportErrorItem[] = [];

      // 2. Process each row
      for (let i = 0; i < externalContracts.length; i++) {
        const row = externalContracts[i];
        const rowIndex = i + 1;

        try {
          // Validate required fields
          const validationError = this.validateRow(row);
          if (validationError) {
            errors.push({
              row: rowIndex,
              reference: row.reference || 'UNKNOWN',
              errorMessage: validationError,
            });
            skippedCount++;
            status.processedRows++;
            continue;
          }

          // Validate jour_prelevement if present
          let jourPrelevement: number | undefined;
          if (row.jour_prelevement !== undefined && row.jour_prelevement !== null) {
            const jour = Number(row.jour_prelevement);
            if (isNaN(jour) || jour < 1 || jour > 28) {
              this.logger.warn(
                `Row ${rowIndex}: Invalid jour_prelevement=${row.jour_prelevement}, ignoring field`,
              );
              jourPrelevement = undefined;
            } else {
              jourPrelevement = jour;
            }
          }

          if (config.dryRun) {
            // Dry run: check if exists to determine create vs update
            const existing = await this.findByReference(
              config.organisationId,
              row.reference,
            );
            if (existing) {
              updatedCount++;
            } else {
              createdCount++;
            }
          } else {
            // Real import: upsert
            const result = await this.upsertContrat(
              config.organisationId,
              row,
              jourPrelevement,
            );
            if (result === 'created') {
              createdCount++;
            } else {
              updatedCount++;
            }
          }
        } catch (err) {
          const errorMessage =
            err instanceof Error ? err.message : String(err);
          errors.push({
            row: rowIndex,
            reference: row.reference || 'UNKNOWN',
            errorMessage,
          });
          skippedCount++;
        }

        status.processedRows++;
        status.createdCount = createdCount;
        status.updatedCount = updatedCount;
        status.skippedCount = skippedCount;
        status.errors = errors;
      }

      // 3. Mark complete
      status.status = 'completed';
      status.createdCount = createdCount;
      status.updatedCount = updatedCount;
      status.skippedCount = skippedCount;
      status.errors = errors;

      return {
        importId,
        totalRows: externalContracts.length,
        createdCount,
        updatedCount,
        skippedCount,
        errors,
      };
    } catch (err) {
      const status = this.importStatuses.get(importId);
      if (status) {
        status.status = 'failed';
        status.errors = [
          {
            row: 0,
            reference: '',
            errorMessage:
              err instanceof Error ? err.message : String(err),
          },
        ];
      }

      throw err;
    }
  }

  // ── Get import status ─────────────────────────────────────────────────────

  getImportStatus(importId: string): ImportStatus | null {
    return this.importStatuses.get(importId) ?? null;
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private async fetchExternalContracts(
    sourceUrl: string,
    apiKey: string,
  ): Promise<ExternalContract[]> {
    this.logger.log(`Fetching contracts from external API: ${sourceUrl}`);

    let response: Response;
    try {
      response = await fetch(sourceUrl, {
        method: 'GET',
        headers: {
          'X-API-Key': apiKey,
          Accept: 'application/json',
        },
      });
    } catch (err) {
      throw new Error(
        `Failed to connect to external API: ${err instanceof Error ? err.message : String(err)}`,
      );
    }

    if (response.status === 401 || response.status === 403) {
      throw new Error(
        `External API authentication failed (HTTP ${response.status})`,
      );
    }

    if (response.status === 404) {
      throw new Error('External API endpoint not found (HTTP 404)');
    }

    if (response.status >= 500) {
      // Retry once on server error
      this.logger.warn(
        `External API returned ${response.status}, retrying once...`,
      );
      try {
        response = await fetch(sourceUrl, {
          method: 'GET',
          headers: {
            'X-API-Key': apiKey,
            Accept: 'application/json',
          },
        });
      } catch (err) {
        throw new Error(
          `Retry failed: ${err instanceof Error ? err.message : String(err)}`,
        );
      }

      if (!response.ok) {
        throw new Error(
          `External API server error after retry (HTTP ${response.status})`,
        );
      }
    }

    if (!response.ok) {
      throw new Error(`External API error (HTTP ${response.status})`);
    }

    let data: unknown;
    try {
      data = await response.json();
    } catch {
      throw new Error('External API returned invalid JSON');
    }

    if (!Array.isArray(data)) {
      throw new Error(
        'External API response is not a JSON array of contracts',
      );
    }

    return data as ExternalContract[];
  }

  private validateRow(row: ExternalContract): string | null {
    const missing: string[] = [];
    if (!row.reference) missing.push('reference');
    if (!row.statut) missing.push('statut');
    if (!row.date_debut) missing.push('date_debut');
    if (!row.client_id) missing.push('client_id');
    if (!row.commercial_id) missing.push('commercial_id');

    if (missing.length > 0) {
      return `Missing required fields: ${missing.join(', ')}`;
    }
    return null;
  }

  private async findByReference(
    organisationId: string,
    reference: string,
  ): Promise<ContratEntity | null> {
    return this.contratRepository.findOne({
      where: { organisationId, reference },
    });
  }

  private async upsertContrat(
    organisationId: string,
    row: ExternalContract,
    jourPrelevement?: number,
  ): Promise<'created' | 'updated'> {
    const existing = await this.findByReference(organisationId, row.reference);

    if (existing) {
      // Update existing contract
      existing.statut = row.statut;
      existing.dateDebut = row.date_debut;
      existing.dateFin = row.date_fin ?? existing.dateFin;
      existing.dateSignature = row.date_signature ?? existing.dateSignature;
      existing.clientId = row.client_id;
      existing.commercialId = row.commercial_id;
      existing.montant = row.montant ?? existing.montant;
      existing.devise = row.devise ?? existing.devise;
      existing.titre = row.titre ?? existing.titre;
      existing.description = row.description ?? existing.description;
      existing.type = row.type ?? existing.type;
      existing.frequenceFacturation =
        row.frequence_facturation ?? existing.frequenceFacturation;
      existing.documentUrl = row.document_url ?? existing.documentUrl;
      existing.fournisseur = row.fournisseur ?? existing.fournisseur;
      existing.societeId = row.societe_id ?? existing.societeId;
      existing.notes = row.notes ?? existing.notes;

      await this.contratRepository.save(existing);

      this.logger.debug(
        `Updated contract ${row.reference}${jourPrelevement ? ` (jour_prelevement=${jourPrelevement})` : ''}`,
      );
      return 'updated';
    } else {
      // Create new contract
      const entity = this.contratRepository.create({
        organisationId,
        reference: row.reference,
        statut: row.statut,
        dateDebut: row.date_debut,
        dateFin: row.date_fin ?? null,
        dateSignature: row.date_signature ?? null,
        clientId: row.client_id,
        commercialId: row.commercial_id,
        montant: row.montant ?? null,
        devise: row.devise ?? 'EUR',
        titre: row.titre ?? null,
        description: row.description ?? null,
        type: row.type ?? null,
        frequenceFacturation: row.frequence_facturation ?? null,
        documentUrl: row.document_url ?? null,
        fournisseur: row.fournisseur ?? null,
        societeId: row.societe_id ?? null,
        notes: row.notes ?? null,
      });

      await this.contratRepository.save(entity);

      this.logger.debug(
        `Created contract ${row.reference}${jourPrelevement ? ` (jour_prelevement=${jourPrelevement})` : ''}`,
      );
      return 'created';
    }
  }
}
