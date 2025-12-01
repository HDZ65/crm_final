// src/mcp/mcp.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { CreateClientBaseDto } from 'src/applications/dto/client-base/create-client-base.dto';
import { CreateClientBaseUseCase } from 'src/applications/usecase/client-base/create-client-base.usecase';
import { GetClientBaseUseCase } from 'src/applications/usecase/client-base/get-client-base.usecase';
import { UpdateClientBaseUseCase } from 'src/applications/usecase/client-base/update-client-base.usecase';
import { DeleteClientBaseUseCase } from 'src/applications/usecase/client-base/delete-client-base.usecase';

import { CreateContratDto } from 'src/applications/dto/contrat/create-contrat.dto';
import { CreateContratUseCase } from 'src/applications/usecase/contrat/create-contrat.usecase';
import { GetContratUseCase } from 'src/applications/usecase/contrat/get-contrat.usecase';
import { UpdateContratUseCase } from 'src/applications/usecase/contrat/update-contrat.usecase';
import { DeleteContratUseCase } from 'src/applications/usecase/contrat/delete-contrat.usecase';

import { CreateFactureDto } from 'src/applications/dto/facture/create-facture.dto';
import { CreateFactureUseCase } from 'src/applications/usecase/facture/create-facture.usecase';
import { GetFactureUseCase } from 'src/applications/usecase/facture/get-facture.usecase';
import { UpdateFactureUseCase } from 'src/applications/usecase/facture/update-facture.usecase';
import { DeleteFactureUseCase } from 'src/applications/usecase/facture/delete-facture.usecase';

import { CreateActiviteDto } from 'src/applications/dto/activite/create-activite.dto';
import { CreateActiviteUseCase } from 'src/applications/usecase/activite/create-activite.usecase';
import { GetActiviteUseCase } from 'src/applications/usecase/activite/get-activite.usecase';
import { UpdateActiviteUseCase } from 'src/applications/usecase/activite/update-activite.usecase';
import { DeleteActiviteUseCase } from 'src/applications/usecase/activite/delete-activite.usecase';

import { toolDefs } from './mcp.tool';


type SearchClientsInput = { organisationId: string; limit?: number; offset?: number };
type GetClientInput = { organisationId: string; clientId: string };
type CreateClientInput = CreateClientBaseDto;

type SearchContractsInput = {
  organisationId: string;
  clientId?: string;
  statutId?: string;
  dateDebut?: string;
  dateFin?: string;
  limit?: number;
  offset?: number
};
type GetContractInput = { organisationId: string; contractId: string };
type CreateContractInput = CreateContratDto;
type UpdateContractInput = { organisationId: string; contractId: string; patch: any };
type DeleteContractInput = { organisationId: string; contractId: string };

type SearchInvoicesInput = {
  organisationId: string;
  clientId?: string;
  statutId?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
};
type GetInvoiceInput = { organisationId: string; invoiceId: string };
type CreateInvoiceInput = CreateFactureDto;
type UpdateInvoiceInput = { organisationId: string; invoiceId: string; patch: any };

type SearchActivitiesInput = {
  organisationId: string;
  clientBaseId?: string;
  contratId?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
};
type GetActivityInput = { organisationId: string; activityId: string };
type CreateActivityInput = CreateActiviteDto;
type UpdateActivityInput = { organisationId: string; activityId: string; patch: any };

@Injectable()
export class McpService {
  private readonly logger = new Logger(McpService.name);

  constructor(
    // Client Base UseCases
    private readonly createClientBase: CreateClientBaseUseCase,
    private readonly getClientBase: GetClientBaseUseCase,
    private readonly updateClientBase: UpdateClientBaseUseCase,
    private readonly deleteClientBase: DeleteClientBaseUseCase,

    // Contrat UseCases
    private readonly createContrat: CreateContratUseCase,
    private readonly getContrat: GetContratUseCase,
    private readonly updateContrat: UpdateContratUseCase,
    private readonly deleteContrat: DeleteContratUseCase,

    // Facture UseCases
    private readonly createFacture: CreateFactureUseCase,
    private readonly getFacture: GetFactureUseCase,
    private readonly updateFacture: UpdateFactureUseCase,
    private readonly deleteFacture: DeleteFactureUseCase,

    // Activite UseCases
    private readonly createActivite: CreateActiviteUseCase,
    private readonly getActivite: GetActiviteUseCase,
    private readonly updateActivite: UpdateActiviteUseCase,
    private readonly deleteActivite: DeleteActiviteUseCase,
  ) {}

