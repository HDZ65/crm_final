export declare const PAGINATION_DEFAULTS: {
    readonly PAGE: 1;
    readonly LIMIT: 10;
    readonly MAX_LIMIT: 100;
};
export interface PaginationInput {
    page?: number;
    limit?: number;
}
export interface NormalizedPagination {
    page: number;
    limit: number;
    skip: number;
}
export interface PaginationMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
}
export interface PaginatedResponse<T> {
    items: T[];
    meta: PaginationMeta;
}
export declare class PaginationHelper {
    static normalize(input?: PaginationInput): NormalizedPagination;
    static createMeta(total: number, pagination: NormalizedPagination): PaginationMeta;
    static createResponse<T>(items: T[], total: number, pagination: NormalizedPagination): PaginatedResponse<T>;
    static getParams(pagination?: {
        page?: number;
        limit?: number;
    }): NormalizedPagination;
    static buildResponse<T>(data: T[], total: number, page: number, limit: number): {
        data: T[];
        pagination: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
            hasNextPage: boolean;
            hasPreviousPage: boolean;
        };
    };
    static buildFromInput<T>(data: T[], total: number, paginationInput?: {
        page?: number;
        limit?: number;
    }): {
        data: T[];
        pagination: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
            hasNextPage: boolean;
            hasPreviousPage: boolean;
        };
    };
}
export declare const PaginationUtil: typeof PaginationHelper;
export interface CursorPaginationInput<C> {
    cursor?: C;
    limit?: number;
}
export interface CursorPaginationResult<T, C> {
    items: T[];
    nextCursor: C | null;
    hasMore: boolean;
}
export declare class CursorPaginationHelper {
    static encodeCursor<C extends object>(cursor: C): string;
    static decodeCursor<C extends object>(encoded: string): C | null;
    static normalize<C>(input?: CursorPaginationInput<C>, defaultLimit?: 10): {
        cursor: C | undefined;
        limit: number;
    };
}
//# sourceMappingURL=pagination.helper.d.ts.map