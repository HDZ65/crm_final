import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DebitLotEntity } from '../../../../../domain/calendar/entities';

@Injectable()
export class LotService {
  constructor(
    @InjectRepository(DebitLotEntity)
    private readonly lotRepo: Repository<DebitLotEntity>,
  ) {}

  async createLot(input: {
    organisationId: string;
    societeId: string;
    name: string;
    startDay: number;
    endDay: number;
    description?: string;
    displayOrder?: number;
  }): Promise<DebitLotEntity> {
    if (input.startDay > input.endDay) {
      throw new BadRequestException('startDay must be <= endDay');
    }
    if (input.startDay < 1 || input.endDay > 28) {
      throw new BadRequestException('Days must be between 1 and 28');
    }
    // Check for overlapping active lots
    const existing = await this.lotRepo
      .createQueryBuilder('lot')
      .where('lot.organisation_id = :orgId', { orgId: input.organisationId })
      .andWhere('lot.societe_id = :societeId', { societeId: input.societeId })
      .andWhere('lot.is_active = true')
      .getMany();

    for (const lot of existing) {
      if (input.startDay <= lot.endDay && input.endDay >= lot.startDay) {
        throw new BadRequestException(
          `Lot overlaps with existing lot "${lot.name}" (days ${lot.startDay}-${lot.endDay})`,
        );
      }
    }

    const lot = this.lotRepo.create({
      organisationId: input.organisationId,
      societeId: input.societeId,
      name: input.name,
      startDay: input.startDay,
      endDay: input.endDay,
      description: input.description,
      displayOrder: input.displayOrder ?? 0,
      isActive: true,
    });

    return this.lotRepo.save(lot);
  }

  async getLot(id: string, organisationId: string): Promise<DebitLotEntity> {
    const lot = await this.lotRepo.findOne({ where: { id, organisationId } });
    if (!lot) throw new NotFoundException('Lot not found');
    return lot;
  }

  async listLots(
    organisationId: string,
    societeId: string,
    includeInactive = false,
  ): Promise<DebitLotEntity[]> {
    const qb = this.lotRepo
      .createQueryBuilder('lot')
      .where('lot.organisation_id = :orgId', { orgId: organisationId })
      .andWhere('lot.societe_id = :societeId', { societeId })
      .orderBy('lot.display_order', 'ASC')
      .addOrderBy('lot.start_day', 'ASC');

    if (!includeInactive) {
      qb.andWhere('lot.is_active = true');
    }

    return qb.getMany();
  }

  async updateLot(
    id: string,
    organisationId: string,
    updates: {
      name?: string;
      startDay?: number;
      endDay?: number;
      description?: string;
      displayOrder?: number;
    },
  ): Promise<DebitLotEntity> {
    const lot = await this.getLot(id, organisationId);

    const newStartDay = updates.startDay ?? lot.startDay;
    const newEndDay = updates.endDay ?? lot.endDay;

    if (newStartDay > newEndDay) {
      throw new BadRequestException('startDay must be <= endDay');
    }

    // Check overlap with other active lots (excluding self)
    const others = await this.lotRepo
      .createQueryBuilder('lot')
      .where('lot.organisation_id = :orgId', { orgId: organisationId })
      .andWhere('lot.societe_id = :societeId', { societeId: lot.societeId })
      .andWhere('lot.is_active = true')
      .andWhere('lot.id != :id', { id })
      .getMany();

    for (const other of others) {
      if (newStartDay <= other.endDay && newEndDay >= other.startDay) {
        throw new BadRequestException(
          `Lot overlaps with existing lot "${other.name}" (days ${other.startDay}-${other.endDay})`,
        );
      }
    }

    if (updates.name !== undefined) lot.name = updates.name;
    if (updates.startDay !== undefined) lot.startDay = updates.startDay;
    if (updates.endDay !== undefined) lot.endDay = updates.endDay;
    if (updates.description !== undefined) lot.description = updates.description;
    if (updates.displayOrder !== undefined) lot.displayOrder = updates.displayOrder;

    return this.lotRepo.save(lot);
  }

  async deactivateLot(id: string, organisationId: string): Promise<DebitLotEntity> {
    const lot = await this.getLot(id, organisationId);
    lot.isActive = false;
    return this.lotRepo.save(lot);
  }

  async reactivateLot(id: string, organisationId: string): Promise<DebitLotEntity> {
    const lot = await this.getLot(id, organisationId);
    lot.isActive = true;
    return this.lotRepo.save(lot);
  }
}
