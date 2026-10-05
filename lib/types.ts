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
  /**
   * A stable, translatable identifier for the failure, from the response's
   * `X-Error-Code` header. `message` is the server's English prose: fine in a
   * log, useless to a visitor on a page that defaults to Vietnamese. Endpoints
   * that can fail in ways a visitor is expected to act on send this so the UI
   * can show its own copy; everything else leaves it undefined and the UI falls
   * back to `message`.
   */
  code?: string;
}
