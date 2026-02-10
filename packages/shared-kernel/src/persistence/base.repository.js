"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseRepository = void 0;
const typeorm_1 = require("typeorm");
const domain_exception_js_1 = require("../exceptions/domain.exception.js");
class BaseRepository {
    ormRepository;
    constructor(ormRepository) {
        this.ormRepository = ormRepository;
    }
    async findById(id) {
        const entity = await this.ormRepository.findOne({
            where: {
                id: id.getValue(),
                deleted_at: (0, typeorm_1.IsNull)(),
            },
        });
        return entity ? this.toAggregate(entity) : null;
    }
    async findAll(pagination, options = {}) {
        const queryBuilder = this.createBaseQueryBuilder();
        if (options.search && options.searchFields?.length) {
            this.applySearch(queryBuilder, options.search, options.searchFields);
        }
        this.applySorting(queryBuilder, options.sortBy, options.ascending);
        queryBuilder.skip(pagination.skip).take(pagination.limit);
        const [entities, total] = await queryBuilder.getManyAndCount();
        return [entities.map((e) => this.toAggregate(e)), total];
    }
    async save(aggregate) {
        const entity = this.toEntity(aggregate);
        await this.ormRepository.save(entity);
        return aggregate;
    }
    async delete(id) {
        await this.ormRepository.update({ id: id.getValue() }, { deleted_at: new Date() });
    }
    async exists(id) {
        const count = await this.ormRepository.count({
            where: {
                id: id.getValue(),
                deleted_at: (0, typeorm_1.IsNull)(),
            },
        });
        return count > 0;
    }
    async count() {
        return this.ormRepository.count({
            where: { deleted_at: (0, typeorm_1.IsNull)() },
        });
    }
    async findByIdOrFail(id, entityName) {
        const aggregate = await this.findById(id);
        if (!aggregate) {
            throw new domain_exception_js_1.NotFoundException(entityName, id.getValue());
        }
        return aggregate;
    }
    createBaseQueryBuilder() {
        return this.ormRepository
            .createQueryBuilder(this.entityAlias)
            .where(`${this.entityAlias}.deleted_at IS NULL`);
    }
    applySearch(queryBuilder, search, fields) {
        if (!search?.trim() || !fields.length)
            return;
        const conditions = fields
            .map((field) => `${this.entityAlias}.${field} ILIKE :search`)
            .join(' OR ');
        queryBuilder.andWhere(`(${conditions})`, { search: `%${search}%` });
    }
    applySorting(queryBuilder, sortBy, ascending) {
        const validSortFields = this.getValidSortFields();
        const field = sortBy && validSortFields.includes(sortBy) ? sortBy : 'created_at';
        const order = ascending ? 'ASC' : 'DESC';
        queryBuilder.orderBy(`${this.entityAlias}.${field}`, order);
    }
    getValidSortFields() {
        return ['created_at', 'updated_at'];
    }
}
exports.BaseRepository = BaseRepository;
//# sourceMappingURL=base.repository.js.map