"use client";

import { useEffect, useState } from "react";

/**
 * An object URL for a Blob (a PDF to preview in an iframe, or to download),
 * revoked when the Blob changes or the component unmounts.
 *
 * Created inside the effect, not in a useMemo: under Strict Mode React runs
 * an effect's cleanup and then the effect again, and a memoised URL would be
 * revoked by that cleanup while still on screen.
 */
export function useObjectUrl(blob: Blob | null): string | null {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!blob) return;
    const next = URL.createObjectURL(blob);
    // Syncing with an external resource (the browser's blob store); there is
    // no render-time way to create and later revoke it.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUrl(next);
    return () => {
      URL.revokeObjectURL(next);
      setUrl(null);
    };
  }, [blob]);
  return url;
}
