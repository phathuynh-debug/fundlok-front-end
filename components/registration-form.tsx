"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { useRegister } from "@/hooks/use-authentication"
import type { UserRole } from "@/services/authentication.service"
import {
  User,
  Mail,
  Lock,
  Phone,
  Building2,
  TrendingUp,
  Check,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react"

type RoleSelection = UserRole | null

interface RegistrationFormProps {
  onSuccess?: () => void
}

export function RegistrationForm({ onSuccess }: RegistrationFormProps) {
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [phone, setPhone] = useState("")
  const [role, setRole] = useState<RoleSelection>(null)
  const [showPassword, setShowPassword] = useState(false)

  const router = useRouter()
  const { toast } = useToast()
  const { mutate: register, isPending } = useRegister()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!role) {
      toast({
        variant: "destructive",
        title: "Configuration Error",
        description: "Please select a user role to proceed.",
      })
      return
    }

    register(
      {
        full_name: fullName,
        email,
        password,
        phone: phone || null,
        role,
      },
      {
        onSuccess: () => {
          toast({
            title: "Registration Successful",
            description: "Your account is ready. Please sign in to continue.",
          })
          // Use the switcher callback if available, otherwise navigate
          if (onSuccess) {
            setTimeout(() => onSuccess(), 1200)
          } else {
            setTimeout(() => router.push("/login"), 1200)
          }
        },
        onError: (error) => {
          toast({
            variant: "destructive",
            title: "Registration Failed",
            description:
              error?.message ||
              "Please check your information and try again.",
          })
        },
      }
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="fullName">Full Name</Label>
        <div className="relative">
          <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="fullName"
            type="text"
            placeholder="Nguyen Van A"
            className="pl-10"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            disabled={isPending}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email address</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            placeholder="founder@company.com"
            className="pl-10"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isPending}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Phone number</Label>
        <div className="relative">
          <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="phone"
            type="tel"
            placeholder="09xx xxx xxx"
            className="pl-10"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={isPending}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            className="px-10"
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

      <div className="space-y-3">
        <Label>Select your account type</Label>
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setRole("SME")}
            disabled={isPending}
            className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
              role === "SME"
                ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                : "border-muted"
            }`}
          >
            {role === "SME" && (
              <Check className="absolute top-2 right-2 h-4 w-4 text-primary" />
            )}
            <Building2
              className={role === "SME" ? "text-primary" : "text-muted-foreground"}
            />
            <span className="font-semibold text-sm">SME</span>
          </button>

          <button
            type="button"
            onClick={() => setRole("INVESTOR")}
            disabled={isPending}
            className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
              role === "INVESTOR"
                ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                : "border-muted"
            }`}
          >
            {role === "INVESTOR" && (
              <Check className="absolute top-2 right-2 h-4 w-4 text-primary" />
            )}
            <TrendingUp
              className={
                role === "INVESTOR" ? "text-primary" : "text-muted-foreground"
              }
            />
            <span className="font-semibold text-sm">Investor</span>
          </button>
        </div>
      </div>

      <Button
        type="submit"
        disabled={isPending || !email || !password || !role || !fullName}
        className="w-full h-12 text-base font-medium"
      >
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isPending ? "Creating account..." : "Create account"}
      </Button>
    </form>
  )
}
