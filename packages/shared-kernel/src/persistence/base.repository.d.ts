import { Repository, SelectQueryBuilder } from 'typeorm';
import { AggregateRoot } from '../domain/aggregate-root.base.js';
import { NormalizedPagination } from '../helpers/pagination.helper.js';
export interface SearchOptions {
    search?: string;
    searchFields?: string[];
}
export interface SortOptions {
    sortBy?: string;
    ascending?: boolean;
}
export interface IBaseRepository<A, ID> {
    findById(id: ID): Promise<A | null>;
    save(aggregate: A): Promise<A>;
    delete(id: ID): Promise<void>;
    exists(id: ID): Promise<boolean>;
    count(): Promise<number>;
}
export declare abstract class BaseRepository<A extends AggregateRoot<any>, E extends {
    id: string;
    deleted_at?: Date | null;
}, ID extends {
    getValue(): string;
}> implements IBaseRepository<A, ID> {
    protected readonly ormRepository: Repository<E>;
    protected abstract readonly entityAlias: string;
    constructor(ormRepository: Repository<E>);
    protected abstract toAggregate(entity: E): A;
    protected abstract toEntity(aggregate: A): Partial<E>;
    protected abstract getAggregateId(aggregate: A): string;
    findById(id: ID): Promise<A | null>;
    findAll(pagination: NormalizedPagination, options?: SearchOptions & SortOptions): Promise<[A[], number]>;
    save(aggregate: A): Promise<A>;
    delete(id: ID): Promise<void>;
    exists(id: ID): Promise<boolean>;
    count(): Promise<number>;
    findByIdOrFail(id: ID, entityName: string): Promise<A>;
    protected createBaseQueryBuilder(): SelectQueryBuilder<E>;
    protected applySearch(queryBuilder: SelectQueryBuilder<E>, search: string, fields: string[]): void;
    protected applySorting(queryBuilder: SelectQueryBuilder<E>, sortBy?: string, ascending?: boolean): void;
    protected getValidSortFields(): string[];
}
//# sourceMappingURL=base.repository.d.ts.map