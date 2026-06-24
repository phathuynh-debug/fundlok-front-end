import { apiClient } from '@/lib/api-client';
import { USER_ENDPOINTS } from '@/lib/endpoints';
import { uploadsService } from '@/services/uploads.service';
import type { SelectableRole, User } from './authentication.service';

// Mirrors backend AvatarPresignRequest / AvatarPresignResponse.
export interface AvatarPresignRequest {
  filename: string;
  content_type: string;
  size: number;
}

export interface AvatarPresignResponse {
  file_key: string;
  upload_url: string;
  expires_in: number;
}

export interface AvatarConfirmRequest {
  file_key: string;
}

// Mirrors backend UserUpdateRequest (PATCH /users/me). Only editable fields.
export interface UpdateProfileRequest {
  full_name?: string;
  phone?: string | null;
  bio?: string | null;
}

// Mirrors backend RoleSelectRequest (PATCH /users/me/role).
export interface RoleSelectRequest {
  role: SelectableRole;
}

// Same three-step flow as the loan document upload:
// presign → direct PUT to R2 → confirm. The file never touches the API server.
export const AVATAR_RULES = {
  // Browser-reported MIME types we accept; the R2 PUT reuses file.type verbatim.
  contentTypes: ['image/jpeg', 'image/png', 'image/webp'] as const,
  maxSizeMb: 5,
};

// Pure data-access layer for /users endpoints.
export const usersService = {
  // GET /users/me — returns the currently authenticated user
  getCurrentUser() {
    return apiClient.get<User>(USER_ENDPOINTS.me);
  },

  // PATCH /users/me — returns the refreshed user (user_me_payload).
  updateProfile(payload: UpdateProfileRequest) {
    return apiClient.patch<User>(USER_ENDPOINTS.me, payload);
  },

  // PATCH /users/me/role — sets the role for a user that doesn't have one yet.
  // Returns the refreshed user (user_me_payload) with the chosen role.
  selectRole(role: SelectableRole) {
    return apiClient.patch<User>(USER_ENDPOINTS.selectRole, { role });
  },

  presignAvatar(payload: AvatarPresignRequest) {
    return apiClient.post<AvatarPresignResponse>(
      USER_ENDPOINTS.avatarPresign,
      payload
    );
  },

  // Returns the refreshed user (user_me_payload) with the new avatar.
  confirmAvatar(payload: AvatarConfirmRequest) {
    return apiClient.post<User>(USER_ENDPOINTS.avatarConfirm, payload);
  },

  // presign + PUT + confirm. Re-running overwrites the same object.
  async uploadAvatar(params: {
    file: File;
    onProgress?: (percent: number) => void;
  }): Promise<User> {
    const { file, onProgress } = params;
    const contentType = file.type || 'application/octet-stream';

    const presign = await this.presignAvatar({
      filename: file.name,
      content_type: contentType,
      size: file.size,
    });

    // upload_url expires quickly — use it immediately. The Content-Type must
    // match the one sent to presign or R2 rejects with 403.
    await uploadsService.uploadToStorage(
      presign.upload_url,
      file,
      contentType,
      onProgress
    );

    return this.confirmAvatar({ file_key: presign.file_key });
  },
};
