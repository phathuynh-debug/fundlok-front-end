'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ApiError } from '@/lib/types';
import {
  projectsService,
  type CreateProjectPayload,
  type Project,
} from '@/services/projects.service';

export const projectKeys = {
  all: ['projects'] as const,
  mine: () => [...projectKeys.all, 'mine'] as const,
};

export function useMyProjects(enabled = true) {
  return useQuery<Project[], ApiError>({
    queryKey: projectKeys.mine(),
    queryFn: () => projectsService.getMyProjects(),
    staleTime: 2 * 60 * 1000,
    retry: false,
    enabled,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation<Project, ApiError, CreateProjectPayload>({
    mutationFn: (payload) => projectsService.createProject(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.mine() });
    },
  });
}