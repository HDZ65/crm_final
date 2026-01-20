import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { ScheduleEntity as ScheduleOrm } from '../db/entities/schedule.entity';
import { ScheduleEntity } from '../../core/domain/schedule.entity';
import { ScheduleRepositoryPort } from '../../core/port/schedule-repository.port';
import { ScheduleMapper } from '../../core/mapper/schedule.mapper';
import { ScheduleStatus } from '../../core/domain/payment.enums';

@Injectable()
export class TypeOrmScheduleRepository implements ScheduleRepositoryPort {
  constructor(
    @InjectRepository(ScheduleOrm)
    private readonly ormRepository: Repository<ScheduleOrm>,
  ) {}

  async create(entity: ScheduleEntity): Promise<ScheduleEntity> {
    const ormEntity = this.ormRepository.create(
      ScheduleMapper.toPersistence(entity),
    );
    const saved = await this.ormRepository.save(ormEntity);
    return ScheduleMapper.toDomain(saved);
  }

  async findById(id: string): Promise<ScheduleEntity | null> {
    const found = await this.ormRepository.findOne({ where: { id } });
    return found ? ScheduleMapper.toDomain(found) : null;
  }

  async findAll(): Promise<ScheduleEntity[]> {
    const entities = await this.ormRepository.find();
    return entities.map((e) => ScheduleMapper.toDomain(e));
  }

  async update(id: string, entity: ScheduleEntity): Promise<ScheduleEntity> {
    await this.ormRepository.update(id, ScheduleMapper.toPersistence(entity));
    const updated = await this.ormRepository.findOne({ where: { id } });
    if (!updated) throw new Error('Schedule not found after update');
    return ScheduleMapper.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await this.ormRepository.delete(id);
  }

  async findByFactureId(factureId: string): Promise<ScheduleEntity[]> {
    const entities = await this.ormRepository.find({ where: { factureId } });
    return entities.map((e) => ScheduleMapper.toDomain(e));
  }

  async findByContratId(contratId: string): Promise<ScheduleEntity[]> {
    const entities = await this.ormRepository.find({ where: { contratId } });
    return entities.map((e) => ScheduleMapper.toDomain(e));
  }

  async findDueSchedules(date: Date): Promise<ScheduleEntity[]> {
    const entities = await this.ormRepository.find({
      where: {
        dueDate: LessThanOrEqual(date),
        status: ScheduleStatus.PLANNED,
      },
    });
    return entities.map((e) => ScheduleMapper.toDomain(e));
  }

  async findFailedSchedulesForRetry(): Promise<ScheduleEntity[]> {
    const entities = await this.ormRepository
      .createQueryBuilder('schedule')
      .where('schedule.status = :status', { status: ScheduleStatus.FAILED })
      .andWhere('schedule.retryCount < :maxRetries', { maxRetries: 3 })
      .getMany();
    return entities.map((e) => ScheduleMapper.toDomain(e));
  }
}
