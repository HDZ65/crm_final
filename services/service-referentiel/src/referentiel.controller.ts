import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { ConditionPaiementService } from './modules/condition-paiement/condition-paiement.service';
import { StatutClientService } from './modules/statut-client/statut-client.service';
import { FacturationParService } from './modules/facturation-par/facturation-par.service';
import { PeriodeFacturationService } from './modules/periode-facturation/periode-facturation.service';
import { EmissionFactureService } from './modules/emission-facture/emission-facture.service';
import { TransporteurCompteService } from './modules/transporteur-compte/transporteur-compte.service';
import type {
  ConditionPaiement,
  CreateConditionPaiementRequest,
  UpdateConditionPaiementRequest,
  GetConditionPaiementRequest,
  GetConditionPaiementByCodeRequest,
  ListConditionPaiementRequest,
  DeleteConditionPaiementRequest,
  ListConditionPaiementResponse,
  StatutClient,
  CreateStatutClientRequest,
  UpdateStatutClientRequest,
  GetStatutClientRequest,
  GetStatutClientByCodeRequest,
  ListStatutClientRequest,
  DeleteStatutClientRequest,
  ListStatutClientResponse,
  FacturationPar,
  CreateFacturationParRequest,
  UpdateFacturationParRequest,
  GetFacturationParRequest,
  GetFacturationParByCodeRequest,
  ListFacturationParRequest,
  DeleteFacturationParRequest,
  ListFacturationParResponse,
  PeriodeFacturation,
  CreatePeriodeFacturationRequest,
  UpdatePeriodeFacturationRequest,
  GetPeriodeFacturationRequest,
  GetPeriodeFacturationByCodeRequest,
  ListPeriodeFacturationRequest,
  DeletePeriodeFacturationRequest,
  ListPeriodeFacturationResponse,
  EmissionFacture,
  CreateEmissionFactureRequest,
  UpdateEmissionFactureRequest,
  GetEmissionFactureRequest,
  GetEmissionFactureByCodeRequest,
  ListEmissionFactureRequest,
  DeleteEmissionFactureRequest,
  ListEmissionFactureResponse,
  TransporteurCompte,
  CreateTransporteurCompteRequest,
  UpdateTransporteurCompteRequest,
  GetTransporteurCompteRequest,
  ListTransporteurByOrganisationRequest,
  ListTransporteurCompteRequest,
  ActivateTransporteurRequest,
  DeleteTransporteurCompteRequest,
  ListTransporteurCompteResponse,
  DeleteResponse,
} from '@proto/referentiel/referentiel';

@Controller()
export class ReferentielController {
  constructor(
    private readonly conditionPaiementService: ConditionPaiementService,
    private readonly statutClientService: StatutClientService,
    private readonly facturationParService: FacturationParService,
    private readonly periodeFacturationService: PeriodeFacturationService,
    private readonly emissionFactureService: EmissionFactureService,
    private readonly transporteurCompteService: TransporteurCompteService,
  ) {}

  // ========== CONDITION PAIEMENT SERVICE ==========

  @GrpcMethod('ConditionPaiementService', 'Create')
  async createConditionPaiement(data: CreateConditionPaiementRequest): Promise<ConditionPaiement> {
    const entity = await this.conditionPaiementService.create(data);
    return this.mapConditionPaiement(entity);
  }

  @GrpcMethod('ConditionPaiementService', 'Update')
  async updateConditionPaiement(data: UpdateConditionPaiementRequest): Promise<ConditionPaiement> {
    const { id, ...updateData } = data;
    const entity = await this.conditionPaiementService.update(id, updateData);
    return this.mapConditionPaiement(entity);
  }

  @GrpcMethod('ConditionPaiementService', 'Get')
  async getConditionPaiement(data: GetConditionPaiementRequest): Promise<ConditionPaiement> {
    const entity = await this.conditionPaiementService.findById(data.id);
    return this.mapConditionPaiement(entity);
  }

  @GrpcMethod('ConditionPaiementService', 'GetByCode')
  async getConditionPaiementByCode(data: GetConditionPaiementByCodeRequest): Promise<ConditionPaiement> {
    const entity = await this.conditionPaiementService.findByCode(data.code);
    return this.mapConditionPaiement(entity);
  }

