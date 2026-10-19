import axios, {
  type AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
} from "axios";
import { API_URL } from "./endpoints";
import {
  MFA_REQUIRED,
  SECOND_FACTOR_SETUP_PATH,
  shouldRedirectToSecondFactorSetup,
} from "./second-factor";
import { getStatusMessage } from "./status-codes";
import type { ApiError } from "./types";

// ---------- Error message extraction ----------
// Handles FastAPI ({ detail: string | PydanticError[] }) and Express-style
// ({ message: string }) error shapes.
function extractMessage(data: unknown): string | undefined {
  if (!data) return undefined;
  if (typeof data === "string") return data;

  const obj = data as { detail?: unknown; message?: unknown; error?: unknown };

  if (Array.isArray(obj.detail)) {
    const first = obj.detail[0] as
      { msg?: string; loc?: unknown[] } | undefined;
    if (first?.msg) {
      const field = Array.isArray(first.loc)
        ? first.loc.filter((p) => p !== "body").join(".")
        : "";
      return field ? `${field}: ${first.msg}` : first.msg;
    }
  }

  if (typeof obj.detail === "string") return obj.detail;
  if (typeof obj.message === "string") return obj.message;
  if (typeof obj.error === "string") return obj.error;

  return undefined;
}

const REFRESH_PATH = "/auth/refresh";

/**
 * Endpoints where a 401 is the ANSWER, not an expired session.
 *
 * Retrying a wrong password behind the user's back would double every failed
 * login attempt against the rate limiter and hide the real error.
 */
const NO_REFRESH_PATHS = [
  "/auth/login",
  "/auth/register",
  "/auth/logout",
  "/auth/passkeys/login",
];

class ApiClient {
  private axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: API_URL,
      headers: { "Content-Type": "application/json" },
      timeout: 20000,
      // This is the only thing needed for cookie-based auth.
      // The browser automatically attaches the httpOnly cookie on every
      // request to the same origin — no manual token handling required.
      withCredentials: true,
    });

    this.setupInterceptors();
  }

  /**
   * A refresh already in flight, so concurrent 401s wait for one rotation.
   *
   * Refresh tokens are single-use and rotated server-side: the presented token
   * is revoked and a new pair issued. A dashboard that fires six queries at
   * once would otherwise send six refreshes, five of which present a token the
   * first call already revoked — and reuse detection would reject them, so
   * five of the six requests would fail anyway.
   */
  private refreshInFlight: Promise<void> | null = null;

  private refreshSession(): Promise<void> {
    if (!this.refreshInFlight) {
      // The bare axios instance, not this one: going through the interceptor
      // would make a failing refresh try to refresh itself.
      this.refreshInFlight = axios
        .post(`${API_URL}${REFRESH_PATH}`, undefined, {
          withCredentials: true,
        })
        .then(() => undefined)
        .finally(() => {
          this.refreshInFlight = null;
        });
    }
    return this.refreshInFlight;
  }

  /**
   * Set once the page is on its way to the second-factor setup page, so the
   * burst of refusals from a page's parallel queries navigates only once.
   */
  private redirectingToSecondFactorSetup = false;

  /**
   * Send an admin whose session has no second factor to set one up. Returns
   * whether the page is leaving, i.e. whether the caller should stop here.
   */
  private sendToSecondFactorSetup(): boolean {
    if (typeof window === "undefined") return false;
    if (this.redirectingToSecondFactorSetup) return true;
    if (!shouldRedirectToSecondFactorSetup(window.location.pathname)) {
      return false;
    }
    this.redirectingToSecondFactorSetup = true;
    // replace, not assign: Back would return to a page that cannot load and
    // bounce straight here again.
    window.location.replace(SECOND_FACTOR_SETUP_PATH);
    return true;
  }

  private setupInterceptors() {
    this.axiosInstance.interceptors.response.use(
      (response: AxiosResponse) => response,
      async (error: AxiosError<ApiError>) => {
        const status = error.response?.status;
        const config = error.config as
          (AxiosRequestConfig & { _retried?: boolean }) | undefined;

        // The access token is short-lived (30 minutes) while the refresh token
        // lasts 14 days. Without this the session simply died at the 30-minute
        // mark: every call 401'd and nothing ever called /auth/refresh, which
        // existed but had no caller. Rotate once and replay the request.
        //
        // `_retried` bounds it to a single attempt, so a genuinely
        // unauthenticated caller fails immediately instead of looping.
        if (
          status === 401 &&
          config &&
          !config._retried &&
          !config.url?.includes(REFRESH_PATH) &&
          !NO_REFRESH_PATHS.some((path) => config.url?.includes(path))
        ) {
          config._retried = true;
          try {
            await this.refreshSession();
            return await this.axiosInstance.request(config);
          } catch {
            // Fall through: the refresh token is gone or revoked too, so this
            // really is an expired session rather than a stale access token.
          }
        }

        const data = error.response?.data as
          (ApiError & { detail?: unknown }) | undefined;

        const message =
          extractMessage(data) || getStatusMessage(status) || error.message;
        const details = data?.details;
        // Header rather than body so `detail` stays the plain string every
        // existing caller already reads. See ApiError.code.
        const rawCode = error.response?.headers?.["x-error-code"];
        const code = typeof rawCode === "string" ? rawCode : undefined;

        // An admin whose session was opened without a second factor (see
        // lib/second-factor.ts). The backend refuses almost every call, so
        // the page that made this one cannot work: each query would show its
        // own "could not load" and each mutation its own red toast. Send the
        // admin to set one up instead.
        //
        // The promise never settles. The page is being replaced, and
        // rejecting would flash every error state on the way out. On the
        // setup page itself this rejects as usual, carrying the code, so the
        // page can explain why its calls fail.
        if (
          status === 403 &&
          code === MFA_REQUIRED &&
          this.sendToSecondFactorSetup()
        ) {
          return new Promise<never>(() => {});
        }

        return Promise.reject({ message, details, status, code });
      },
    );
  }

  public async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axiosInstance.get<T>(url, config);
    return response.data;
  }

  public async post<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    const finalConfig =
      data instanceof FormData
        ? {
            ...config,
            headers: { ...config?.headers, "Content-Type": undefined },
          }
        : config;
    const response = await this.axiosInstance.post<T>(url, data, finalConfig);
    return response.data;
  }

  public async put<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
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
    config?: AxiosRequestConfig,
  ): Promise<T> {
    const response = await this.axiosInstance.patch<T>(url, data, config);
    return response.data;
  }
}

export const apiClient = new ApiClient();
export default ApiClient;
