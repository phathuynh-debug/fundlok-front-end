"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Building2, TrendingUp, Loader2, ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { useToast } from "@/hooks/use-toast";
import { useSelectRole } from "@/hooks/use-authentication";
import { useTranslations } from "@/lib/i18n";
import type { SelectableRole } from "@/services/authentication.service";

// Stagger children so the heading and cards cascade in instead of popping.
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 260, damping: 24 } as const,
  },
};

export function SelectRoleClient() {
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useTranslations();
  const { mutate: selectRole } = useSelectRole();
  // The chosen role; once set we swap the cards for the onboarding loader.
  const [selectedRole, setSelectedRole] = useState<SelectableRole | null>(null);

  const handleSelect = (role: SelectableRole) => {
    setSelectedRole(role);
    selectRole(role, {
      onSuccess: () => {
        toast({
          title: t("auth.selectRole.successTitle"),
          description: t("auth.selectRole.successDescription"),
        });
        // Identity verification is the next onboarding step (middleware also
        // enforces this); SME/Investor branching happens after KYC approval.
        router.push("/kyc");
      },
      onError: (error) => {
        // Drop back to the cards so the user can retry.
        setSelectedRole(null);
        toast({
          variant: "destructive",
          title: t("auth.selectRole.failedTitle"),
          description: error?.message || t("auth.selectRole.failedDescription"),
        });
      },
    });
  };

  const cards: Array<{
    role: SelectableRole;
    icon: typeof Building2;
    title: string;
    description: string;
  }> = [
    {
      role: "SME",
      icon: Building2,
      title: t("auth.selectRole.smeTitle"),
      description: t("auth.selectRole.smeDescription"),
    },
    {
      role: "INVESTOR",
      icon: TrendingUp,
      title: t("auth.selectRole.investorTitle"),
      description: t("auth.selectRole.investorDescription"),
    },
  ];

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-muted/50 p-6">
      {/* Decorative background — keeps the page from feeling empty. Purely
          visual, so it's hidden from assistive tech and ignores pointer events. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Faint dot grid */}
        <div
          className="absolute inset-0 opacity-[0.4]"
          style={{
            backgroundImage:
              "radial-gradient(circle, hsl(var(--muted-foreground) / 0.18) 1px, transparent 1px)",
            backgroundSize: "26px 26px",
            maskImage:
              "radial-gradient(ellipse 80% 70% at 50% 40%, black 40%, transparent 100%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 80% 70% at 50% 40%, black 40%, transparent 100%)",
          }}
        />
        {/* Soft floating colour blobs */}
        <motion.div
          className="absolute -left-24 -top-24 h-[28rem] w-[28rem] rounded-full bg-primary/15 blur-3xl"
          animate={{ x: [0, 40, 0], y: [0, 30, 0], scale: [1, 1.08, 1] }}
          transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -bottom-32 -right-24 h-[32rem] w-[32rem] rounded-full bg-emerald-500/10 blur-3xl"
          animate={{ x: [0, -50, 0], y: [0, -30, 0], scale: [1, 1.12, 1] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute left-1/2 top-1/3 h-72 w-72 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl"
          animate={{ y: [0, 40, 0], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="relative z-10 w-full max-w-5xl">
        <AnimatePresence mode="wait">
          {selectedRole ? (
            // --- Onboarding loader ---
            <motion.div
              key="onboarding"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="flex flex-col items-center justify-center gap-8 py-24 text-center"
            >
              <motion.div
                className="relative flex h-24 w-24 items-center justify-center"
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 18 }}
              >
                <motion.span
                  className="absolute inset-0 rounded-full bg-primary/10"
                  animate={{ scale: [1, 1.25, 1], opacity: [0.6, 0.2, 0.6] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                />
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
              </motion.div>

              <div className="space-y-3">
                <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                  {t("auth.selectRole.onboardingTitle")}
                </h1>
                <p className="mx-auto max-w-md text-muted-foreground">
                  {t("auth.selectRole.onboardingSubtitle")}
                </p>
              </div>
            </motion.div>
          ) : (
            // --- Role selection ---
            <motion.div
              key="selection"
              variants={containerVariants}
              initial="hidden"
              animate="show"
              exit={{ opacity: 0, y: -16, transition: { duration: 0.2 } }}
              className="space-y-12"
            >
              <motion.div variants={itemVariants} className="flex justify-end">
                <LocaleSwitcher />
              </motion.div>

              <motion.div variants={itemVariants} className="space-y-4 text-center">
                <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
                  {t("auth.selectRole.title")}
                </h1>
                <p className="mx-auto max-w-xl text-base text-muted-foreground md:text-lg">
                  {t("auth.selectRole.subtitle")}
                </p>
              </motion.div>

              <div className="grid gap-8 md:grid-cols-2">
                {cards.map(({ role, icon: Icon, title, description }) => (
                  <motion.div
                    key={role}
                    variants={itemVariants}
                    whileHover={{ y: -6, scale: 1.02 }}
                    whileTap={{ scale: 0.99 }}
                    transition={{ type: "spring", stiffness: 320, damping: 22 }}
                    className="group flex flex-col items-center gap-5 rounded-3xl border border-border bg-card text-card-foreground p-10 text-center shadow-sm transition-colors hover:border-primary/50 hover:shadow-xl"
                  >
                    <motion.div
                      whileHover={{ rotate: -6, scale: 1.08 }}
                      transition={{ type: "spring", stiffness: 300, damping: 15 }}
                      className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground"
                    >
                      <Icon className="h-9 w-9" />
                    </motion.div>

                    <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
                    <p className="flex-1 text-base leading-relaxed text-muted-foreground">
                      {description}
                    </p>

                    <Button
                      type="button"
                      onClick={() => handleSelect(role)}
                      className="group/btn h-12 w-full text-base font-medium"
                    >
                      {t("auth.selectRole.select")}
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                    </Button>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
