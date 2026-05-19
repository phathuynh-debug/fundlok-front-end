import { apiClient } from '@/lib/api-client';
import { PROJECT_ENDPOINTS } from '@/lib/endpoints';

export interface ProjectAddress {
  street: string;
  city: string;
  state?: string;
  postal_code?: string;
  country: string;
}

export interface Project {
  id: string;
  legal_name: string;
  tax_id: string;
  industry: string;
  address: Record<string, unknown>;
  incorporation_date: string;
  status: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateProjectPayload {
  legal_name: string;
  tax_id: string;
  industry: string;
  incorporation_date: string;
  address: ProjectAddress;
}

export const projectsService = {
  getMyProjects() {
    return apiClient.get<Project[]>(PROJECT_ENDPOINTS.list);
  },

  createProject(payload: CreateProjectPayload) {
    return apiClient.post<Project>(PROJECT_ENDPOINTS.create, payload);
  },
};