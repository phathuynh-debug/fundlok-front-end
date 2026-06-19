"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
    User,
    Pencil,
    BadgeCheck,
    Shield,
    Monitor,
    KeyRound,
    Camera,
    Loader2,
    Check,
    X,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useCurrentUser } from "@/hooks/use-authentication"
import { useUpdateProfile } from "@/hooks/use-users"
import { useToast } from "@/hooks/use-toast"
import { useTranslations } from "@/lib/i18n"
import { getInitials } from "@/lib/utils"
import { AvatarUploadDialog } from "../_components/AvatarUploadDialog"
import { profileFormSchema, type ProfileFormValues } from "./form-schema"

// Best-effort browser name from the UA string — purely cosmetic for the UI mock.
function detectBrowser(): string {
    if (typeof navigator === "undefined") return "—"
    const ua = navigator.userAgent
    if (/Edg\//.test(ua)) return "Edge"
    if (/OPR\//.test(ua)) return "Opera"
    if (/Chrome\//.test(ua)) return "Chrome"
    if (/Firefox\//.test(ua)) return "Firefox"
    if (/Safari\//.test(ua)) return "Safari"
    return "—"
}

export default function ProfilePage() {
    const { data: user } = useCurrentUser()
    const { t, locale } = useTranslations()
    const { toast } = useToast()
    const updateProfile = useUpdateProfile()

    const [avatarOpen, setAvatarOpen] = useState(false)
    const [isEditing, setIsEditing] = useState(false)

    // Client-only read; server renders "—" so suppress the hydration diff below.
    const browser = detectBrowser()
    const emailVerified = user?.email_verified ?? false
    const avatarInitials = getInitials(user?.full_name)

    // Member Since — formatted from the user's created_at timestamp.
    const memberSince = user?.created_at
        ? new Date(user.created_at).toLocaleDateString(locale, {
            year: "numeric",
            month: "long",
            day: "numeric",
        })
        : "—"

    // --- Edit form (full_name + phone + bio via PATCH /users/me) ---
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<ProfileFormValues>({
        resolver: zodResolver(profileFormSchema(t)),
        defaultValues: { full_name: "", phone: "", bio: "" },
    })

    const isSaving = updateProfile.isPending

    const startEditing = () => {
        // Seed the form with the current values, then switch to edit mode.
        reset({
            full_name: user?.full_name ?? "",
            phone: user?.phone ?? "",
            bio: user?.bio ?? "",
        })
        setIsEditing(true)
    }

    const onSubmit = (values: ProfileFormValues) => {
        updateProfile.mutate(
            {
                full_name: values.full_name,
                phone: values.phone || null,
                bio: values.bio || null,
            },
            {
                onSuccess: () => {
                    setIsEditing(false)
                    toast({
                        title: t("dashboard.settings.profile.updatedTitle"),
                        description: t("dashboard.settings.profile.updatedDescription"),
                    })
                },
                onError: (error) => {
                    toast({
                        variant: "destructive",
                        title: t("dashboard.settings.profile.updateFailedTitle"),
                        description:
                            error?.message ||
                            t("dashboard.settings.profile.updateFailedDescription"),
                    })
                },
            }
        )
    }

    return (
        <div className="space-y-6 md:space-y-8">
            {/* Page header */}
            <header>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">
                    {t("dashboard.settings.profile.title")}
                </h1>
                <p className="mt-1.5 text-sm text-muted-foreground">
                    {t("dashboard.settings.profile.subtitle")}
                </p>
            </header>

            {/* Personal Information */}
            <Card className="p-6 md:p-8">
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="mb-6 flex items-center justify-between gap-4">
                        <h2 className="flex items-center gap-2.5 text-lg font-semibold text-foreground">
                            <User className="h-5 w-5 text-primary" />
                            {t("dashboard.settings.profile.personalInformation")}
                        </h2>
                        {isEditing ? (
                            <div className="flex shrink-0 items-center gap-2">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="gap-2"
                                    disabled={isSaving}
                                    onClick={() => setIsEditing(false)}
                                >
                                    <X className="h-3.5 w-3.5" />
                                    <span className="hidden sm:inline">
                                        {t("dashboard.settings.profile.cancel")}
                                    </span>
                                </Button>
                                <Button type="submit" size="sm" className="gap-2" disabled={isSaving}>
                                    {isSaving ? (
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                        <Check className="h-3.5 w-3.5" />
                                    )}
                                    <span className="hidden sm:inline">
                                        {isSaving
                                            ? t("dashboard.settings.profile.saving")
                                            : t("dashboard.settings.profile.save")}
                                    </span>
                                </Button>
                            </div>
                        ) : (
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="gap-2 shrink-0"
                                onClick={startEditing}
                            >
                                <Pencil className="h-3.5 w-3.5" />
                                <span className="hidden sm:inline">
                                    {t("dashboard.settings.profile.editProfile")}
                                </span>
                            </Button>
                        )}
                    </div>

                    <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
                        {/* Avatar — click to open the upload dialog */}
                        <div className="flex justify-center lg:block">
                            <button
                                type="button"
                                onClick={() => setAvatarOpen(true)}
                                className="group relative rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                aria-label={t("dashboard.settings.profile.avatar.title")}
                            >
                                <Avatar className="h-28 w-28 ring-2 ring-border transition-opacity group-hover:opacity-90">
                                    <AvatarImage src={user?.avatar_url ?? undefined} alt={user?.full_name ?? ""} />
                                    <AvatarFallback className="bg-primary/10 text-2xl font-semibold text-primary">
                                        {avatarInitials}
                                    </AvatarFallback>
                                </Avatar>
                                <span className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-primary text-primary-foreground shadow-sm transition-transform group-hover:scale-110">
                                    <Camera className="h-4 w-4" />
                                </span>
                            </button>
                        </div>

                        {/* Fields */}
                        <div className="flex-1 space-y-5">
                            <div className="grid gap-5 sm:grid-cols-2">
                                <div className="space-y-1.5">
                                    <Label htmlFor="fullName" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                        {t("dashboard.settings.profile.fullName")}
                                    </Label>
                                    {isEditing ? (
                                        <>
                                            <Input
                                                id="fullName"
                                                disabled={isSaving}
                                                aria-invalid={!!errors.full_name}
                                                placeholder={t("dashboard.settings.profile.fullNamePlaceholder")}
                                                {...register("full_name")}
                                            />
                                            {errors.full_name && (
                                                <p className="text-xs font-medium text-destructive">
                                                    {errors.full_name.message}
                                                </p>
                                            )}
                                        </>
                                    ) : (
                                        <Input
                                            readOnly
                                            value={user?.full_name ?? ""}
                                            placeholder={t("dashboard.settings.profile.notProvided")}
                                            className="bg-muted/40"
                                        />
                                    )}
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                        {t("dashboard.settings.profile.emailAddress")}
                                    </Label>
                                    {/* Email is not editable here */}
                                    <Input
                                        readOnly
                                        value={user?.email ?? ""}
                                        placeholder={t("dashboard.settings.profile.notProvided")}
                                        className="bg-muted/40"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="phone" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                        {t("dashboard.settings.profile.phone")}
                                    </Label>
                                    {isEditing ? (
                                        <>
                                            <Input
                                                id="phone"
                                                type="tel"
                                                disabled={isSaving}
                                                aria-invalid={!!errors.phone}
                                                placeholder={t("dashboard.settings.profile.phonePlaceholder")}
                                                {...register("phone")}
                                            />
                                            {errors.phone && (
                                                <p className="text-xs font-medium text-destructive">
                                                    {errors.phone.message}
                                                </p>
                                            )}
                                        </>
                                    ) : (
                                        <Input
                                            readOnly
                                            value={user?.phone ?? ""}
                                            placeholder={t("dashboard.settings.profile.notProvided")}
                                            className="bg-muted/40"
                                        />
                                    )}
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="bio" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                    {t("dashboard.settings.profile.bio")}
                                </Label>
                                {isEditing ? (
                                    <>
                                        <Textarea
                                            id="bio"
                                            rows={4}
                                            disabled={isSaving}
                                            aria-invalid={!!errors.bio}
                                            placeholder={t("dashboard.settings.profile.bioPlaceholder")}
                                            className="resize-none"
                                            {...register("bio")}
                                        />
                                        {errors.bio && (
                                            <p className="text-xs font-medium text-destructive">
                                                {errors.bio.message}
                                            </p>
                                        )}
                                    </>
                                ) : (
                                    <Textarea
                                        readOnly
                                        rows={4}
                                        value={user?.bio ?? ""}
                                        placeholder={t("dashboard.settings.profile.bioPlaceholder")}
                                        className="resize-none bg-muted/40"
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                </form>
            </Card>

            {/* Account Details */}
            <Card className="p-6 md:p-8">
                <h2 className="mb-6 flex items-center gap-2.5 text-lg font-semibold text-foreground">
                    <BadgeCheck className="h-5 w-5 text-primary" />
                    {t("dashboard.settings.profile.accountDetails")}
                </h2>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="rounded-xl border border-border/60 bg-muted/20 p-5 space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            {t("dashboard.settings.profile.role")}
                        </p>
                        {user?.role ? (
                            <Badge className="rounded-full bg-primary/10 text-primary hover:bg-primary/10 border border-primary/20">
                                {user.role}
                            </Badge>
                        ) : (
                            <span className="text-sm text-muted-foreground">—</span>
                        )}
                    </div>

                    <div className="rounded-xl border border-border/60 bg-muted/20 p-5 space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            {t("dashboard.settings.profile.memberSince")}
                        </p>
                        <p className="text-sm font-semibold text-foreground" suppressHydrationWarning>
                            {memberSince}
                        </p>
                    </div>

                    <div className="rounded-xl border border-border/60 bg-muted/20 p-5 space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            {t("dashboard.settings.profile.emailAddress")}
                        </p>
                        <p
                            className={
                                "flex items-center gap-1.5 text-sm font-semibold " +
                                (emailVerified ? "text-primary" : "text-muted-foreground")
                            }
                        >
                            <BadgeCheck className="h-4 w-4" />
                            {emailVerified
                                ? t("dashboard.settings.profile.emailVerified")
                                : t("dashboard.settings.profile.emailNotVerified")}
                        </p>
                    </div>
                </div>
            </Card>

            {/* Security */}
            <Card className="p-6 md:p-8">
                <h2 className="mb-6 flex items-center gap-2.5 text-lg font-semibold text-foreground">
                    <Shield className="h-5 w-5 text-primary" />
                    {t("dashboard.settings.profile.security")}
                </h2>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="rounded-xl border border-border/60 bg-muted/20 p-5 space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            {t("dashboard.settings.profile.loginMethod")}
                        </p>
                        <p className="text-sm font-semibold text-foreground">—</p>
                    </div>

                    <div className="rounded-xl border border-border/60 bg-muted/20 p-5 space-y-3">
                        <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            {t("dashboard.settings.profile.password")}
                            <span className="inline-flex items-center gap-1 text-primary">
                                <KeyRound className="h-3 w-3" />
                                {t("dashboard.settings.profile.passwordSet")}
                            </span>
                        </p>
                        <Button variant="outline" size="sm">
                            {t("dashboard.settings.profile.changePassword")}
                        </Button>
                    </div>

                    <div className="rounded-xl border border-border/60 bg-muted/20 p-5 space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            {t("dashboard.settings.profile.currentBrowser")}
                        </p>
                        <p
                            suppressHydrationWarning
                            className="flex items-center gap-1.5 text-sm font-semibold text-foreground"
                        >
                            <Monitor className="h-4 w-4 text-muted-foreground" />
                            {browser}
                        </p>
                    </div>
                </div>
            </Card>

            <AvatarUploadDialog
                open={avatarOpen}
                onOpenChange={setAvatarOpen}
                currentAvatarUrl={user?.avatar_url}
                fullName={user?.full_name}
                initials={avatarInitials}
                t={t}
            />
        </div>
    )
}
