export interface ApiResponse<T = unknown> {
  data: T;
  message?: string;
  status: number;
}

export interface PageResponse<T> {
  content: T[];
  currentPage: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
}

export interface ApiError {
  message: string;
  details?: Record<string, unknown>;
  status?: number;
}
