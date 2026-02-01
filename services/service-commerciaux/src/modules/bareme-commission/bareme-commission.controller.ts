import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { BaremeCommissionService } from './bareme-commission.service';
import type {
  CreateBaremeCommissionRequest,
  UpdateBaremeCommissionRequest,
  GetBaremeCommissionRequest,
  GetBaremeCommissionByCodeRequest,
  ListBaremeCommissionRequest,
  ListBaremeByOrganisationRequest,
  ListBaremeActifsRequest,
  GetBaremeWithPaliersRequest,
  ActivateBaremeRequest,
  DeleteBaremeCommissionRequest,
} from '@crm/proto/commerciaux';

@Controller()
export class BaremeCommissionController {
  constructor(private readonly baremeCommissionService: BaremeCommissionService) {}

  @GrpcMethod('BaremeCommissionService', 'Create')
  async create(data: CreateBaremeCommissionRequest) {
    const { dateEffet, dateFin, ...rest } = data;
    return this.baremeCommissionService.create({
      ...rest,
      dateEffet: dateEffet ? new Date(dateEffet) : new Date(),
      dateFin: dateFin ? new Date(dateFin) : undefined,
    });
  }

  @GrpcMethod('BaremeCommissionService', 'Update')
  async update(data: UpdateBaremeCommissionRequest) {
    const { id, dateEffet, dateFin, ...rest } = data;
    return this.baremeCommissionService.update(id, {
      ...rest,
      dateEffet: dateEffet ? new Date(dateEffet) : undefined,
      dateFin: dateFin ? new Date(dateFin) : undefined,
    });
  }

  @GrpcMethod('BaremeCommissionService', 'Get')
  async get(data: GetBaremeCommissionRequest) {
    return this.baremeCommissionService.findById(data.id);
  }

  @GrpcMethod('BaremeCommissionService', 'GetByCode')
  async getByCode(data: GetBaremeCommissionByCodeRequest) {
    return this.baremeCommissionService.findByCode(data.code);
  }

  @GrpcMethod('BaremeCommissionService', 'List')
  async list(data: ListBaremeCommissionRequest) {
    const result = await this.baremeCommissionService.findAll(
      { search: data.search, typeCalcul: data.typeCalcul, canalVente: data.canalVente, actif: data.actif },
      data.pagination,
    );
    return {
      baremes: result.data,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    };
  }

  @GrpcMethod('BaremeCommissionService', 'ListByOrganisation')
  async listByOrganisation(data: ListBaremeByOrganisationRequest) {
    const result = await this.baremeCommissionService.findByOrganisation(
      data.organisationId,
      data.actif,
      data.pagination,
    );
    return {
      baremes: result.data,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    };
  }

  @GrpcMethod('BaremeCommissionService', 'ListActifs')
  async listActifs(data: ListBaremeActifsRequest) {
    const date = data.date ? new Date(data.date) : new Date();
    const result = await this.baremeCommissionService.findActifs(
      data.organisationId,
      date,
      data.pagination,
    );
    return {
      baremes: result.data,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    };
  }

  @GrpcMethod('BaremeCommissionService', 'GetWithPaliers')
  async getWithPaliers(data: GetBaremeWithPaliersRequest) {
    const bareme = await this.baremeCommissionService.findWithPaliers(data.id);
    return {
      bareme,
      paliers: bareme.paliers || [],
    };
  }

  @GrpcMethod('BaremeCommissionService', 'Activer')
  async activer(data: ActivateBaremeRequest) {
    return this.baremeCommissionService.activer(data.id);
  }

  @GrpcMethod('BaremeCommissionService', 'Desactiver')
  async desactiver(data: ActivateBaremeRequest) {
    return this.baremeCommissionService.desactiver(data.id);
  }

  @GrpcMethod('BaremeCommissionService', 'Delete')
  async delete(data: DeleteBaremeCommissionRequest) {
    const success = await this.baremeCommissionService.delete(data.id);
    return { success };
  }
}
