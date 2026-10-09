"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useRequireAuth } from "@/hooks/use-authentication";
import { isAdminRole } from "@/services/authentication.service";
import { AdminPageLoader } from "../_components/AdminDirectory";
import { SecuritySettings } from "@/app/dashboard/security/_components/SecuritySettings";

// Admin > Security: the signed-in admin manages the protections on their OWN
// account — password, two-factor auth, passkeys, sign-in alerts, sessions.
// The body is the same component /dashboard/security renders, because admins
// are users and the same /auth + /users/me endpoints serve both. Admins only —
// the proxy turns everyone else away, this page redirects as a fallback, and
// the API answers 403.
export default function AdminSecurityClient() {
  const { user, isLoading } = useRequireAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user && !isAdminRole(user.role)) {
      router.replace("/dashboard");
    }
  }, [isLoading, user, router]);

  if (isLoading || !user || !isAdminRole(user.role)) {
    return <AdminPageLoader />;
  }

  // SecuritySettings renders its own title/subtitle (retitled here) plus the
  // protections badge, so no extra header block is needed.
  return (
    <SecuritySettings
      titleKey="admin.security.title"
      subtitleKey="admin.security.subtitle"
    />
  );
}
