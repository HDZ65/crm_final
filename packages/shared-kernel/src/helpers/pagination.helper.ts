/**
 * Pagination Helper
 *
 * Single source of truth for pagination logic across all services.
 *
 * @module @crm/shared-kernel/helpers
 */

/**
 * Pagination constants
 */
export const PAGINATION_DEFAULTS = {
  PAGE: 1,
  LIMIT: 10,
  MAX_LIMIT: 100,
} as const;

/**
 * Pagination input (from request)
 */
export interface PaginationInput {
  page?: number;
  limit?: number;
}

/**
 * Normalized pagination values (ready to use in queries)
 */
export interface NormalizedPagination {
  page: number;
  limit: number;
  skip: number;
}

/**
 * Pagination metadata (for response)
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
  items: T[];
  meta: PaginationMeta;
}

/**
 * Pagination helper utilities
 */
export class PaginationHelper {
  static normalize(input: PaginationInput = {}): NormalizedPagination {
    const page = Math.max(input.page || PAGINATION_DEFAULTS.PAGE, 1);
    const limit = Math.min(
      Math.max(input.limit || PAGINATION_DEFAULTS.LIMIT, 1),
      PAGINATION_DEFAULTS.MAX_LIMIT,
    );
    const skip = (page - 1) * limit;

    return { page, limit, skip };
  }

  static createMeta(
    total: number,
    pagination: NormalizedPagination,
  ): PaginationMeta {
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

  static createResponse<T>(
    items: T[],
    total: number,
    pagination: NormalizedPagination,
  ): PaginatedResponse<T> {
    return {
      items,
      meta: this.createMeta(total, pagination),
    };
  }

  // Legacy compat aliases
  static getParams(pagination?: { page?: number; limit?: number }) {
    return this.normalize(pagination);
  }

  static buildResponse<T>(
    data: T[],
    total: number,
    page: number,
    limit: number,
  ) {
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

  static buildFromInput<T>(
    data: T[],
    total: number,
    paginationInput?: { page?: number; limit?: number },
  ) {
    const { page, limit } = this.getParams(paginationInput);
    return this.buildResponse(data, total, page, limit);
  }
}

// Keep backward compatibility alias
export const PaginationUtil = PaginationHelper;

/**
 * Cursor-based pagination helper (for large datasets)
 */
export interface CursorPaginationInput<C> {
  cursor?: C;
  limit?: number;
}

export interface CursorPaginationResult<T, C> {
  items: T[];
  nextCursor: C | null;
  hasMore: boolean;
}

export class CursorPaginationHelper {
  static encodeCursor<C extends object>(cursor: C): string {
    return Buffer.from(JSON.stringify(cursor)).toString('base64');
  }

  static decodeCursor<C extends object>(encoded: string): C | null {
    try {
      return JSON.parse(Buffer.from(encoded, 'base64').toString('utf8'));
    } catch {
      return null;
    }
  }

  static normalize<C>(
    input: CursorPaginationInput<C> = {},
    defaultLimit = PAGINATION_DEFAULTS.LIMIT,
  ): { cursor: C | undefined; limit: number } {
    return {
      cursor: input.cursor,
      limit: Math.min(
        Math.max(input.limit || defaultLimit, 1),
        PAGINATION_DEFAULTS.MAX_LIMIT,
      ),
    };
  }
}
