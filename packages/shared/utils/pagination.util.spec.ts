import { PaginationUtil } from './pagination.util';

describe('PaginationUtil', () => {
  describe('getParams', () => {
    it('should return default values when no pagination provided', () => {
      const result = PaginationUtil.getParams();

      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(result.skip).toBe(0);
    });

    it('should return default values for undefined pagination', () => {
      const result = PaginationUtil.getParams(undefined);

      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(result.skip).toBe(0);
    });

    it('should use provided page and limit', () => {
      const result = PaginationUtil.getParams({ page: 3, limit: 50 });

      expect(result.page).toBe(3);
      expect(result.limit).toBe(50);
      expect(result.skip).toBe(100); // (3-1) * 50
    });

    it('should cap limit at MAX_LIMIT (100)', () => {
      const result = PaginationUtil.getParams({ page: 1, limit: 500 });

      expect(result.limit).toBe(100);
    });

    it('should ensure page is at least 1', () => {
      const result = PaginationUtil.getParams({ page: 0 });

      expect(result.page).toBe(1);
    });

    it('should ensure page is at least 1 for negative values', () => {
      const result = PaginationUtil.getParams({ page: -5 });

      expect(result.page).toBe(1);
    });

    it('should ensure limit is at least 1', () => {
      const result = PaginationUtil.getParams({ limit: 0 });

      expect(result.limit).toBe(1);
    });

    it('should ensure limit is at least 1 for negative values', () => {
      const result = PaginationUtil.getParams({ limit: -10 });

      expect(result.limit).toBe(1);
    });

    it('should calculate correct skip value', () => {
      expect(PaginationUtil.getParams({ page: 1, limit: 10 }).skip).toBe(0);
      expect(PaginationUtil.getParams({ page: 2, limit: 10 }).skip).toBe(10);
      expect(PaginationUtil.getParams({ page: 5, limit: 25 }).skip).toBe(100);
    });
  });

  describe('buildResponse', () => {
    const mockData = [{ id: 1 }, { id: 2 }, { id: 3 }];

    it('should build correct response with pagination info', () => {
      const result = PaginationUtil.buildResponse(mockData, 100, 1, 10);

      expect(result.data).toEqual(mockData);
      expect(result.pagination.total).toBe(100);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(10);
      expect(result.pagination.totalPages).toBe(10);
    });

    it('should calculate totalPages correctly', () => {
      expect(PaginationUtil.buildResponse([], 100, 1, 10).pagination.totalPages).toBe(10);
      expect(PaginationUtil.buildResponse([], 101, 1, 10).pagination.totalPages).toBe(11);
      expect(PaginationUtil.buildResponse([], 99, 1, 10).pagination.totalPages).toBe(10);
      expect(PaginationUtil.buildResponse([], 0, 1, 10).pagination.totalPages).toBe(0);
    });

    it('should set hasNextPage correctly', () => {
      // Page 1 of 10 pages - has next
      expect(PaginationUtil.buildResponse([], 100, 1, 10).pagination.hasNextPage).toBe(true);
      // Page 10 of 10 pages - no next
      expect(PaginationUtil.buildResponse([], 100, 10, 10).pagination.hasNextPage).toBe(false);
      // Page 5 of 10 pages - has next
      expect(PaginationUtil.buildResponse([], 100, 5, 10).pagination.hasNextPage).toBe(true);
      // Empty result - no next
      expect(PaginationUtil.buildResponse([], 0, 1, 10).pagination.hasNextPage).toBe(false);
    });

    it('should set hasPreviousPage correctly', () => {
      // Page 1 - no previous
      expect(PaginationUtil.buildResponse([], 100, 1, 10).pagination.hasPreviousPage).toBe(false);
      // Page 2 - has previous
      expect(PaginationUtil.buildResponse([], 100, 2, 10).pagination.hasPreviousPage).toBe(true);
      // Page 10 - has previous
      expect(PaginationUtil.buildResponse([], 100, 10, 10).pagination.hasPreviousPage).toBe(true);
    });

    it('should handle empty data array', () => {
      const result = PaginationUtil.buildResponse([], 0, 1, 10);

      expect(result.data).toEqual([]);
      expect(result.pagination.total).toBe(0);
      expect(result.pagination.totalPages).toBe(0);
      expect(result.pagination.hasNextPage).toBe(false);
      expect(result.pagination.hasPreviousPage).toBe(false);
    });
  });

  describe('buildFromInput', () => {
    const mockData = [{ id: 1 }, { id: 2 }];

    it('should combine getParams and buildResponse', () => {
      const result = PaginationUtil.buildFromInput(mockData, 50, { page: 2, limit: 10 });

      expect(result.data).toEqual(mockData);
      expect(result.pagination.page).toBe(2);
      expect(result.pagination.limit).toBe(10);
      expect(result.pagination.total).toBe(50);
      expect(result.pagination.totalPages).toBe(5);
    });

    it('should use default values when no pagination provided', () => {
      const result = PaginationUtil.buildFromInput(mockData, 100);

      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(20);
      expect(result.pagination.totalPages).toBe(5);
    });

    it('should handle edge cases', () => {
      const result = PaginationUtil.buildFromInput(mockData, 5, { page: -1, limit: 500 });

      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(100); // capped at MAX_LIMIT
      expect(result.pagination.totalPages).toBe(1);
    });
  });

  describe('constants', () => {
    it('should have correct default values', () => {
      expect(PaginationUtil.DEFAULT_PAGE).toBe(1);
      expect(PaginationUtil.DEFAULT_LIMIT).toBe(20);
      expect(PaginationUtil.MAX_LIMIT).toBe(100);
    });
  });
});
