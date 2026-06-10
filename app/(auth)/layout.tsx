import type { ReactNode } from "react"
import { AuthLayout } from "@/components/auth-layout"

interface AuthGroupLayoutProps {
  children: ReactNode
}

export default function AuthGroupLayout({ children }: AuthGroupLayoutProps) {
  return <AuthLayout>{children}</AuthLayout>
}
