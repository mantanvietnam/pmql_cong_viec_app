export interface ApiResponse<T> {
  code: number;
  message?: string;
  data?: T;
  listData?: T;
}

export interface PaginatedData<T> {
  listData: T[];
  total?: number;
  current_page?: number;
  per_page?: number;
}

export interface ApiError extends Error {
  status?: number;
  code?: number;
}
