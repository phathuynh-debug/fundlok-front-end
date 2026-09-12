"use client";

import { useMutation } from "@tanstack/react-query";
import type { ApiError } from "@/lib/types";
import {
  contactService,
  type ContactSubmitPayload,
  type ContactSubmitResponse,
} from "@/services/contact.service";

/**
 * Submits the public contact form. Nothing to invalidate — the submission
 * isn't read back anywhere, so there is no cached query it could go stale
 * against.
 */
export function useSubmitContact() {
  return useMutation<ContactSubmitResponse, ApiError, ContactSubmitPayload>({
    mutationFn: (payload) => contactService.submit(payload),
  });
}
