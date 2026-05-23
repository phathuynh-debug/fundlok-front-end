"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { useLogin } from "@/hooks/use-authentication"
import { Mail, Lock, Loader2, Eye, EyeOff } from "lucide-react"
import { useTranslations } from "@/lib/i18n"

export function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  const router = useRouter()
  const { toast } = useToast()
  const { mutate: login, isPending } = useLogin()
  const { t } = useTranslations()

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()

    login(
      { email, password },
      {
        onSuccess: () => {
          toast({
            title: t("auth.login.successTitle"),
            description: t("auth.login.successDescription"),
          })
          router.push("/dashboard")
        },
        onError: (error) => {
          toast({
            variant: "destructive",
            title: t("auth.login.failedTitle"),
            description: error?.message || t("auth.login.failedDescription"),
          })
        },
      }
    )
  }

  return (
    <form onSubmit={handleLogin} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">{t("auth.login.emailLabel")}</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            className="pl-10"
            placeholder={t("auth.login.emailPlaceholder")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isPending}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">{t("auth.login.passwordLabel")}</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            className="px-10"
            placeholder={t("auth.login.passwordPlaceholder")}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isPending}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      <Button type="submit" className="w-full h-11" disabled={isPending}>
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {t("auth.login.submitting")}
          </>
        ) : (
          t("auth.login.submit")
        )}
      </Button>
    </form>
  )
}
