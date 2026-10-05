"use client";

import { useState } from "react";

import { AnimatePresence, motion } from "framer-motion";
import { LoginForm } from "@/components/login-form";
import { RegistrationForm } from "@/components/registration-form";
import { VerifyEmailNotice } from "@/components/verify-email-notice";
import { cn } from "@/lib/utils";
import { useTranslations } from "@/lib/i18n";

type Mode = "login" | "register" | "verify";
type Direction = 1 | -1;

const formVariants = {
  initial: (direction: Direction) => ({
    opacity: 0,
    x: direction === 1 ? 100 : -100,
  }),
  animate: {
    opacity: 1,
    x: 0,
  },
  exit: (direction: Direction) => ({
    opacity: 0,
    x: direction === 1 ? -100 : 100,
  }),
};

const formTransition = {
  duration: 0.22,
  ease: "easeOut" as const,
};

interface AuthFormSwitcherProps {
  initialMode: Mode;
}

export function AuthFormSwitcher({ initialMode }: AuthFormSwitcherProps) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [direction, setDirection] = useState<Direction>(1);
  const [isAnimating, setIsAnimating] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const { t, localize } = useTranslations();

  const switchTo = (next: Mode) => {
    if (next === mode || isAnimating) return;

    setDirection(next === "login" ? -1 : 1);
    setIsAnimating(true);
    setMode(next);

    // Keep the URL in sync for login/register (no dedicated route for the
    // post-register verify step — it stays on the current URL). Register is
    // `/login?mode=register`, which the page reads back on a reload; the old
    // value here was "/", so refreshing mid-signup dropped the visitor on the
    // marketing landing page.
    if (next === "login" || next === "register") {
      // Update URL without triggering full Next.js navigation to prevent double animation
      window.history.pushState(
        null,
        "",
        next === "login" ? "/login" : "/login?mode=register",
      );
    }

    // Duration matches transition + a little buffer
    window.setTimeout(() => setIsAnimating(false), 300);
  };

  const handleRegistered = (email: string) => {
    setRegisteredEmail(email);
    switchTo("verify");
  };

  const isLogin = mode === "login";
  const isVerify = mode === "verify";

  return (
    <div className="relative overflow-hidden">
      <AnimatePresence mode="wait" initial={false} custom={direction}>
        <motion.div
          key={mode}
          custom={direction}
          variants={formVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={formTransition}
          className={cn(
            "flex flex-col gap-8",
            isAnimating && "pointer-events-none",
          )}
        >
          {isVerify ? (
            <VerifyEmailNotice
              email={registeredEmail}
              onBackToLogin={() => switchTo("login")}
            />
          ) : (
            <>
              <div className="flex flex-col gap-2">
                <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
                  {isLogin
                    ? t("auth.switcher.welcomeBack")
                    : t("auth.switcher.createAccount")}
                </h1>
                <p className="text-muted-foreground">
                  {isLogin ? (
                    <>
                      {t("auth.switcher.dontHaveAccount")}{" "}
                      {/* A real href, not a bare button. This switch is an
                          in-place animation that rewrites the URL, so a
                          crawler would otherwise see no path at all to the
                          sign-up form — and a reader could not open it in a
                          new tab. The click is intercepted for the normal case
                          and left alone when a modifier key means "new tab". */}
                      <a
                        href={localize("/login?mode=register")}
                        onClick={(event) => {
                          if (
                            event.metaKey ||
                            event.ctrlKey ||
                            event.shiftKey ||
                            event.altKey
                          ) {
                            return;
                          }
                          event.preventDefault();
                          switchTo("register");
                        }}
                        className="text-foreground font-medium underline underline-offset-2 hover:text-accent transition-colors"
                      >
                        {t("auth.switcher.signUp")}
                      </a>
                    </>
                  ) : (
                    <>
                      {t("auth.switcher.alreadyHaveAccount")}{" "}
                      <a
                        href={localize("/login")}
                        onClick={(event) => {
                          if (
                            event.metaKey ||
                            event.ctrlKey ||
                            event.shiftKey ||
                            event.altKey
                          ) {
                            return;
                          }
                          event.preventDefault();
                          switchTo("login");
                        }}
                        className="text-foreground font-medium underline underline-offset-2 hover:text-accent transition-colors"
                      >
                        {t("auth.switcher.signIn")}
                      </a>
                    </>
                  )}
                </p>
              </div>

              {isLogin ? (
                <LoginForm />
              ) : (
                <RegistrationForm onSuccess={handleRegistered} />
              )}
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
