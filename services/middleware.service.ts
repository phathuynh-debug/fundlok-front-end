import { NextRequest } from "next/server";

const API_BASE_URL =
  process.env.API_URL;

export type CurrentUser = {
  role?: string;
  email_verified?: boolean;
};

export const middlewareService = {
  // Reads the platform maintenance flag from the public maintenance endpoint
  // (GET /system/maintenance — readable without auth so the gate can apply to
  // anonymous visitors). Fails open (returns null) on any error so a backend
  // hiccup never locks the whole site out.
  async getMaintenance() {
    try {
      const response = await fetch(new URL("/system/maintenance", API_BASE_URL), {
        cache: "no-store",
      });

      if (!response.ok) {
        return null;
      }

      return (await response.json()) as { enabled?: boolean };
    } catch {
      return null;
    }
  },

  // Returns the currently authenticated user
  async getCurrentUser(request: NextRequest): Promise<CurrentUser | null> {
    const accessToken = request.cookies.get("access_token")?.value;

    if (!accessToken) {
      return null;
    }

    try {
      const response = await fetch(new URL("/users/me", API_BASE_URL), {
        headers: {
          cookie: request.headers.get("cookie") ?? "",
        },
        cache: "no-store",
      });

      if (!response.ok) {
        return null;
      }

      return (await response.json()) as CurrentUser;
    } catch {
      return null;
    }
  },

  // Reads the user's project count
  async getProjectCount(request: NextRequest): Promise<number | null> {
    try {
      const response = await fetch(new URL("/projects", API_BASE_URL), {
        headers: {
          cookie: request.headers.get("cookie") ?? "",
        },
        cache: "no-store",
      });

      if (!response.ok) {
        return null;
      }

      const data = (await response.json()) as
        | unknown[]
        | { content?: unknown[]; data?: unknown[] };

      if (Array.isArray(data)) {
        return data.length;
      }

      const payload = data as { content?: unknown[]; data?: unknown[] };

      if (Array.isArray(payload.content)) {
        return payload.content.length;
      }

      if (Array.isArray(payload.data)) {
        return payload.data.length;
      }

      return null;
    } catch {
      return null;
    }
  },

  // Reads whether the user's verification is approved. The prefix depends on
  // role: investors do KYC (/kyc/status), SMEs do KYB (/kyb/status); calling the
  // wrong one 403s. 404 means they never started. Fails closed (false) on any
  // error — the gate must not be bypassable, and a backend outage already breaks
  // the app anyway.
  async getVerificationApproved(
    request: NextRequest,
    role?: string,
  ): Promise<boolean> {
    const base = role === "SME" ? "/kyb" : "/kyc"; // INVESTOR (and default) → KYC
    try {
      const response = await fetch(new URL(`${base}/status`, API_BASE_URL), {
        headers: { cookie: request.headers.get("cookie") ?? "" },
        cache: "no-store",
      });

      if (!response.ok) {
        return false;
      }

      const data = (await response.json()) as { is_approved?: boolean };
      return data?.is_approved === true;
    } catch {
      return false;
    }
  },
};
