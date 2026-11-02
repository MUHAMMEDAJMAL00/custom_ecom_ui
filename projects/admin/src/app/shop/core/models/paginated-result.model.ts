export interface PaginatedResult<T> {
  success: boolean;
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  data: T[];
}
