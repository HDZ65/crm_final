import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { CarrierService } from '../../../../infrastructure/persistence/typeorm/repositories/logistics';
import { CarrierAccountEntity } from '../../../../domain/logistics/entities';
import type {
  CreateCarrierAccountRequest,
  CarrierAccountResponse,
  GetByIdRequest,
  GetByOrganisationIdRequest,
  CarrierAccountListResponse,
  UpdateCarrierAccountRequest,
  DeleteResponse,
} from '@crm/proto/logistics';

@Controller()
export class CarrierController {
  private readonly logger = new Logger(CarrierController.name);

  constructor(private readonly carrierService: CarrierService) {}

  @GrpcMethod('LogisticsService', 'CreateCarrierAccount')
  async createCarrierAccount(data: CreateCarrierAccountRequest): Promise<CarrierAccountResponse> {
    this.logger.log(`CreateCarrierAccount for organisation: ${data.organisationId}`);

    const account = await this.carrierService.create({
      organisationId: data.organisationId,
      type: data.type,
      contractNumber: data.contractNumber,
      password: data.password,
      labelFormat: data.labelFormat,
      actif: data.actif,
    });

    return this.mapToResponse(account);
  }

  @GrpcMethod('LogisticsService', 'GetCarrierAccount')
  async getCarrierAccount(data: GetByIdRequest): Promise<CarrierAccountResponse> {
    this.logger.log(`GetCarrierAccount: ${data.id}`);

    const account = await this.carrierService.findById(data.id);
    if (!account) {
      throw new Error('Carrier account not found');
    }

    return this.mapToResponse(account);
  }

  @GrpcMethod('LogisticsService', 'GetCarrierAccountsByOrganisation')
  async getCarrierAccountsByOrganisation(data: GetByOrganisationIdRequest): Promise<CarrierAccountListResponse> {
    this.logger.log(`GetCarrierAccountsByOrganisation: ${data.organisationId}`);

    const accounts = await this.carrierService.findByOrganisationId(data.organisationId);

    return {
      accounts: accounts.map((a) => this.mapToResponse(a)),
      total: accounts.length,
    };
  }

  @GrpcMethod('LogisticsService', 'UpdateCarrierAccount')
  async updateCarrierAccount(data: UpdateCarrierAccountRequest): Promise<CarrierAccountResponse> {
    this.logger.log(`UpdateCarrierAccount: ${data.id}`);

    const account = await this.carrierService.update(data.id, {
      contractNumber: data.contractNumber,
      password: data.password,
      labelFormat: data.labelFormat,
      actif: data.actif,
    });

    return this.mapToResponse(account);
  }

  @GrpcMethod('LogisticsService', 'DeleteCarrierAccount')
  async deleteCarrierAccount(data: GetByIdRequest): Promise<DeleteResponse> {
    this.logger.log(`DeleteCarrierAccount: ${data.id}`);

    await this.carrierService.delete(data.id);
    return { success: true, message: 'Carrier account deleted successfully' };
  }

  private mapToResponse(account: CarrierAccountEntity): CarrierAccountResponse {
    return {
      id: account.id,
      organisationId: account.organisationId,
      type: account.type,
      contractNumber: account.contractNumber,
      labelFormat: account.labelFormat,
      actif: account.actif,
      createdAt: account.createdAt?.toISOString() ?? '',
      updatedAt: account.updatedAt?.toISOString() ?? '',
    };
  }
}
