"use client"

import { motion } from "framer-motion"
import { CheckCircle2, Send } from "lucide-react"
import { cn } from "@/lib/utils"
import { useLoanApplicationContext } from "./LoanApplicationContext"

// The animated stepper bar: a progress line with a glowing tip plus a clickable
// node per step (the final node is the review/send step).
export function StepIndicator() {
  const { currentStep, totalSteps, reviewStep, busy, goToStep, stepLabel } =
    useLoanApplicationContext()

  const progress = ((currentStep - 1) / (totalSteps - 1)) * 100

  return (
    <div className="mb-8 pt-2">
      <div className="flex items-center justify-between relative">
        {/* Background connector line (full width, gray) */}
        <div className="absolute top-[18px] left-0 right-0 h-[2px] -translate-y-1/2 pointer-events-none" style={{ zIndex: 1 }}>
          <div className="mx-[18px] h-full bg-border rounded-full" />
        </div>
        {/* Active progress connector line with animated fill + glow */}
        <div className="absolute top-[18px] left-0 right-0 h-[2px] -translate-y-1/2 pointer-events-none" style={{ zIndex: 2 }}>
          <div className="mx-[18px] h-full relative overflow-hidden rounded-full">
            <motion.div
              className="h-full bg-black dark:bg-white absolute left-0 top-0"
              initial={{ width: "0%" }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black/30 dark:bg-white/30 blur-md"
              initial={{ left: "0%" }}
              animate={{ left: `${progress}%` }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            />
          </div>
        </div>

        {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => {
          const isActive = step === currentStep
          const isCompleted = step < currentStep
          const isReviewStep = step === reviewStep
          return (
            <div key={step} className="flex flex-col items-center space-y-2.5 relative" style={{ zIndex: 3 }}>
              <button
                type="button"
                onClick={() => goToStep(step)}
                disabled={busy}
                className={cn(
                  "w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 border-2 bg-background disabled:cursor-not-allowed",
                  isActive
                    ? "bg-black text-white border-black dark:bg-white dark:text-black dark:border-white scale-110 shadow-lg ring-4 ring-black/10 dark:ring-white/10"
                    : isCompleted
                      ? "bg-emerald-500 text-white border-emerald-500 shadow-sm"
                      : "text-muted-foreground border-border hover:border-muted-foreground"
                )}
              >
                {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : isReviewStep ? <Send className="h-4 w-4" /> : step}
              </button>
              <span className={cn(
                "text-[10px] sm:text-xs font-semibold text-center max-w-[80px] sm:max-w-[120px] transition-colors duration-200",
                isActive ? "text-foreground font-bold" : "text-muted-foreground"
              )}>
                {stepLabel(step)}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
