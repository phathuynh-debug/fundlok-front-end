import { useState, useEffect, useRef } from "react";

export const isTurnstileDisabled =
  process.env.NEXT_PUBLIC_DISABLE_TURNSTILE === "true";

export function useTurnstile() {
  const [turnstileToken, setTurnstileToken] = useState<string | null>(
    isTurnstileDisabled ? "mock-token" : null,
  );
  const turnstileContainerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (isTurnstileDisabled) {
      return;
    }
    const scriptId = "cloudflare-turnstile-script";
    let script = document.getElementById(scriptId) as HTMLScriptElement;

    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.src =
        "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    }

    const initializeTurnstile = () => {
      if (window.turnstile && turnstileContainerRef.current) {
        widgetIdRef.current = window.turnstile.render(
          turnstileContainerRef.current,
          {
            sitekey:
              process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY ||
              "0x4AAAAAAADgp22IT7NjMKXhN",
            callback: (token: string) => {
              setTurnstileToken(token);
            },
            "expired-callback": () => {
              setTurnstileToken(null);
            },
            "error-callback": () => {
              setTurnstileToken(null);
            },
          },
        );
      }
    };

    if (window.turnstile) {
      initializeTurnstile();
    } else {
      script.onload = initializeTurnstile;
    }

    const container = turnstileContainerRef.current;
    return () => {
      if (window.turnstile && container) {
        try {
          if (widgetIdRef.current) {
            window.turnstile.remove(widgetIdRef.current);
          } else {
            window.turnstile.remove();
          }
        } catch {
          // ignore
        }
      }
    };
  }, []);

  const reset = () => {
    if (isTurnstileDisabled) {
      setTurnstileToken("mock-token");
      return;
    }
    if (window.turnstile) {
      try {
        if (widgetIdRef.current) {
          window.turnstile.reset(widgetIdRef.current);
        } else {
          window.turnstile.reset();
        }
        setTurnstileToken(null);
      } catch {
        // ignore
      }
    }
  };

  return {
    turnstileToken,
    turnstileContainerRef,
    reset,
    isTurnstileDisabled,
  };
}
