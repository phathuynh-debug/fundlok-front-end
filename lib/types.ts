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
  /**
   * Present when the endpoint returned a structured `{ code, message, fields }`
   * detail. Translate by `code`; `message` is the English fallback for a code
   * the UI has no string for.
   */
  reason?: { code: string; message: string; fields?: string[] };
  status?: number;
}
