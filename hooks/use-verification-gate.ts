"use client";

import { useCallback, useEffect, useRef } from "react";
import { useCurrentUser } from "@/hooks/use-authentication";
import { useGVerifyKybStatus, useGVerifyStatus } from "@/hooks/use-gverify";
import { useToast } from "@/hooks/use-toast";
import { useTranslations } from "@/lib/i18n";
import {
  newVerificationTabId,
  openVerificationChannel,
  readVerificationMessage,
  verificationUrl,
} from "@/lib/verification-tab";

// Routes behind a verification gate, per role. Mirrors proxy.ts
// (INVESTOR_KYC_ROUTES / SME_KYB_ROUTES), which stays the real enforcement:
// this hook only decides whether to open verification in a new tab first.
const GATED: Record<string, { routes: string[]; kind: "KYC" | "KYB" }> = {
  INVESTOR: { routes: ["/dashboard/invest"], kind: "KYC" },
  SME: { routes: ["/project-application"], kind: "KYB" },
};

// window.open target name shared by every verification tab.
const VERIFICATION_WINDOW = "fundlok-verification";

function pathOf(target: string): string {
  return target.split(/[?#]/)[0];
}

// Opens KYC/KYB in a new tab for a gated action, and brings this tab to the
// action's page once the other tab reports approval. When the verification
// status isn't known yet, or the action isn't gated for this user, callers
// navigate as usual and the proxy's redirect remains the backstop.
export function useVerificationGate() {
  const { t } = useTranslations();
  const { toast } = useToast();
  const { data: user } = useCurrentUser();
  const gate = user?.role ? GATED[user.role] : undefined;
  const { data: kyc } = useGVerifyStatus({ enabled: gate?.kind === "KYC" });
  const { data: kyb } = useGVerifyKybStatus(gate?.kind === "KYB");
  const status =
    gate?.kind === "KYC" ? kyc : gate?.kind === "KYB" ? kyb : undefined;

  // One listener at a time; closed on unmount or when a new one starts.
  const channelRef = useRef<BroadcastChannel | null>(null);
  useEffect(() => () => channelRef.current?.close(), []);

  const needsVerification = useCallback(
    (target: string) => {
      if (!gate || !status) return false;
      const path = pathOf(target);
      const gated = gate.routes.some(
        (route) => path === route || path.startsWith(`${route}/`),
      );
      return gated && !status.is_approved;
    },
    [gate, status],
  );

  // Must run inside the user's click/submit handler, or the browser blocks
  // the new tab.
  const openVerification = useCallback(
    (target: string) => {
      const id = newVerificationTabId();
      // A fixed window name, not "_blank": pressing the action again reuses
      // (and focuses) the verification tab already open instead of stacking
      // a second one. The listener below is replaced along with its id.
      const tab = window.open(verificationUrl(target, id), VERIFICATION_WINDOW);
      if (!tab) {
        // Popup blocked: verify in this tab, exactly as before.
        window.location.assign(verificationUrl(target));
        return;
      }
      tab.focus();
      toast({
        title: t("kyc.newTab.title"),
        description: t("kyc.newTab.description"),
      });

      channelRef.current?.close();
      const channel = openVerificationChannel();
      channelRef.current = channel;
      if (!channel) return; // the verification tab redirects itself instead
      channel.onmessage = (event) => {
        const msg = readVerificationMessage(event.data, id);
        if (msg?.type !== "verified") return;
        channel.postMessage({ type: "ack", id });
        channel.close();
        channelRef.current = null;
        // A full load, not a client navigation: the proxy must re-read the
        // verification status it answered "not approved" to before.
        window.location.assign(msg.next);
      };
    },
    [t, toast],
  );

  // Convenience for handlers: verify in a new tab if needed, else navigate.
  const proceed = useCallback(
    (target: string, navigate: () => void) => {
      if (needsVerification(target)) openVerification(target);
      else navigate();
    },
    [needsVerification, openVerification],
  );

  return { needsVerification, openVerification, proceed };
}
