"use client"

import { useEffect, useMemo } from "react"
import { FileQuestion } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

// What we can render inline in the browser. Everything else (.zip, .xlsx, …)
// has no built-in preview.
export type PreviewKind = "pdf" | "image" | null

export function previewKindForFile(file: File): PreviewKind {
  const type = file.type
  const name = file.name.toLowerCase()
  if (type === "application/pdf" || name.endsWith(".pdf")) return "pdf"
  if (type.startsWith("image/") || /\.(png|jpe?g|webp|gif|bmp|svg)$/.test(name)) {
    return "image"
  }
  return null
}

export function isPreviewable(file: File): boolean {
  return previewKindForFile(file) !== null
}

interface DocumentPreviewDialogProps {
  file: File | null
  open: boolean
  onOpenChange: (open: boolean) => void
  t: (key: string) => string
}

export function DocumentPreviewDialog({ file, open, onOpenChange, t }: DocumentPreviewDialogProps) {
  // Object URL for the staged File. Created only on the client while the dialog
  // is open; the effect below revokes it so we don't leak blob URLs.
  const url = useMemo(() => {
    if (!file || !open || typeof window === "undefined") return null
    return URL.createObjectURL(file)
  }, [file, open])

  useEffect(() => {
    if (!url) return
    return () => URL.revokeObjectURL(url)
  }, [url])

  const kind = file ? previewKindForFile(file) : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="truncate pr-8 text-left">{file?.name}</DialogTitle>
        </DialogHeader>

        <div className="flex h-[70vh] w-full items-center justify-center overflow-auto rounded-lg border border-border bg-muted/30">
          {url && kind === "pdf" ? (
            <iframe src={url} title={file?.name} className="h-full w-full rounded-lg" />
          ) : url && kind === "image" ? (
            // Local blob preview — next/image adds no value for an object URL.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={url}
              alt={file?.name}
              className="max-h-full max-w-full object-contain"
            />
          ) : (
            <div className="flex flex-col items-center gap-3 p-8 text-center text-muted-foreground">
              <FileQuestion className="h-10 w-10" />
              <p className="max-w-xs text-sm">{t("dashboard.sme.previewUnavailable")}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
