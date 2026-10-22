"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  VERIFICATION_TAB_PARAM,
  isVerificationTabId,
  openVerificationChannel,
  readVerificationMessage,
} from "@/lib/verification-tab";

// How long the approval confirmation stays on screen before moving on.
const CONFIRM_MS = 1200;
// How long to wait for the original tab to acknowledge before assuming it is
// gone (closed, navigated away) and redirecting this tab instead.
const ACK_TIMEOUT_MS = 1500;
// window.close() is refused for tabs the page didn't open; if this tab is
// still here after this long, redirect it rather than leave it stranded.
const CLOSE_GRACE_MS = 500;

// What the KYC/KYB screen does once verification is approved.
//
// Opened as a verification tab (?vtab=<id>, see lib/verification-tab.ts): hand
// the destination to the original tab, then close. Otherwise, or if the
// original tab doesn't answer: go to the destination here with a full load,
// as before (the proxy gated this route on the status it read BEFORE the
// verdict, so it has to re-enter the server rather than reuse router state).
export function useFinishVerification(isApproved: boolean, landing: string) {
  const tabParam = useSearchParams().get(VERIFICATION_TAB_PARAM);
  const tabId = isVerificationTabId(tabParam) ? tabParam : null;

  useEffect(() => {
    if (!isApproved) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    let channel: BroadcastChannel | null = null;
    let finished = false;

    const redirectHere = () => {
      if (finished) return;
      finished = true;
      window.location.replace(landing);
    };

    timers.push(
      setTimeout(() => {
        channel = tabId ? openVerificationChannel() : null;
        if (!tabId || !channel) {
          redirectHere();
          return;
        }
        const ch = channel;
        ch.onmessage = (event) => {
          if (readVerificationMessage(event.data, tabId)?.type !== "ack")
            return;
          ch.close();
          window.close();
          timers.push(setTimeout(redirectHere, CLOSE_GRACE_MS));
        };
        ch.postMessage({ type: "verified", id: tabId, next: landing });
        timers.push(
          setTimeout(() => {
            ch.close();
            redirectHere();
          }, ACK_TIMEOUT_MS),
        );
      }, CONFIRM_MS),
    );

    return () => {
      timers.forEach(clearTimeout);
      channel?.close();
    };
  }, [isApproved, landing, tabId]);
}
