"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Mail, RefreshCw, LogOut, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCurrentUser, useLogout } from "@/hooks/use-authentication";
import { useToast } from "@/hooks/use-toast";
import { useTranslations } from "@/lib/i18n";
import { useRouter, useSearchParams } from "next/navigation";
import { authenticationService } from "@/services/authentication.service";
import type { ApiError } from "@/lib/types";

export function VerifyEmailClient() {
  const { data: user, refetch } = useCurrentUser();
  const { mutate: logout } = useLogout();
  const { toast } = useToast();
  const { t } = useTranslations();
  const router = useRouter();
  // The token check must run once per token, not again when the language
  // changes (a consumed token would then fail), so the effect reads the
  // current translator through a ref instead of depending on `t`.
  const tRef = useRef(t);
  useEffect(() => {
    tRef.current = t;
  }, [t]);

  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [isVerifyingToken, setIsVerifyingToken] = useState(!!token);
  const [verificationError, setVerificationError] = useState<string | null>(
    null,
  );
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isResending, setIsResending] = useState(false);

  // Automatically verify when token is present in search parameters
  useEffect(() => {
    if (token) {
      const verifyToken = async () => {
        setIsVerifyingToken(true);
        setVerificationError(null);
        try {
          await authenticationService.verifyEmail(token);
          toast({
            title: tRef.current("common.success"),
            description: tRef.current("auth.verifyEmail.verifiedToast"),
          });
          // Refetch current user to update cache
          const { data: verifiedUser } = await refetch();
          // The link is usually opened from a mail client with no session, so
          // /dashboard would only bounce back to /login. Send those users
          // straight there; already-signed-in users continue to the app.
          router.push(verifiedUser ? "/dashboard" : "/login");
        } catch (err) {
          // apiClient's interceptor flattens the axios error to
          // { message, details, status }. The backend's message is English
          // only, so a 4xx (bad, used or expired token) gets our own localized
          // explanation; anything else (5xx, network) gets a localized
          // "try again" rather than raw server text.
          const status = (err as ApiError)?.status;
          // Stored as a key so the message follows a later language switch.
          const errKey =
            status && status >= 400 && status < 500
              ? "auth.verifyEmail.invalidLink"
              : "auth.verifyEmail.verifyFailedGeneric";
          setVerificationError(errKey);
          toast({
            variant: "destructive",
            title: tRef.current("auth.verifyEmail.failedTitle"),
            description: tRef.current(errKey),
          });
        } finally {
          setIsVerifyingToken(false);
        }
      };
      verifyToken();
    }
  }, [token, router, refetch, toast]);

  const handleCheckStatus = async () => {
    setIsRefreshing(true);
    try {
      const { data } = await refetch();
      if (data?.email_verified) {
        toast({
          title: t("auth.verifyEmail.verifiedTitle"),
          description: t("auth.verifyEmail.verifiedRedirect"),
        });
        router.push("/dashboard");
      } else {
        toast({
          variant: "destructive",
          title: t("auth.verifyEmail.pendingTitle"),
          description: t("auth.verifyEmail.pendingDescription"),
        });
      }
    } catch {
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: t("auth.verifyEmail.checkStatusFailed"),
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleResend = async () => {
    if (!user?.email) {
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: t("auth.verifyEmail.emailNotFound"),
      });
      return;
    }

    setIsResending(true);
    try {
      await authenticationService.resendVerification(user.email);
      toast({
        title: t("auth.verifyEmail.resendSuccess"),
        description: t("auth.verifyEmail.resendSuccessDescription"),
      });
    } catch {
      // The backend's reason is English only; show our localized message.
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: t("auth.verifyEmail.resendFailed"),
      });
    } finally {
      setIsResending(false);
    }
  };

  if (isVerifyingToken) {
    return (
      <div className="flex flex-col items-center justify-center space-y-6 text-center py-8">
        <Loader2 className="h-12 w-12 text-emerald-500 animate-spin" />
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-foreground">
            {t("auth.verifyEmail.verifyingTitle")}
          </h3>
          <p className="text-sm text-muted-foreground">
            {t("auth.verifyEmail.verifyingDescription")}
          </p>
        </div>
      </div>
    );
  }

  if (verificationError) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 border border-red-500/20">
            <XCircle className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">
            {t("auth.verifyEmail.failedTitle")}
          </h2>
          <p className="text-muted-foreground text-sm max-w-sm leading-relaxed">
            {t(verificationError)}
          </p>
        </div>
        <div className="space-y-3 pt-4">
          <Button
            onClick={() => setVerificationError(null)}
            className="w-full h-11"
          >
            {t("auth.verifyEmail.backToOptions")}
          </Button>
          <Button
            onClick={() => logout()}
            variant="ghost"
            className="w-full h-11 text-red-500 hover:text-red-600 hover:bg-red-50/50 dark:hover:bg-red-950/10"
          >
            <LogOut className="mr-2 h-4 w-4" />
            {t("auth.verifyEmail.logoutBtn")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center text-center space-y-4">
        {/* Animated mail icon */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            type: "spring",
            stiffness: 260,
            damping: 20,
            delay: 0.1,
          }}
          className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20"
        >
          <Mail className="h-8 w-8" />
        </motion.div>

        <h2 className="text-2xl lg:text-3xl font-bold text-foreground">
          {t("auth.verifyEmail.title")}
        </h2>

        <p className="text-muted-foreground text-sm lg:text-base max-w-sm leading-relaxed">
          {t("auth.verifyEmail.description")}
        </p>

        {user?.email && (
          <div className="inline-flex max-w-full items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-900 border border-border text-xs lg:text-sm text-slate-700 dark:text-slate-300">
            <span className="font-semibold text-muted-foreground">
              {t("auth.verifyEmail.statusLabel")}:
            </span>
            <span className="min-w-0 break-all">{user.email}</span>
          </div>
        )}
      </div>

      <div className="space-y-3 pt-4">
        {/* Refresh status button */}
        <Button
          onClick={handleCheckStatus}
          disabled={isRefreshing}
          className="w-full h-11"
        >
          {isRefreshing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t("common.processing")}
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              {t("auth.verifyEmail.checkStatus")}
            </>
          )}
        </Button>

        {/* Resend verification button */}
        <Button
          onClick={handleResend}
          disabled={isResending || isRefreshing || !user?.email}
          variant="outline"
          className="w-full h-11"
        >
          {isResending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t("common.processing")}
            </>
          ) : (
            t("auth.verifyEmail.resendBtn")
          )}
        </Button>

        {/* Sign out / Logout */}
        <Button
          onClick={() => logout()}
          variant="ghost"
          className="w-full h-11 text-red-500 hover:text-red-600 hover:bg-red-50/50 dark:hover:bg-red-950/10"
        >
          <LogOut className="mr-2 h-4 w-4" />
          {t("auth.verifyEmail.logoutBtn")}
        </Button>
      </div>
    </div>
  );
}
