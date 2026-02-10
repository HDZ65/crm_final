/**
 * Shared utility types for server actions and data handling
 */

/** Standard server action return type */
export interface ActionResult<T> {
  data: T | null;
  error: string | null;
}

/** Standard paginated response */
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
