import axios, {
  type AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
} from 'axios';
import { API_URL } from './endpoints';
import { getStatusMessage } from './status-codes';
import type { ApiError } from './types';

// ---------- Error message extraction ----------
// Handles FastAPI ({ detail: string | PydanticError[] }) and Express-style
// ({ message: string }) error shapes.
function extractMessage(data: unknown): string | undefined {
  if (!data) return undefined;
  if (typeof data === 'string') return data;

  const obj = data as { detail?: unknown; message?: unknown; error?: unknown };

  if (Array.isArray(obj.detail)) {
    const first = obj.detail[0] as { msg?: string; loc?: unknown[] } | undefined;
    if (first?.msg) {
      const field = Array.isArray(first.loc)
        ? first.loc.filter((p) => p !== 'body').join('.')
        : '';
      return field ? `${field}: ${first.msg}` : first.msg;
    }
  }

  if (typeof obj.detail === 'string') return obj.detail;
  if (typeof obj.message === 'string') return obj.message;
  if (typeof obj.error === 'string') return obj.error;

  return undefined;
}

class ApiClient {
  private axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: API_URL,
      headers: { 'Content-Type': 'application/json' },
      timeout: 20000,
      // This is the only thing needed for cookie-based auth.
      // The browser automatically attaches the httpOnly cookie on every
      // request to the same origin — no manual token handling required.
      withCredentials: true,
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    this.axiosInstance.interceptors.response.use(
      (response: AxiosResponse) => response,
      async (error: AxiosError<ApiError>) => {
        const status = error.response?.status;
        const data = error.response?.data as
          | (ApiError & { detail?: unknown })
          | undefined;

        const message =
          extractMessage(data) || getStatusMessage(status) || error.message;
        const details = data?.details;

        return Promise.reject({ message, details, status });
      }
    );
  }

  public async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axiosInstance.get<T>(url, config);
    return response.data;
  }

  public async post<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const finalConfig =
      data instanceof FormData
        ? { ...config, headers: { ...config?.headers, 'Content-Type': undefined } }
        : config;
    const response = await this.axiosInstance.post<T>(url, data, finalConfig);
    return response.data;
  }

  public async put<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.axiosInstance.put<T>(url, data, config);
    return response.data;
  }

  public async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axiosInstance.delete<T>(url, config);
    return response.data;
  }

  public async patch<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.axiosInstance.patch<T>(url, data, config);
    return response.data;
  }
}

export const apiClient = new ApiClient();
export default ApiClient;