  listTools() {
    return toolDefs.map(({ name, description, input_schema }) => ({
      name,
      description,
      input_schema,
    }));
  }

  /**
   * Exécution d’un tool MCP.
   * name: nom du tool (ex: 'search_clients')
   * input: paramètres JSON (validés côté orchestrateur)
   * ctx: infos de requête (requestId, tenant, etc. – à étendre si besoin)
   */
  async execute(name: string, input: unknown, ctx: { requestId: string }) {
    this.logger.log(`[${ctx.requestId}] tool=${name} input=${JSON.stringify(input).slice(0, 500)}`);

    switch (name) {
      // ========== CLIENTS ==========
      case 'search_clients':
        return this.searchClients(input as SearchClientsInput);
      case 'get_client':
        return this.getClient(input as GetClientInput);
      case 'create_client':
        return this.createClient(input as CreateClientInput);

      // ========== CONTRACTS ==========
      case 'search_contracts':
        return this.searchContracts(input as SearchContractsInput);
      case 'get_contract':
        return this.getContract(input as GetContractInput);
      case 'create_contract':
        return this.createContract(input as CreateContractInput);
      case 'update_contract':
        return this.updateContract(input as UpdateContractInput);
      case 'delete_contract':
        return this.deleteContract(input as DeleteContractInput);
      case 'orchestrate_contract':
        return this.orchestrateContract(input as any);

      // ========== INVOICES ==========
      case 'search_invoices':
        return this.searchInvoices(input as SearchInvoicesInput);
      case 'get_invoice':
        return this.getInvoice(input as GetInvoiceInput);
      case 'create_invoice':
        return this.createInvoice(input as CreateInvoiceInput);
      case 'update_invoice':
        return this.updateInvoice(input as UpdateInvoiceInput);

      // ========== ACTIVITIES ==========
      case 'search_activities':
        return this.searchActivities(input as SearchActivitiesInput);
      case 'get_activity':
        return this.getActivity(input as GetActivityInput);
      case 'create_activity':
        return this.createActivity(input as CreateActivityInput);
      case 'update_activity':
        return this.updateActivity(input as UpdateActivityInput);

      // ========== LOGISTICS ==========
      case 'logistics_create_label':
      case 'logistics_track':
      case 'logistics_validate_address':
      case 'logistics_pricing_simulate':
        throw new Error(`Tool '${name}' not yet implemented`);

      // ========== GROUPS / PERMISSIONS / PRODUCTS ==========
      case 'list_groups':
      case 'add_client_to_group':
      case 'list_permissions':
      case 'search_products':
        throw new Error(`Tool '${name}' not yet implemented`);

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }

  // ----------------- Implémentations ClientBase -----------------

  private async searchClients(input: SearchClientsInput) {
    const { organisationId, limit = 50, offset = 0 } = input;
    if (!organisationId) throw new Error('organisationId is required');

    // Ton GetClientBaseUseCase expose executeAll() sans filtre.
    const entities = await this.getClientBase.executeAll();

    // Par sécurité tenant, on filtre côté service si l'entité porte organisationId
    const scoped = entities.filter((e: any) => !e.organisationId || e.organisationId === organisationId);

    const total = scoped.length;
    const items = scoped.slice(offset, offset + limit);

    // On retourne un payload simple (MCP-friendly)
    return {
      total,
      limit,
      offset,
      items: items.map((e: any) => ({
        id: e.id,
        organisationId: e.organisationId,
        nom: e.nom,
        prenom: e.prenom,
        telephone: e.telephone,
        statutId: e.statutId,
        dateCreation: e.dateCreation,
      })),
    };
  }

  private async getClient(input: GetClientInput) {
    const { organisationId, clientId } = input;
    if (!organisationId) throw new Error('organisationId is required');
    if (!clientId) throw new Error('clientId is required');

    const entity = await this.getClientBase.execute(clientId);
    if (!entity) throw new Error('Client not found');

    // Cloisonnement tenant (si applicable sur l’entité)
    if ((entity as any).organisationId && (entity as any).organisationId !== organisationId) {
      throw new Error('Forbidden: wrong tenant');
    }

    return {
      id: entity.id,
      organisationId: (entity as any).organisationId,
      nom: (entity as any).nom,
      prenom: (entity as any).prenom,
      telephone: (entity as any).telephone,
      statutId: (entity as any).statutId,
      dateCreation: (entity as any).dateCreation,
    };
  }

  private async createClient(input: CreateClientInput) {
    // Ici on se repose sur la validation class-validator du DTO
    const dto: CreateClientBaseDto = {
      organisationId: input.organisationId,
      typeClient: input.typeClient,
      nom: input.nom,
      prenom: input.prenom,
      dateNaissance: input.dateNaissance ?? null,
      compteCode: input.compteCode,
      partenaireId: input.partenaireId,
      dateCreation: input.dateCreation,
      telephone: input.telephone,
      statutId: input.statutId,
    };

    const entity = await this.createClientBase.execute(dto);
    return {
      id: (entity as any).id,
      organisationId: (entity as any).organisationId,
      nom: (entity as any).nom,
      prenom: (entity as any).prenom,
      telephone: (entity as any).telephone,
      statutId: (entity as any).statutId,
      createdAt: (entity as any).createdAt,
    };
  }

  // ----------------- Implémentations Contrat -----------------

  private async searchContracts(input: SearchContractsInput) {
    const { organisationId, clientId, statutId, dateDebut, dateFin, limit = 50, offset = 0 } = input;
    if (!organisationId) throw new Error('organisationId is required');

    const entities = await this.getContrat.executeAll();

    // Filtrage tenant + filtres optionnels
    let scoped = entities.filter((e: any) => !e.organisationId || e.organisationId === organisationId);

    if (clientId) {
      scoped = scoped.filter((e: any) => e.clientBaseId === clientId);
    }
    if (statutId) {
      scoped = scoped.filter((e: any) => e.statutId === statutId);
    }
    if (dateDebut) {
      scoped = scoped.filter((e: any) => e.dateDebut >= dateDebut);
    }
    if (dateFin) {
      scoped = scoped.filter((e: any) => e.dateFin <= dateFin);
    }

    const total = scoped.length;
    const items = scoped.slice(offset, offset + limit);

    return {
      total,
      limit,
      offset,
      items: items.map((e: any) => ({
        id: e.id,
        organisationId: e.organisationId,
        referenceExterne: e.referenceExterne,
        dateSignature: e.dateSignature,
        dateDebut: e.dateDebut,
        dateFin: e.dateFin,
        statutId: e.statutId,
        clientBaseId: e.clientBaseId,
        autoRenouvellement: e.autoRenouvellement,
      })),
    };
  }

  private async getContract(input: GetContractInput) {
    const { organisationId, contractId } = input;
    if (!organisationId) throw new Error('organisationId is required');
    if (!contractId) throw new Error('contractId is required');

    const entity = await this.getContrat.execute(contractId);
    if (!entity) throw new Error('Contract not found');

    if ((entity as any).organisationId && (entity as any).organisationId !== organisationId) {
      throw new Error('Forbidden: wrong tenant');
    }

    return {
      id: entity.id,
      organisationId: (entity as any).organisationId,
      referenceExterne: (entity as any).referenceExterne,
      dateSignature: (entity as any).dateSignature,
      dateDebut: (entity as any).dateDebut,
      dateFin: (entity as any).dateFin,
      statutId: (entity as any).statutId,
      autoRenouvellement: (entity as any).autoRenouvellement,
      joursPreavis: (entity as any).joursPreavis,
      clientBaseId: (entity as any).clientBaseId,
      commercialId: (entity as any).commercialId,
    };
  }

  private async createContract(input: CreateContractInput) {
    const dto: CreateContratDto = {
      organisationId: input.organisationId,
      referenceExterne: input.referenceExterne,
      dateSignature: input.dateSignature,
      dateDebut: input.dateDebut,
      dateFin: input.dateFin,
      statutId: input.statutId,
      autoRenouvellement: input.autoRenouvellement,
      joursPreavis: input.joursPreavis,
      conditionPaiementId: input.conditionPaiementId,
      modeleDistributionId: input.modeleDistributionId,
      facturationParId: input.facturationParId,
      clientBaseId: input.clientBaseId,
      societeId: input.societeId,
      commercialId: input.commercialId,
      clientPartenaireId: input.clientPartenaireId,
      adresseFacturationId: input.adresseFacturationId,
      dateFinRetractation: input.dateFinRetractation,
    };

    const entity = await this.createContrat.execute(dto);
    return {
      id: (entity as any).id,
      organisationId: (entity as any).organisationId,
      referenceExterne: (entity as any).referenceExterne,
      statutId: (entity as any).statutId,
      createdAt: (entity as any).createdAt,
    };
  }

  private async updateContract(input: UpdateContractInput) {
    const { organisationId, contractId, patch } = input;
    if (!organisationId) throw new Error('organisationId is required');
    if (!contractId) throw new Error('contractId is required');

    // Vérifier tenant avant update
    const existing = await this.getContrat.execute(contractId);
    if (!existing) throw new Error('Contract not found');
    if ((existing as any).organisationId !== organisationId) {
      throw new Error('Forbidden: wrong tenant');
    }

    const entity = await this.updateContrat.execute(contractId, patch);
    return {
      id: (entity as any).id,
      organisationId: (entity as any).organisationId,
      statutId: (entity as any).statutId,
      updatedAt: (entity as any).updatedAt,
    };
  }

  private async deleteContract(input: DeleteContractInput) {
    const { organisationId, contractId } = input;
    if (!organisationId) throw new Error('organisationId is required');
    if (!contractId) throw new Error('contractId is required');

    // Vérifier tenant avant delete
    const existing = await this.getContrat.execute(contractId);
    if (!existing) throw new Error('Contract not found');
    if ((existing as any).organisationId !== organisationId) {
      throw new Error('Forbidden: wrong tenant');
    }

    await this.deleteContrat.execute(contractId);
    return { success: true, deletedId: contractId };
  }

  private async orchestrateContract(input: any) {
    // TODO: Implémenter l'orchestration (activate, suspend, terminate, port-in)
    throw new Error('Contract orchestration not yet implemented');
  }

  // ----------------- Implémentations Facture -----------------

  private async searchInvoices(input: SearchInvoicesInput) {
    const { organisationId, clientId, statutId, dateFrom, dateTo, limit = 50, offset = 0 } = input;
    if (!organisationId) throw new Error('organisationId is required');

    const entities = await this.getFacture.executeAll();

    let scoped = entities.filter((e: any) => !e.organisationId || e.organisationId === organisationId);

    if (clientId) {
      scoped = scoped.filter((e: any) => e.clientBaseId === clientId);
    }
    if (statutId) {
      scoped = scoped.filter((e: any) => e.statutId === statutId);
    }
    if (dateFrom) {
      scoped = scoped.filter((e: any) => e.dateEmission >= dateFrom);
    }
    if (dateTo) {
      scoped = scoped.filter((e: any) => e.dateEmission <= dateTo);
    }

    const total = scoped.length;
    const items = scoped.slice(offset, offset + limit);

    return {
      total,
      limit,
      offset,
      items: items.map((e: any) => ({
        id: e.id,
        numero: e.numero,
        dateEmission: e.dateEmission,
        montantHT: e.montantHT,
        montantTTC: e.montantTTC,
        statutId: e.statutId,
        clientBaseId: e.clientBaseId,
      })),
    };
  }

  private async getInvoice(input: GetInvoiceInput) {
    const { organisationId, invoiceId } = input;
    if (!organisationId) throw new Error('organisationId is required');
    if (!invoiceId) throw new Error('invoiceId is required');

    const entity = await this.getFacture.execute(invoiceId);
    if (!entity) throw new Error('Invoice not found');

    if ((entity as any).organisationId && (entity as any).organisationId !== organisationId) {
      throw new Error('Forbidden: wrong tenant');
    }

    return {
      id: entity.id,
      numero: (entity as any).numero,
      dateEmission: (entity as any).dateEmission,
      montantHT: (entity as any).montantHT,
      montantTTC: (entity as any).montantTTC,
      statutId: (entity as any).statutId,
      clientBaseId: (entity as any).clientBaseId,
      contratId: (entity as any).contratId,
    };
  }

  private async createInvoice(input: CreateInvoiceInput) {
    const dto: CreateFactureDto = {
      organisationId: input.organisationId,
      numero: input.numero,
      dateEmission: input.dateEmission,
      montantHT: input.montantHT,
      montantTTC: input.montantTTC,
      statutId: input.statutId,
      emissionFactureId: input.emissionFactureId,
      clientBaseId: input.clientBaseId,
      contratId: input.contratId,
      clientPartenaireId: input.clientPartenaireId,
      adresseFacturationId: input.adresseFacturationId,
    };

    const entity = await this.createFacture.execute(dto);
    return {
      id: (entity as any).id,
      numero: (entity as any).numero,
      montantTTC: (entity as any).montantTTC,
      statutId: (entity as any).statutId,
      createdAt: (entity as any).createdAt,
    };
  }

  private async updateInvoice(input: UpdateInvoiceInput) {
    const { organisationId, invoiceId, patch } = input;
    if (!organisationId) throw new Error('organisationId is required');
    if (!invoiceId) throw new Error('invoiceId is required');

    const existing = await this.getFacture.execute(invoiceId);
    if (!existing) throw new Error('Invoice not found');
    if ((existing as any).organisationId !== organisationId) {
      throw new Error('Forbidden: wrong tenant');
    }

    const entity = await this.updateFacture.execute(invoiceId, patch);
    return {
      id: (entity as any).id,
      statutId: (entity as any).statutId,
      updatedAt: (entity as any).updatedAt,
    };
  }

  // ----------------- Implémentations Activité -----------------

  private async searchActivities(input: SearchActivitiesInput) {
    const { organisationId, clientBaseId, contratId, dateFrom, dateTo, limit = 50, offset = 0 } = input;
    if (!organisationId) throw new Error('organisationId is required');

    const entities = await this.getActivite.executeAll();

    let scoped = entities.filter((e: any) => !e.organisationId || e.organisationId === organisationId);

    if (clientBaseId) {
      scoped = scoped.filter((e: any) => e.clientBaseId === clientBaseId);
    }
    if (contratId) {
      scoped = scoped.filter((e: any) => e.contratId === contratId);
    }
    if (dateFrom) {
      scoped = scoped.filter((e: any) => e.dateActivite >= dateFrom);
    }
    if (dateTo) {
      scoped = scoped.filter((e: any) => e.dateActivite <= dateTo);
    }

    const total = scoped.length;
    const items = scoped.slice(offset, offset + limit);

    return {
      total,
      limit,
      offset,
      items: items.map((e: any) => ({
        id: e.id,
        typeId: e.typeId,
        dateActivite: e.dateActivite,
        sujet: e.sujet,
        commentaire: e.commentaire,
        clientBaseId: e.clientBaseId,
        contratId: e.contratId,
      })),
    };
  }

  private async getActivity(input: GetActivityInput) {
    const { organisationId, activityId } = input;
    if (!organisationId) throw new Error('organisationId is required');
    if (!activityId) throw new Error('activityId is required');

    const entity = await this.getActivite.execute(activityId);
    if (!entity) throw new Error('Activity not found');

    if ((entity as any).organisationId && (entity as any).organisationId !== organisationId) {
      throw new Error('Forbidden: wrong tenant');
    }

    return {
      id: entity.id,
      typeId: (entity as any).typeId,
      dateActivite: (entity as any).dateActivite,
      sujet: (entity as any).sujet,
      commentaire: (entity as any).commentaire,
      echeance: (entity as any).echeance,
      clientBaseId: (entity as any).clientBaseId,
      contratId: (entity as any).contratId,
    };
  }

  private async createActivity(input: CreateActivityInput) {
    const dto: CreateActiviteDto = {
      typeId: input.typeId,
      dateActivite: input.dateActivite,
      sujet: input.sujet,
      commentaire: input.commentaire,
      echeance: input.echeance,
      clientBaseId: input.clientBaseId,
      contratId: input.contratId,
      clientPartenaireId: input.clientPartenaireId,
    };

    const entity = await this.createActivite.execute(dto);
    return {
      id: (entity as any).id,
      typeId: (entity as any).typeId,
      sujet: (entity as any).sujet,
      createdAt: (entity as any).createdAt,
    };
  }

  private async updateActivity(input: UpdateActivityInput) {
    const { organisationId, activityId, patch } = input;
    if (!organisationId) throw new Error('organisationId is required');
    if (!activityId) throw new Error('activityId is required');

    const existing = await this.getActivite.execute(activityId);
    if (!existing) throw new Error('Activity not found');
    if ((existing as any).organisationId && (existing as any).organisationId !== organisationId) {
      throw new Error('Forbidden: wrong tenant');
    }

    const entity = await this.updateActivite.execute(activityId, patch);
    return {
      id: (entity as any).id,
      sujet: (entity as any).sujet,
      updatedAt: (entity as any).updatedAt,
    };
  }
}
