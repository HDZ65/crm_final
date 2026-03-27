import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { CarrierService } from '../persistence/typeorm/repositories/logistics';
import { CarrierAccountEntity } from '../../domain/logistics/entities';
import type {
  CreateCarrierAccountRequest,
  CarrierAccountResponse,
  GetByIdRequest,
  GetByOrganisationIdRequest,
  CarrierAccountListResponse,
  UpdateCarrierAccountRequest,
  DeleteResponse,
} from '@proto/logistics';

@Controller()
export class CarrierController {
  private readonly logger = new Logger(CarrierController.name);

  constructor(private readonly carrierService: CarrierService) {}

  @GrpcMethod('LogisticsService', 'CreateCarrierAccount')
  async createCarrierAccount(data: CreateCarrierAccountRequest): Promise<CarrierAccountResponse> {
    this.logger.log(`CreateCarrierAccount for organisation: ${data.organisation_id}`);

    const account = await this.carrierService.create({
      organisationId: data.organisation_id,
      type: data.type,
      contractNumber: data.contract_number,
      password: data.password,
      labelFormat: data.label_format,
      actif: data.actif,
    });

    return {
      id: account.id,
      organisation_id: account.organisationId,
      type: account.type,
      contract_number: account.contractNumber,
      label_format: account.labelFormat,
      actif: account.actif,
      created_at: account.createdAt?.toISOString() ?? '',
      updated_at: account.updatedAt?.toISOString() ?? '',
    };
  }

  @GrpcMethod('LogisticsService', 'GetCarrierAccount')
  async getCarrierAccount(data: GetByIdRequest): Promise<CarrierAccountResponse> {
    this.logger.log(`GetCarrierAccount: ${data.id}`);

    const account = await this.carrierService.findById(data.id);
    if (!account) {
      throw new RpcException({ code: status.NOT_FOUND, message: 'Carrier account not found' });
    }

    return {
      id: account.id,
      organisation_id: account.organisationId,
      type: account.type,
      contract_number: account.contractNumber,
      label_format: account.labelFormat,
      actif: account.actif,
      created_at: account.createdAt?.toISOString() ?? '',
      updated_at: account.updatedAt?.toISOString() ?? '',
    };
  }

  @GrpcMethod('LogisticsService', 'GetCarrierAccountsByOrganisation')
  async getCarrierAccountsByOrganisation(data: GetByOrganisationIdRequest): Promise<CarrierAccountListResponse> {
    this.logger.log(`GetCarrierAccountsByOrganisation: ${data.organisation_id}`);

    const accounts = await this.carrierService.findByOrganisationId(data.organisation_id);

    return {
      accounts: accounts.map((a) => ({
        id: a.id,
        organisation_id: a.organisationId,
        type: a.type,
        contract_number: a.contractNumber,
        label_format: a.labelFormat,
        actif: a.actif,
        created_at: a.createdAt?.toISOString() ?? '',
        updated_at: a.updatedAt?.toISOString() ?? '',
      })),
      total: accounts.length,
    };
  }

  @GrpcMethod('LogisticsService', 'UpdateCarrierAccount')
  async updateCarrierAccount(data: UpdateCarrierAccountRequest): Promise<CarrierAccountResponse> {
    this.logger.log(`UpdateCarrierAccount: ${data.id}`);

    const account = await this.carrierService.update(data.id, {
      contractNumber: data.contract_number,
      password: data.password,
      labelFormat: data.label_format,
      actif: data.actif,
    });

    return {
      id: account.id,
      organisation_id: account.organisationId,
      type: account.type,
      contract_number: account.contractNumber,
      label_format: account.labelFormat,
      actif: account.actif,
      created_at: account.createdAt?.toISOString() ?? '',
      updated_at: account.updatedAt?.toISOString() ?? '',
    };
  }

  @GrpcMethod('LogisticsService', 'DeleteCarrierAccount')
  async deleteCarrierAccount(data: GetByIdRequest): Promise<DeleteResponse> {
    this.logger.log(`DeleteCarrierAccount: ${data.id}`);

    await this.carrierService.delete(data.id);
    return { success: true, message: 'Carrier account deleted successfully' };
  }
}
