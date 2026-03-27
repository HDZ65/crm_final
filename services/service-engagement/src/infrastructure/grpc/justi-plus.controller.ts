import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { CasJuridiqueRepository } from '../persistence/typeorm/repositories/services/cas-juridique.service';
import { JustiPlusService } from '../external/justi-plus/justi-plus.service';
import {
  CasJuridique,
  CasJuridiqueStatut,
  CasJuridiqueType,
} from '../../domain/services/entities/cas-juridique.entity';
import type {
  CasJuridiqueProto,
  SyncCasRequest,
  SyncCasResponse,
  GetCasRequest,
  GetCasResponse,
  ListCasRequest,
  ListCasResponse,
  StatutCas,
  TypeCas,
} from '@proto/justi-plus';
import { randomUUID as uuid } from 'crypto';

@Controller()
export class JustiPlusController {
  private readonly logger = new Logger(JustiPlusController.name);

  constructor(
    private readonly casJuridiqueRepository: CasJuridiqueRepository,
    private readonly justiPlusService: JustiPlusService,
  ) {}

  @GrpcMethod('JustiPlusSvc', 'SyncCas')
  async syncCas(data: SyncCasRequest): Promise<SyncCasResponse> {
    this.logger.log(`SyncCas request for org=${data.organisation_id}`, {
      clientId: data.client_id,
      since: data.since,
      forceFullSync: data.force_full_sync,
    });

    const syncId = uuid();
    let casCrees = 0;
    let casMisAJour = 0;
    let casIgnores = 0;
    let erreurs = 0;
    const errors: { reference_externe: string; message: string; code: string }[] = [];

    try {
      const result = await this.justiPlusService.fetchCases(
        data.organisation_id,
        data.client_id,
        data.since,
      );

      for (const justiCase of result.cases) {
        try {
          const existing = await this.casJuridiqueRepository.findByReference(justiCase.externalId);

          if (existing) {
            // Update existing case
            existing.titre = justiCase.titre;
            existing.description = justiCase.description;
            existing.type = this.mapType(justiCase.type);
            existing.statut = this.mapStatut(justiCase.statut);
            existing.metadata = {
              ...existing.metadata,
              ...justiCase.metadata,
              domaineJuridique: justiCase.domaineJuridique,
              source: 'justi-plus',
              lastSyncedAt: new Date().toISOString(),
            };
            await this.casJuridiqueRepository.save(existing);
            casMisAJour++;
          } else {
            // Create new case
            await this.casJuridiqueRepository.create({
              organisationId: justiCase.organisationId,
              clientId: justiCase.clientId,
              reference: justiCase.externalId,
              titre: justiCase.titre,
              description: justiCase.description,
              type: this.mapType(justiCase.type),
              statut: this.mapStatut(justiCase.statut),
              avocatId: justiCase.avocatAssigne,
              montantEnjeu: justiCase.montantCouvert,
              montantProvision: justiCase.montantFranchise,
              dateOuverture: justiCase.dateOuverture
                ? new Date(justiCase.dateOuverture)
                : new Date(),
              dateCloture: justiCase.dateCloture
                ? new Date(justiCase.dateCloture)
                : undefined,
              metadata: {
                ...justiCase.metadata,
                domaineJuridique: justiCase.domaineJuridique,
                source: 'justi-plus',
                notes: justiCase.notes,
              },
            });
            casCrees++;
          }
        } catch (caseError: any) {
          erreurs++;
          errors.push({
            reference_externe: justiCase.externalId,
            message: caseError.message || 'Unknown error',
            code: 'SYNC_ERROR',
          });
        }
      }
    } catch (error: any) {
      this.logger.error('Failed to sync cases from Justi+', error.stack);
      erreurs++;
      errors.push({
        reference_externe: '',
        message: error.message || 'Failed to fetch from Justi+',
        code: 'FETCH_ERROR',
      });
    }

    return {
      cas_crees: casCrees,
      cas_mis_a_jour: casMisAJour,
      cas_ignores: casIgnores,
      erreurs,
      errors,
      sync_id: syncId,
      synced_at: new Date().toISOString(),
    };
  }

  @GrpcMethod('JustiPlusSvc', 'GetCas')
  async getCas(data: GetCasRequest): Promise<GetCasResponse> {
    const cas = await this.casJuridiqueRepository.findById(data.id);
    return { cas: cas ? this.toProto(cas) : undefined };
  }