  @GrpcMethod('ConditionPaiementService', 'List')
  async listConditionPaiement(data: ListConditionPaiementRequest): Promise<ListConditionPaiementResponse> {
    const result = await this.conditionPaiementService.findAll({ search: data.search }, data.pagination);
    return {
      conditions: result.data.map((e) => this.mapConditionPaiement(e)),
      pagination: { total: result.total, page: result.page, limit: result.limit, totalPages: result.totalPages },
    };
  }

  @GrpcMethod('ConditionPaiementService', 'Delete')
  async deleteConditionPaiement(data: DeleteConditionPaiementRequest): Promise<DeleteResponse> {
    const success = await this.conditionPaiementService.delete(data.id);
    return { success };
  }

  // ========== STATUT CLIENT SERVICE ==========

  @GrpcMethod('StatutClientService', 'Create')
  async createStatutClient(data: CreateStatutClientRequest): Promise<StatutClient> {
    const entity = await this.statutClientService.create(data);
    return this.mapStatutClient(entity);
  }

  @GrpcMethod('StatutClientService', 'Update')
  async updateStatutClient(data: UpdateStatutClientRequest): Promise<StatutClient> {
    const { id, ...updateData } = data;
    const entity = await this.statutClientService.update(id, updateData);
    return this.mapStatutClient(entity);
  }

  @GrpcMethod('StatutClientService', 'Get')
  async getStatutClient(data: GetStatutClientRequest): Promise<StatutClient> {
    const entity = await this.statutClientService.findById(data.id);
    return this.mapStatutClient(entity);
  }

  @GrpcMethod('StatutClientService', 'GetByCode')
  async getStatutClientByCode(data: GetStatutClientByCodeRequest): Promise<StatutClient> {
    const entity = await this.statutClientService.findByCode(data.code);
    return this.mapStatutClient(entity);
  }

  @GrpcMethod('StatutClientService', 'List')
  async listStatutClient(data: ListStatutClientRequest): Promise<ListStatutClientResponse> {
    const result = await this.statutClientService.findAll({ search: data.search }, data.pagination);
    return {
      statuts: result.data.map((e) => this.mapStatutClient(e)),
      pagination: { total: result.total, page: result.page, limit: result.limit, totalPages: result.totalPages },
    };
  }

  @GrpcMethod('StatutClientService', 'Delete')
  async deleteStatutClient(data: DeleteStatutClientRequest): Promise<DeleteResponse> {
    const success = await this.statutClientService.delete(data.id);
    return { success };
  }

  // ========== FACTURATION PAR SERVICE ==========

  @GrpcMethod('FacturationParService', 'Create')
  async createFacturationPar(data: CreateFacturationParRequest): Promise<FacturationPar> {
    const entity = await this.facturationParService.create(data);
    return this.mapFacturationPar(entity);
  }

  @GrpcMethod('FacturationParService', 'Update')
  async updateFacturationPar(data: UpdateFacturationParRequest): Promise<FacturationPar> {
    const { id, ...updateData } = data;
    const entity = await this.facturationParService.update(id, updateData);
    return this.mapFacturationPar(entity);
  }

  @GrpcMethod('FacturationParService', 'Get')
  async getFacturationPar(data: GetFacturationParRequest): Promise<FacturationPar> {
    const entity = await this.facturationParService.findById(data.id);
    return this.mapFacturationPar(entity);
  }

  @GrpcMethod('FacturationParService', 'GetByCode')
  async getFacturationParByCode(data: GetFacturationParByCodeRequest): Promise<FacturationPar> {
    const entity = await this.facturationParService.findByCode(data.code);
    return this.mapFacturationPar(entity);
  }

  @GrpcMethod('FacturationParService', 'List')
  async listFacturationPar(data: ListFacturationParRequest): Promise<ListFacturationParResponse> {
    const result = await this.facturationParService.findAll({ search: data.search }, data.pagination);
    return {
      facturations: result.data.map((e) => this.mapFacturationPar(e)),
      pagination: { total: result.total, page: result.page, limit: result.limit, totalPages: result.totalPages },
    };
  }

  @GrpcMethod('FacturationParService', 'Delete')
  async deleteFacturationPar(data: DeleteFacturationParRequest): Promise<DeleteResponse> {
    const success = await this.facturationParService.delete(data.id);
    return { success };
  }

  // ========== PERIODE FACTURATION SERVICE ==========

