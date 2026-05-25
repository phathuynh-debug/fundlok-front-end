"use client"

import { useState } from "react"

import { AnimatePresence, motion } from "framer-motion"
import { LoginForm } from "@/components/login-form"
import { RegistrationForm } from "@/components/registration-form"
import { cn } from "@/lib/utils"
import { useTranslations } from "@/lib/i18n"

type Mode = "login" | "register"
type Direction = 1 | -1

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
}

const formTransition = {
  duration: 0.22,
  ease: "easeOut" as const,
}

interface AuthFormSwitcherProps {
  initialMode: Mode
}

export function AuthFormSwitcher({ initialMode }: AuthFormSwitcherProps) {

  const [mode, setMode] = useState<Mode>(initialMode)
  const [direction, setDirection] = useState<Direction>(1)
  const [isAnimating, setIsAnimating] = useState(false)
  const { t } = useTranslations()

  const switchTo = (next: Mode) => {
    if (next === mode || isAnimating) return

    setDirection(next === "register" ? 1 : -1)
    setIsAnimating(true)
    setMode(next)
    
    // Update URL without triggering full Next.js navigation to prevent double animation
    window.history.pushState(null, '', next === "login" ? "/login" : "/register")
    
    // Duration matches transition + a little buffer
    window.setTimeout(() => setIsAnimating(false), 300)
  }

  const isLogin = mode === "login"

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
          className={cn("flex flex-col gap-8", isAnimating && "pointer-events-none")}
        >
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl lg:text-3xl font-bold text-foreground">
              {isLogin ? t("auth.switcher.welcomeBack") : t("auth.switcher.createAccount")}
            </h2>
            <p className="text-muted-foreground">
              {isLogin ? (
                <>
                  {t("auth.switcher.dontHaveAccount")} {" "}
                  <button
                    type="button"
                    onClick={() => switchTo("register")}
                    className="text-foreground font-medium underline underline-offset-2 hover:text-accent transition-colors"
                  >
                    {t("auth.switcher.signUp")}
                  </button>
                </>
              ) : (
                <>
                  {t("auth.switcher.alreadyHaveAccount")} {" "}
                  <button
                    type="button"
                    onClick={() => switchTo("login")}
                    className="text-foreground font-medium underline underline-offset-2 hover:text-accent transition-colors"
                  >
                    {t("auth.switcher.signIn")}
                  </button>
                </>
              )}
            </p>
          </div>

          {isLogin ? (
            <LoginForm />
          ) : (
            <RegistrationForm onSuccess={() => switchTo("login")} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
