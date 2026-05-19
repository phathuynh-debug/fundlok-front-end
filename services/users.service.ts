import { apiClient } from '@/lib/api-client';
import { USER_ENDPOINTS } from '@/lib/endpoints';
import type { User } from './authentication.service';

// Pure data-access layer for /users endpoints.
export const usersService = {
  // GET /users/me — returns the currently authenticated user
  getCurrentUser() {
    return apiClient.get<User>(USER_ENDPOINTS.me);
  },
};
