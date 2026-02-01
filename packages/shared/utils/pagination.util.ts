/**
 * Pagination utility for consistent pagination across all microservices
 * 
 * Usage:
 * ```typescript
 * const { page, limit, skip } = PaginationUtil.getParams(request.pagination);
 * const [data, total] = await repository.findAndCount({ skip, take: limit });
 * return PaginationUtil.buildResponse(data, total, page, limit);
 * ```
 */
export class PaginationUtil {
  /**
   * Default page number (1-indexed)
   */
  static readonly DEFAULT_PAGE = 1;

  /**
   * Default items per page
   */
  static readonly DEFAULT_LIMIT = 20;

  /**
   * Maximum items per page (to prevent abuse)
   */
  static readonly MAX_LIMIT = 100;

  /**
   * Extract and validate pagination parameters
   * 
   * @param pagination - Optional pagination input from request
   * @returns Validated pagination parameters with skip/take for database
   */
  static getParams(pagination?: { page?: number; limit?: number }): {
    page: number;
    limit: number;
    skip: number;
  } {
    const page = Math.max(1, pagination?.page ?? this.DEFAULT_PAGE);
    const limit = Math.min(
      Math.max(1, pagination?.limit ?? this.DEFAULT_LIMIT),
      this.MAX_LIMIT,
    );
    const skip = (page - 1) * limit;

    return { page, limit, skip };
  }

  /**
   * Build standardized pagination response
   * 
   * @param data - Array of results
   * @param total - Total count from database
   * @param page - Current page number
   * @param limit - Items per page
   * @returns Standardized pagination response object
   */
  static buildResponse<T>(
    data: T[],
    total: number,
    page: number,
    limit: number,
  ): {
    data: T[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
    };
  } {
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

  /**
   * Helper to build response in one call
   * 
   * @param data - Array of results
   * @param total - Total count
   * @param paginationInput - Original pagination input
   * @returns Standardized pagination response
   */
  static buildFromInput<T>(
    data: T[],
    total: number,
    paginationInput?: { page?: number; limit?: number },
  ) {
    const { page, limit } = this.getParams(paginationInput);
    return this.buildResponse(data, total, page, limit);
  }
}
