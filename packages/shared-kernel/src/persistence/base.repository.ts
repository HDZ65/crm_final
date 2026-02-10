/**
 * Base Repository Abstract Class
 *
 * Provides common CRUD operations for all domain repositories.
 *
 * @module @crm/shared-kernel/persistence
 */

import { Repository, SelectQueryBuilder, IsNull } from 'typeorm';
import { AggregateRoot } from '../domain/aggregate-root.base.js';
import { NotFoundException } from '../exceptions/domain.exception.js';
import { NormalizedPagination } from '../helpers/pagination.helper.js';

/**
 * Interface for search options
 */
export interface SearchOptions {
  search?: string;
  searchFields?: string[];
}

/**
 * Interface for sorting options
 */
export interface SortOptions {
  sortBy?: string;
  ascending?: boolean;
}

/**
 * Base repository interface
 */
export interface IBaseRepository<A, ID> {
  findById(id: ID): Promise<A | null>;
  save(aggregate: A): Promise<A>;
  delete(id: ID): Promise<void>;
  exists(id: ID): Promise<boolean>;
  count(): Promise<number>;
}

/**
 * Abstract base repository with common CRUD operations
 */
export abstract class BaseRepository<
  A extends AggregateRoot<any>,
  E extends { id: string; deleted_at?: Date | null },
  ID extends { getValue(): string },
> implements IBaseRepository<A, ID>
{
  protected abstract readonly entityAlias: string;

  constructor(protected readonly ormRepository: Repository<E>) {}

  protected abstract toAggregate(entity: E): A;
  protected abstract toEntity(aggregate: A): Partial<E>;
  protected abstract getAggregateId(aggregate: A): string;

  async findById(id: ID): Promise<A | null> {
    const entity = await this.ormRepository.findOne({
      where: {
        id: id.getValue(),
        deleted_at: IsNull(),
      } as any,
    });

    return entity ? this.toAggregate(entity) : null;
  }

  async findAll(
    pagination: NormalizedPagination,
    options: SearchOptions & SortOptions = {},
  ): Promise<[A[], number]> {
    const queryBuilder = this.createBaseQueryBuilder();

    if (options.search && options.searchFields?.length) {
      this.applySearch(queryBuilder, options.search, options.searchFields);
    }

    this.applySorting(queryBuilder, options.sortBy, options.ascending);

    queryBuilder.skip(pagination.skip).take(pagination.limit);

    const [entities, total] = await queryBuilder.getManyAndCount();

    return [entities.map((e) => this.toAggregate(e)), total];
  }

  async save(aggregate: A): Promise<A> {
    const entity = this.toEntity(aggregate);
    await this.ormRepository.save(entity as any);
    return aggregate;
  }

  async delete(id: ID): Promise<void> {
    await this.ormRepository.update(
      { id: id.getValue() } as any,
      { deleted_at: new Date() } as any,
    );
  }

  async exists(id: ID): Promise<boolean> {
    const count = await this.ormRepository.count({
      where: {
        id: id.getValue(),
        deleted_at: IsNull(),
      } as any,
    });
    return count > 0;
  }

  async count(): Promise<number> {
    return this.ormRepository.count({
      where: { deleted_at: IsNull() } as any,
    });
  }

  async findByIdOrFail(id: ID, entityName: string): Promise<A> {
    const aggregate = await this.findById(id);
    if (!aggregate) {
      throw new NotFoundException(entityName, id.getValue());
    }
    return aggregate;
  }

  // ==================== Protected Helpers ====================

  protected createBaseQueryBuilder(): SelectQueryBuilder<E> {
    return this.ormRepository
      .createQueryBuilder(this.entityAlias)
      .where(`${this.entityAlias}.deleted_at IS NULL`);
  }

  protected applySearch(
    queryBuilder: SelectQueryBuilder<E>,
    search: string,
    fields: string[],
  ): void {
    if (!search?.trim() || !fields.length) return;

    const conditions = fields
      .map((field) => `${this.entityAlias}.${field} ILIKE :search`)
      .join(' OR ');

    queryBuilder.andWhere(`(${conditions})`, { search: `%${search}%` });
  }

  protected applySorting(
    queryBuilder: SelectQueryBuilder<E>,
    sortBy?: string,
    ascending?: boolean,
  ): void {
    const validSortFields = this.getValidSortFields();
    const field =
      sortBy && validSortFields.includes(sortBy) ? sortBy : 'created_at';
    const order = ascending ? 'ASC' : 'DESC';
    queryBuilder.orderBy(`${this.entityAlias}.${field}`, order);
  }

  protected getValidSortFields(): string[] {
    return ['created_at', 'updated_at'];
  }
}