  @GrpcMethod('PeriodeFacturationService', 'Create')
  async createPeriodeFacturation(data: CreatePeriodeFacturationRequest): Promise<PeriodeFacturation> {
    const entity = await this.periodeFacturationService.create(data);
    return this.mapPeriodeFacturation(entity);
  }

  @GrpcMethod('PeriodeFacturationService', 'Update')
  async updatePeriodeFacturation(data: UpdatePeriodeFacturationRequest): Promise<PeriodeFacturation> {
    const { id, ...updateData } = data;
    const entity = await this.periodeFacturationService.update(id, updateData);
    return this.mapPeriodeFacturation(entity);
  }

  @GrpcMethod('PeriodeFacturationService', 'Get')
  async getPeriodeFacturation(data: GetPeriodeFacturationRequest): Promise<PeriodeFacturation> {
    const entity = await this.periodeFacturationService.findById(data.id);
    return this.mapPeriodeFacturation(entity);
  }

  @GrpcMethod('PeriodeFacturationService', 'GetByCode')
  async getPeriodeFacturationByCode(data: GetPeriodeFacturationByCodeRequest): Promise<PeriodeFacturation> {
    const entity = await this.periodeFacturationService.findByCode(data.code);
    return this.mapPeriodeFacturation(entity);
  }

  @GrpcMethod('PeriodeFacturationService', 'List')
  async listPeriodeFacturation(data: ListPeriodeFacturationRequest): Promise<ListPeriodeFacturationResponse> {
    const result = await this.periodeFacturationService.findAll({ search: data.search }, data.pagination);
    return {
      periodes: result.data.map((e) => this.mapPeriodeFacturation(e)),
      pagination: { total: result.total, page: result.page, limit: result.limit, totalPages: result.totalPages },
    };
  }

  @GrpcMethod('PeriodeFacturationService', 'Delete')
  async deletePeriodeFacturation(data: DeletePeriodeFacturationRequest): Promise<DeleteResponse> {
    const success = await this.periodeFacturationService.delete(data.id);
    return { success };
  }

  // ========== EMISSION FACTURE SERVICE ==========

  @GrpcMethod('EmissionFactureService', 'Create')
  async createEmissionFacture(data: CreateEmissionFactureRequest): Promise<EmissionFacture> {
    const entity = await this.emissionFactureService.create(data);
    return this.mapEmissionFacture(entity);
  }

  @GrpcMethod('EmissionFactureService', 'Update')
  async updateEmissionFacture(data: UpdateEmissionFactureRequest): Promise<EmissionFacture> {
    const { id, ...updateData } = data;
    const entity = await this.emissionFactureService.update(id, updateData);
    return this.mapEmissionFacture(entity);
  }

  @GrpcMethod('EmissionFactureService', 'Get')
  async getEmissionFacture(data: GetEmissionFactureRequest): Promise<EmissionFacture> {
    const entity = await this.emissionFactureService.findById(data.id);
    return this.mapEmissionFacture(entity);
  }

  @GrpcMethod('EmissionFactureService', 'GetByCode')
  async getEmissionFactureByCode(data: GetEmissionFactureByCodeRequest): Promise<EmissionFacture> {
    const entity = await this.emissionFactureService.findByCode(data.code);
    return this.mapEmissionFacture(entity);
  }

  @GrpcMethod('EmissionFactureService', 'List')
  async listEmissionFacture(data: ListEmissionFactureRequest): Promise<ListEmissionFactureResponse> {
    const result = await this.emissionFactureService.findAll({ search: data.search }, data.pagination);
    return {
      emissions: result.data.map((e) => this.mapEmissionFacture(e)),
      pagination: { total: result.total, page: result.page, limit: result.limit, totalPages: result.totalPages },
    };
  }

  @GrpcMethod('EmissionFactureService', 'Delete')
  async deleteEmissionFacture(data: DeleteEmissionFactureRequest): Promise<DeleteResponse> {
    const success = await this.emissionFactureService.delete(data.id);
    return { success };
  }

  // ========== TRANSPORTEUR COMPTE SERVICE ==========

  @GrpcMethod('TransporteurCompteService', 'Create')
  async createTransporteurCompte(data: CreateTransporteurCompteRequest): Promise<TransporteurCompte> {
    const entity = await this.transporteurCompteService.create(data);
    return this.mapTransporteurCompte(entity);
  }

