import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import {
  SubscriptionPreferenceSchemaEntity,
  PreferenceValueType,
} from '../../../../../domain/subscriptions/entities/subscription-preference-schema.entity';
import { ISubscriptionPreferenceSchemaRepository } from '../../../../../domain/subscriptions/repositories/ISubscriptionPreferenceSchemaRepository';

@Injectable()
export class SubscriptionPreferenceSchemaService implements ISubscriptionPreferenceSchemaRepository {
  private readonly logger = new Logger(SubscriptionPreferenceSchemaService.name);

  constructor(
    @InjectRepository(SubscriptionPreferenceSchemaEntity)
    private readonly repository: Repository<SubscriptionPreferenceSchemaEntity>,
  ) {}

  async findById(id: string): Promise<SubscriptionPreferenceSchemaEntity | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findByOrganisation(organisationId: string): Promise<SubscriptionPreferenceSchemaEntity[]> {
    return this.repository.find({
      where: { organisationId },
      order: { sortOrder: 'ASC', code: 'ASC' },
    });
  }

  async findActiveByOrganisation(
    organisationId: string,
  ): Promise<SubscriptionPreferenceSchemaEntity[]> {
    return this.repository.find({
      where: { organisationId, active: true },
      order: { sortOrder: 'ASC', code: 'ASC' },
    });
  }

  async findByOrganisationAndCode(
    organisationId: string,
    code: string,
  ): Promise<SubscriptionPreferenceSchemaEntity | null> {
    return this.repository.findOne({ where: { organisationId, code } });
  }

  async save(
    entity: SubscriptionPreferenceSchemaEntity,
  ): Promise<SubscriptionPreferenceSchemaEntity> {
    return this.repository.save(entity);
  }

  async upsert(input: {
    organisationId: string;
    code: string;
    label: string;
    valueType?: string;
    allowedValues?: string[];
    isRequired?: boolean;
    defaultValue?: string;
    sortOrder?: number;
    active?: boolean;
  }): Promise<SubscriptionPreferenceSchemaEntity> {
    let entity = await this.findByOrganisationAndCode(input.organisationId, input.code);

    if (entity) {
      entity.label = input.label;
      if (input.valueType !== undefined)
        entity.valueType = this.normalizeValueType(input.valueType);
      if (input.allowedValues !== undefined) entity.allowedValues = input.allowedValues;
      if (input.isRequired !== undefined) entity.isRequired = input.isRequired;
      if (input.defaultValue !== undefined) entity.defaultValue = input.defaultValue;
      if (input.sortOrder !== undefined) entity.sortOrder = input.sortOrder;
      if (input.active !== undefined) entity.active = input.active;
    } else {
      entity = this.repository.create({
        organisationId: input.organisationId,
        code: input.code,
        label: input.label,
        valueType: this.normalizeValueType(input.valueType),
        allowedValues: input.allowedValues || null,
        isRequired: input.isRequired ?? false,
        defaultValue: input.defaultValue || null,
        sortOrder: input.sortOrder ?? 0,
        active: input.active ?? true,
      });
    }

    return this.repository.save(entity);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  private normalizeValueType(value?: string): PreferenceValueType {
    const normalized = String(value || 'STRING').trim().toUpperCase();
    if (Object.values(PreferenceValueType).includes(normalized as PreferenceValueType)) {
      return normalized as PreferenceValueType;
    }
    throw new RpcException({
      code: status.INVALID_ARGUMENT,
      message: `Unsupported preference value type: ${value}`,
    });
  }
}
