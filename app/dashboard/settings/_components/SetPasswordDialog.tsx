"use client"

import { useState } from "react"
import { Eye, EyeOff, Loader2, Lock } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { useSetPassword } from "@/hooks/use-users"
import { PASSWORD_MIN_LENGTH } from "@/services/users.service"

// Sets a FIRST password, for accounts created without one (OAuth sign-in).
// There's no "current password" field because there is no current password —
// changing an existing one goes through /forgot-password instead, where the
// emailed token is the proof. The profile page only opens this dialog when
// `has_password` is false; the backend enforces the same rule.
interface SetPasswordDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  t: (key: string, vars?: Record<string, string | number>) => string
}

export function SetPasswordDialog({
  open,
  onOpenChange,
  t,
}: SetPasswordDialogProps) {
  const { toast } = useToast()
  const setPassword = useSetPassword()

  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPasswords, setShowPasswords] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reset = () => {
    setNewPassword("")
    setConfirmPassword("")
    setShowPasswords(false)
    setError(null)
  }

  const handleOpenChange = (next: boolean) => {
    // Never leave a typed password sitting in state behind a closed dialog.
    if (!next) reset()
    onOpenChange(next)
  }

  const isPending = setPassword.isPending

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (newPassword.length < PASSWORD_MIN_LENGTH) {
      setError(
        t("dashboard.settings.profile.setPasswordDialog.tooShort").replace(
          "{min}",
          String(PASSWORD_MIN_LENGTH)
        )
      )
      return
    }
    if (newPassword !== confirmPassword) {
      setError(t("dashboard.settings.profile.setPasswordDialog.mismatch"))
      return
    }

    setPassword.mutate(
      { new_password: newPassword },
      {
        onSuccess: () => {
          toast({
            title: t("dashboard.settings.profile.setPasswordDialog.successTitle"),
            description: t(
              "dashboard.settings.profile.setPasswordDialog.successDescription"
            ),
          })
          handleOpenChange(false)
        },
        onError: (err) => {
          // Show it inline next to the fields, not only as a toast that
          // disappears while the user is still looking at the form.
          const message =
            err?.message ||
            t("dashboard.settings.profile.setPasswordDialog.failedDescription")
          setError(message)
          toast({
            variant: "destructive",
            title: t("dashboard.settings.profile.setPasswordDialog.failedTitle"),
            description: message,
          })
        },
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {t("dashboard.settings.profile.setPasswordDialog.title")}
          </DialogTitle>
          <DialogDescription>
            {t("dashboard.settings.profile.setPasswordDialog.description")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="new-password">
              {t("dashboard.settings.profile.setPasswordDialog.newLabel")}
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="new-password"
                type={showPasswords ? "text" : "password"}
                className="px-10"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={isPending}
              />
              <button
                type="button"
                onClick={() => setShowPasswords((v) => !v)}
                className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                aria-label={t(
                  showPasswords
                    ? "dashboard.settings.profile.setPasswordDialog.hide"
                    : "dashboard.settings.profile.setPasswordDialog.show"
                )}
              >
                {showPasswords ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              {t("dashboard.settings.profile.setPasswordDialog.hint").replace(
                "{min}",
                String(PASSWORD_MIN_LENGTH)
              )}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password">
              {t("dashboard.settings.profile.setPasswordDialog.confirmLabel")}
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="confirm-password"
                type={showPasswords ? "text" : "password"}
                className="pl-10"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isPending}
              />
            </div>
          </div>

          {error && (
            <p role="alert" className="text-sm font-medium text-destructive">
              {error}
            </p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isPending}
            >
              {t("dashboard.settings.profile.setPasswordDialog.cancel")}
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("dashboard.settings.profile.setPasswordDialog.submitting")}
                </>
              ) : (
                t("dashboard.settings.profile.setPasswordDialog.submit")
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