  @GrpcMethod('TransporteurCompteService', 'Update')
  async updateTransporteurCompte(data: UpdateTransporteurCompteRequest): Promise<TransporteurCompte> {
    const { id, ...updateData } = data;
    const entity = await this.transporteurCompteService.update(id, updateData);
    return this.mapTransporteurCompte(entity);
  }

  @GrpcMethod('TransporteurCompteService', 'Get')
  async getTransporteurCompte(data: GetTransporteurCompteRequest): Promise<TransporteurCompte> {
    const entity = await this.transporteurCompteService.findById(data.id);
    return this.mapTransporteurCompte(entity);
  }

  @GrpcMethod('TransporteurCompteService', 'ListByOrganisation')
  async listTransporteurByOrganisation(data: ListTransporteurByOrganisationRequest): Promise<ListTransporteurCompteResponse> {
    const result = await this.transporteurCompteService.findByOrganisation(data.organisationId, data.actif, data.pagination);
    return {
      transporteurs: result.data.map((e) => this.mapTransporteurCompte(e)),
      pagination: { total: result.total, page: result.page, limit: result.limit, totalPages: result.totalPages },
    };
  }

  @GrpcMethod('TransporteurCompteService', 'List')
  async listTransporteurCompte(data: ListTransporteurCompteRequest): Promise<ListTransporteurCompteResponse> {
    const result = await this.transporteurCompteService.findAll({ type: data.type, actif: data.actif }, data.pagination);
    return {
      transporteurs: result.data.map((e) => this.mapTransporteurCompte(e)),
      pagination: { total: result.total, page: result.page, limit: result.limit, totalPages: result.totalPages },
    };
  }

  @GrpcMethod('TransporteurCompteService', 'Activer')
  async activerTransporteur(data: ActivateTransporteurRequest): Promise<TransporteurCompte> {
    const entity = await this.transporteurCompteService.activer(data.id);
    return this.mapTransporteurCompte(entity);
  }

  @GrpcMethod('TransporteurCompteService', 'Desactiver')
  async desactiverTransporteur(data: ActivateTransporteurRequest): Promise<TransporteurCompte> {
    const entity = await this.transporteurCompteService.desactiver(data.id);
    return this.mapTransporteurCompte(entity);
  }

  @GrpcMethod('TransporteurCompteService', 'Delete')
  async deleteTransporteurCompte(data: DeleteTransporteurCompteRequest): Promise<DeleteResponse> {
    const success = await this.transporteurCompteService.delete(data.id);
    return { success };
  }

  // ========== MAPPERS ==========

  private mapConditionPaiement(e: any): ConditionPaiement {
    return {
      id: e.id,
      code: e.code,
      nom: e.nom,
      description: e.description || '',
      delaiJours: e.delaiJours || 0,
      createdAt: e.createdAt?.toISOString() || '',
      updatedAt: e.updatedAt?.toISOString() || '',
    };
  }

  private mapStatutClient(e: any): StatutClient {
    return {
      id: e.id,
      code: e.code,
      nom: e.nom,
      description: e.description || '',
      ordreAffichage: e.ordreAffichage || 0,
      createdAt: e.createdAt?.toISOString() || '',
      updatedAt: e.updatedAt?.toISOString() || '',
    };
  }

  private mapFacturationPar(e: any): FacturationPar {
    return {
      id: e.id,
      code: e.code,
      nom: e.nom,
      description: e.description || '',
      createdAt: e.createdAt?.toISOString() || '',
      updatedAt: e.updatedAt?.toISOString() || '',
    };
  }

  private mapPeriodeFacturation(e: any): PeriodeFacturation {
    return {
      id: e.id,
      code: e.code,
      nom: e.nom,
      description: e.description || '',
      createdAt: e.createdAt?.toISOString() || '',
      updatedAt: e.updatedAt?.toISOString() || '',
    };
  }

  private mapEmissionFacture(e: any): EmissionFacture {
    return {
      id: e.id,
      code: e.code,
      nom: e.nom,
      description: e.description || '',
      createdAt: e.createdAt?.toISOString() || '',
      updatedAt: e.updatedAt?.toISOString() || '',
    };
  }

  private mapTransporteurCompte(e: any): TransporteurCompte {
    return {
      id: e.id,
      type: e.type,
      organisationId: e.organisationId,
      contractNumber: e.contractNumber,
      labelFormat: e.labelFormat,
      actif: e.actif,
      createdAt: e.createdAt?.toISOString() || '',
      updatedAt: e.updatedAt?.toISOString() || '',
    };
  }
}
