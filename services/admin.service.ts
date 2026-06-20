import { apiClient } from '@/lib/api-client';
import { ADMIN_ENDPOINTS } from '@/lib/endpoints';

// Which table the BFF /admin/overview endpoint should return alongside stats.
export type AdminMode = 'users' | 'projects';

// Mirrors backend get_stats().
// The *_by_* maps only contain keys that exist in the DB — a bucket with zero
// rows is absent, not 0. Read defensively (map[key] ?? 0); never assume keys.
export interface AdminStats {
  total_users: number;
  total_projects: number;
  users_by_role: Record<string, number>;
  users_by_status: Record<string, number>;
  projects_by_status: Record<string, number>;
}

// A row in the users table (mode=users).
export interface AdminUserRow {
  id: string;
  email: string;
  full_name: string;
  role: string;
  status: string;
  email_verified?: boolean;
  avatar_url?: string | null;
  created_at?: string | null;
}

// A row in the projects table (mode=projects).
export interface AdminProjectRow {
  id: string;
  legal_name: string;
  industry: string;
  status: string;
  created_at?: string | null;
}

export type AdminTableRow = AdminUserRow | AdminProjectRow;

// Paginated table envelope. `items` holds the rows; the rest drives paging.
export interface AdminTable<T = AdminTableRow> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

// One-shot BFF payload: stats + whichever table was requested.
export interface AdminOverview {
  stats: AdminStats;
  mode: AdminMode;
  table: AdminTable;
}

export interface AdminOverviewParams {
  mode?: AdminMode;
  page?: number;
  page_size?: number;
  search?: string | null;
  status?: string | null;
  role?: string | null;
}

export const adminService = {
  // Admin only — backend returns 403 for non-ADMIN, 401 when unauthenticated.
  getOverview(params: AdminOverviewParams = {}) {
    return apiClient.get<AdminOverview>(ADMIN_ENDPOINTS.overview, { params });
  },
};
