"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Upload } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useUpdateAvatar } from "@/hooks/use-users";
import { AVATAR_RULES } from "@/services/users.service";

interface AvatarUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentAvatarUrl?: string | null;
  fullName?: string;
  initials: string;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const ACCEPT = AVATAR_RULES.contentTypes.join(",");

export function AvatarUploadDialog({
  open,
  onOpenChange,
  currentAvatarUrl,
  fullName,
  initials,
  t,
}: AvatarUploadDialogProps) {
  const { toast } = useToast();
  const updateAvatar = useUpdateAvatar();
  const inputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  // Revoke the object URL whenever it changes or the dialog unmounts.
  useEffect(() => {
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [objectUrl]);

  const reset = () => {
    setFile(null);
    setObjectUrl(null);
    setProgress(0);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0];
    e.target.value = ""; // allow re-picking the same file
    if (!picked) return;

    if (!AVATAR_RULES.contentTypes.includes(picked.type as never)) {
      toast({
        variant: "destructive",
        title: t("dashboard.settings.profile.avatar.failedTitle"),
        description: t("dashboard.settings.profile.avatar.invalidType"),
      });
      return;
    }
    if (picked.size > AVATAR_RULES.maxSizeMb * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: t("dashboard.settings.profile.avatar.failedTitle"),
        description: t("dashboard.settings.profile.avatar.tooLarge", {
          maxSize: AVATAR_RULES.maxSizeMb,
        }),
      });
      return;
    }

    if (objectUrl) URL.revokeObjectURL(objectUrl);
    setObjectUrl(URL.createObjectURL(picked));
    setFile(picked);
    setProgress(0);
  };

  const handleSave = () => {
    if (!file) return;
    updateAvatar.mutate(
      { file, onProgress: setProgress },
      {
        onSuccess: () => {
          toast({
            title: t("dashboard.settings.profile.avatar.updatedTitle"),
            description: t(
              "dashboard.settings.profile.avatar.updatedDescription",
            ),
          });
          handleOpenChange(false);
        },
        onError: (error) => {
          toast({
            variant: "destructive",
            title: t("dashboard.settings.profile.avatar.failedTitle"),
            description:
              error?.message ||
              t("dashboard.settings.profile.avatar.failedDescription"),
          });
        },
      },
    );
  };

  const previewSrc = objectUrl ?? currentAvatarUrl ?? undefined;
  const isPending = updateAvatar.isPending;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {t("dashboard.settings.profile.avatar.title")}
          </DialogTitle>
          <DialogDescription>
            {t("dashboard.settings.profile.avatar.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-4">
          <Avatar className="h-40 w-40 ring-2 ring-border">
            <AvatarImage src={previewSrc} alt={fullName ?? ""} />
            <AvatarFallback className="bg-primary/10 text-4xl font-semibold text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>

          {isPending && (
            <div className="w-full max-w-xs space-y-1.5">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-200"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-center text-xs text-muted-foreground">
                {t("dashboard.settings.profile.avatar.uploading", {
                  percent: progress,
                })}
              </p>
            </div>
          )}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={handleFileChange}
        />

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={() => inputRef.current?.click()}
          >
            {t("dashboard.settings.profile.avatar.newAvatar")}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={isPending || !file}
            onClick={reset}
            className="text-destructive border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
          >
            {t("dashboard.settings.profile.avatar.removeAvatar")}
          </Button>
          <Button
            type="button"
            disabled={isPending || !file}
            onClick={handleSave}
            className="gap-2"
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {!isPending && <Upload className="h-4 w-4" />}
            {isPending
              ? t("dashboard.settings.profile.avatar.saving")
              : t("dashboard.settings.profile.avatar.saveAvatar")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