  @GrpcMethod('JustiPlusSvc', 'ListCas')
  async listCas(data: ListCasRequest): Promise<ListCasResponse> {
    const result = await this.casJuridiqueRepository.findAll(
      {
        organisationId: data.organisation_id,
        clientId: data.client_id,
        statut: data.statut !== undefined ? this.reverseMapStatut(data.statut) : undefined,
        type: data.type !== undefined ? this.reverseMapType(data.type) : undefined,
        search: data.search,
      },
      data.pagination
        ? { page: data.pagination.page || 1, limit: data.pagination.limit || 20 }
        : undefined,
    );

    return {
      cas: result.data.map((c) => this.toProto(c)),
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        total_pages: result.totalPages,
      },
    };
  }

  // ========== Mapping ==========

  private toProto(entity: CasJuridique): CasJuridiqueProto {
    return {
      id: entity.id,
      organisation_id: entity.organisationId ?? '',
      client_id: entity.clientId ?? '',
      contrat_id: '',
      reference_externe: entity.reference ?? '',
      titre: entity.titre ?? '',
      description: entity.description ?? '',
      type: this.mapTypeToProto(entity.type),
      statut: this.mapStatutToProto(entity.statut),
      domaine_juridique: entity.metadata?.domaineJuridique ?? '',
      avocat_assigne: entity.avocatId ?? '',
      date_ouverture: entity.dateOuverture?.toISOString() ?? '',
      date_cloture: entity.dateCloture?.toISOString() ?? '',
      montant_couvert: entity.montantEnjeu ?? 0,
      montant_franchise: entity.montantProvision ?? 0,
      notes: entity.metadata?.notes ?? '',
      metadata: entity.metadata ? JSON.stringify(entity.metadata) : '',
      synced_at: entity.metadata?.lastSyncedAt ?? '',
      created_at: entity.createdAt?.toISOString() ?? '',
      updated_at: entity.updatedAt?.toISOString() ?? '',
    };
  }

  private mapType(justiType: string): CasJuridiqueType {
    const mapping: Record<string, CasJuridiqueType> = {
      consultation: CasJuridiqueType.CONSEIL,
      litige: CasJuridiqueType.LITIGE,
      mediation: CasJuridiqueType.MEDIATION,
      contentieux: CasJuridiqueType.CONTENTIEUX,
      conseil: CasJuridiqueType.CONSEIL,
    };
    return mapping[justiType.toLowerCase()] || CasJuridiqueType.AUTRE;
  }

  private mapStatut(justiStatut: string): CasJuridiqueStatut {
    const mapping: Record<string, CasJuridiqueStatut> = {
      ouvert: CasJuridiqueStatut.OUVERT,
      en_cours: CasJuridiqueStatut.EN_COURS,
      en_attente: CasJuridiqueStatut.EN_ATTENTE,
      resolu: CasJuridiqueStatut.CLOS_GAGNE,
      clos: CasJuridiqueStatut.CLOS_ACCORD,
      refuse: CasJuridiqueStatut.ANNULE,
    };
    return mapping[justiStatut.toLowerCase()] || CasJuridiqueStatut.OUVERT;
  }

  private mapTypeToProto(type: CasJuridiqueType): TypeCas {
    const mapping: Record<CasJuridiqueType, number> = {
      [CasJuridiqueType.CONSEIL]: 5,
      [CasJuridiqueType.LITIGE]: 2,
      [CasJuridiqueType.MEDIATION]: 3,
      [CasJuridiqueType.CONTENTIEUX]: 4,
      [CasJuridiqueType.ARBITRAGE]: 0,
      [CasJuridiqueType.AUTRE]: 0,
    };
    return (mapping[type] ?? 0) as TypeCas;
  }

  private mapStatutToProto(statut: CasJuridiqueStatut): StatutCas {
    const mapping: Record<CasJuridiqueStatut, number> = {
      [CasJuridiqueStatut.OUVERT]: 1,
      [CasJuridiqueStatut.EN_COURS]: 2,
      [CasJuridiqueStatut.EN_ATTENTE]: 3,
      [CasJuridiqueStatut.CLOS_GAGNE]: 4,
      [CasJuridiqueStatut.CLOS_PERDU]: 5,
      [CasJuridiqueStatut.CLOS_ACCORD]: 5,
      [CasJuridiqueStatut.ANNULE]: 6,
    };
    return (mapping[statut] ?? 0) as StatutCas;
  }

  private reverseMapStatut(protoStatut: StatutCas): CasJuridiqueStatut | undefined {
    const mapping: Record<number, CasJuridiqueStatut> = {
      1: CasJuridiqueStatut.OUVERT,
      2: CasJuridiqueStatut.EN_COURS,
      3: CasJuridiqueStatut.EN_ATTENTE,
      4: CasJuridiqueStatut.CLOS_GAGNE,
      5: CasJuridiqueStatut.CLOS_ACCORD,
      6: CasJuridiqueStatut.ANNULE,
    };
    return mapping[protoStatut as number];
  }

  private reverseMapType(protoType: TypeCas): CasJuridiqueType | undefined {
    const mapping: Record<number, CasJuridiqueType> = {
      1: CasJuridiqueType.CONSEIL,
      2: CasJuridiqueType.LITIGE,
      3: CasJuridiqueType.MEDIATION,
      4: CasJuridiqueType.CONTENTIEUX,
      5: CasJuridiqueType.CONSEIL,
    };
    return mapping[protoType as number];
  }
}
