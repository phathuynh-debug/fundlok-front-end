"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Shield, Zap, Users } from "lucide-react"
import type { ReactNode } from "react"

interface AuthLayoutProps {
  children: ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="min-h-screen flex"
    >
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.05)_0%,transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(255,255,255,0.03)_0%,transparent_40%)]" />

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <div>
            <Link href="/" className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-lg bg-accent flex items-center justify-center">
                <span className="text-accent-foreground font-bold text-lg">F</span>
              </div>
              <span className="text-2xl font-bold text-primary-foreground">FundLok</span>
            </Link>
          </div>

          <div className="flex flex-col gap-8 max-w-lg">
            <h1 className="text-4xl xl:text-5xl font-bold text-primary-foreground leading-tight text-balance">
              Connecting businesses with the right investors
            </h1>
            <p className="text-lg text-primary-foreground/70 leading-relaxed">
              Join thousands of SMEs and investors on our secure platform designed for smarter funding decisions.
            </p>

            <div className="flex flex-col gap-4 pt-4">
              <Feature
                icon={<Shield className="h-5 w-5 text-accent" />}
                title="Bank-grade security"
                subtitle="Your data is encrypted and protected"
              />
              <Feature
                icon={<Zap className="h-5 w-5 text-accent" />}
                title="Fast funding process"
                subtitle="Get matched within days, not months"
              />
              <Feature
                icon={<Users className="h-5 w-5 text-accent" />}
                title="Trusted network"
                subtitle="Verified SMEs and accredited investors"
              />
            </div>
          </div>

          <div className="text-sm text-primary-foreground/50">
            © 2026 FundLok. All rights reserved.
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex flex-col">
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between p-6 border-b border-border">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-accent flex items-center justify-center">
              <span className="text-accent-foreground font-bold">F</span>
            </div>
            <span className="text-xl font-bold text-foreground">FundLok</span>
          </Link>
        </header>

        {/* Form slot */}
        <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
          <div className="w-full max-w-md">{children}</div>
        </div>

        {/* Desktop Footer */}
        <div className="hidden lg:flex items-center justify-center p-6 border-t border-border">
          <p className="text-sm text-muted-foreground">
            Need help?{" "}
            <Link
              href="#"
              className="text-foreground font-medium underline underline-offset-2 hover:text-accent transition-colors"
            >
              Contact support
            </Link>
          </p>
        </div>
      </div>
    </motion.div>
  )
}

function Feature({
  icon,
  title,
  subtitle,
}: {
  icon: ReactNode
  title: string
  subtitle: string
}) {
  return (
    <div className="flex items-center gap-4">
      <div className="h-10 w-10 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div>
        <p className="font-medium text-primary-foreground">{title}</p>
        <p className="text-sm text-primary-foreground/60">{subtitle}</p>
      </div>
    </div>
  )
}
