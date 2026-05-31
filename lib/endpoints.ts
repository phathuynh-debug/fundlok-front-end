// All API calls go through the Next.js proxy at /api/*.
// Next.js rewrites /api/* → http://127.0.0.1:8000/* server-side,
// so the browser only ever talks to localhost:3000 — same origin,
// which means httpOnly cookies are sent automatically on every request.
export const API_URL = "/api";

export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const AUTH_ENDPOINTS = {
  login: "/auth/login",
  register: "/auth/register",
  oauthLogin: "/auth/oauth/login",
  refresh: "/auth/refresh",
  logout: "/auth/logout",
} as const;

export const USER_ENDPOINTS = {
  me: "/users/me",
} as const;

export const PROJECT_ENDPOINTS = {
  list: "/projects",
  create: "/projects",
  public: "/projects/public",
} as const;

export const FILES_ENDPOINTS = {
  presign: "/files/presign",
  commit: (fileId: string) => `/files/${fileId}/commit`,
} as const;
