"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CursorPaginationHelper = exports.PaginationUtil = exports.PaginationHelper = exports.PAGINATION_DEFAULTS = void 0;
exports.PAGINATION_DEFAULTS = {
    PAGE: 1,
    LIMIT: 10,
    MAX_LIMIT: 100,
};
class PaginationHelper {
    static normalize(input = {}) {
        const page = Math.max(input.page || exports.PAGINATION_DEFAULTS.PAGE, 1);
        const limit = Math.min(Math.max(input.limit || exports.PAGINATION_DEFAULTS.LIMIT, 1), exports.PAGINATION_DEFAULTS.MAX_LIMIT);
        const skip = (page - 1) * limit;
        return { page, limit, skip };
    }
    static createMeta(total, pagination) {
        const totalPages = Math.ceil(total / pagination.limit);
        return {
            page: pagination.page,
            limit: pagination.limit,
            total,
            totalPages,
            hasNextPage: pagination.page < totalPages,
            hasPreviousPage: pagination.page > 1,
        };
    }
    static createResponse(items, total, pagination) {
        return {
            items,
            meta: this.createMeta(total, pagination),
        };
    }
    static getParams(pagination) {
        return this.normalize(pagination);
    }
    static buildResponse(data, total, page, limit) {
        const totalPages = Math.ceil(total / limit);
        return {
            data,
            pagination: {
                total,
                page,
                limit,
                totalPages,
                hasNextPage: page < totalPages,
                hasPreviousPage: page > 1,
            },
        };
    }
    static buildFromInput(data, total, paginationInput) {
        const { page, limit } = this.getParams(paginationInput);
        return this.buildResponse(data, total, page, limit);
    }
}
exports.PaginationHelper = PaginationHelper;
exports.PaginationUtil = PaginationHelper;
class CursorPaginationHelper {
    static encodeCursor(cursor) {
        return Buffer.from(JSON.stringify(cursor)).toString('base64');
    }
    static decodeCursor(encoded) {
        try {
            return JSON.parse(Buffer.from(encoded, 'base64').toString('utf8'));
        }
        catch {
            return null;
        }
    }
    static normalize(input = {}, defaultLimit = exports.PAGINATION_DEFAULTS.LIMIT) {
        return {
            cursor: input.cursor,
            limit: Math.min(Math.max(input.limit || defaultLimit, 1), exports.PAGINATION_DEFAULTS.MAX_LIMIT),
        };
    }
}
exports.CursorPaginationHelper = CursorPaginationHelper;
//# sourceMappingURL=pagination.helper.js.map