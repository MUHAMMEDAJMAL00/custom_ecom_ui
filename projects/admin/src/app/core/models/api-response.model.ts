export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  code?: string;
}

export interface Paginated<T> {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  data: T[];
}
