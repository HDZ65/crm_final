import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CarrierAccountEntity } from './entities/carrier-account.entity.js';

@Injectable()
export class CarrierService {
  private readonly logger = new Logger(CarrierService.name);

  constructor(
    @InjectRepository(CarrierAccountEntity)
    private readonly carrierAccountRepository: Repository<CarrierAccountEntity>,
  ) {}

  async create(params: {
    organisationId: string;
    type: string;
    contractNumber: string;
    password: string;
    labelFormat: string;
    actif: boolean;
  }): Promise<CarrierAccountEntity> {
    const account = this.carrierAccountRepository.create(params);
    return this.carrierAccountRepository.save(account);
  }

  async findById(id: string): Promise<CarrierAccountEntity | null> {
    return this.carrierAccountRepository.findOne({ where: { id } });
  }

  async findByOrganisationId(organisationId: string): Promise<CarrierAccountEntity[]> {
    return this.carrierAccountRepository.find({
      where: { organisationId },
      order: { createdAt: 'DESC' },
    });
  }

  async findActiveByOrganisationId(organisationId: string): Promise<CarrierAccountEntity[]> {
    return this.carrierAccountRepository.find({
      where: { organisationId, actif: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findMailevaAccount(organisationId: string): Promise<CarrierAccountEntity | null> {
    return this.carrierAccountRepository.findOne({
      where: { organisationId, type: 'maileva', actif: true },
    });
  }

  async update(
    id: string,
    params: {
      contractNumber?: string;
      password?: string;
      labelFormat?: string;
      actif?: boolean;
    },
  ): Promise<CarrierAccountEntity> {
    const account = await this.findById(id);
    if (!account) {
      throw new NotFoundException('Carrier account not found');
    }

    Object.assign(account, params);
    return this.carrierAccountRepository.save(account);
  }

  async delete(id: string): Promise<void> {
    const result = await this.carrierAccountRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Carrier account not found');
    }
  }
}
