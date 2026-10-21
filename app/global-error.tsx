"use client";

import { useEffect } from "react";
import Link from "next/link";
import "./globals.css";

// Last-resort boundary for an error thrown by the root layout itself (its
// cookies/headers/SEO reads, or a provider). It REPLACES the root layout, so
// none of the app is here: no LocaleProvider, no theme, no fonts. Hence the
// copy is inline and in both languages rather than from lib/i18n — importing
// the dictionaries would put both of them in this bundle. It mirrors the
// `errorPage` keys that app/error.tsx renders for every other error.
export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="vi">
      <body className="font-sans antialiased">
        <title>Đã xảy ra lỗi | FundLok</title>
        <div className="flex min-h-screen items-center justify-center bg-background p-6 text-foreground">
          <div className="flex w-full max-w-md flex-col items-center gap-6 text-center">
            <div className="space-y-2">
              <h1 className="text-2xl font-bold">Đã xảy ra lỗi</h1>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Không thể tải trang này. Vui lòng thử lại hoặc quay về trang
                chủ.
              </p>
            </div>
            <div className="space-y-2" lang="en">
              <h2 className="text-lg font-semibold">Something went wrong</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                This page could not be loaded. Please try again, or go back to
                the home page.
              </p>
            </div>
            <div className="flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={() => retry()}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
              >
                Thử lại · Try again
              </button>
              <Link
                href="/"
                className="rounded-md border border-border px-4 py-2 text-sm font-medium"
              >
                Về trang chủ · Go to home
              </Link>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
