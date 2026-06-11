"use client";

import React, { useState, useEffect, useRef } from "react";
import { apiClient } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isPending, setIsPending] = useState(false);

  // Cloudflare Turnstile States & Ref
  const [turnstileToken, setTurnstileToken] = useState<string | null>(
    process.env.NEXT_PUBLIC_DISABLE_TURNSTILE === "true" ? "mock-token" : null,
  );
  const turnstileContainerRef = useRef<HTMLDivElement>(null);

  const { toast } = useToast();

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_DISABLE_TURNSTILE === "true") {
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
        window.turnstile.render(turnstileContainerRef.current, {
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
        });
      }
    };

    if (window.turnstile) {
      initializeTurnstile();
    } else {
      script.onload = initializeTurnstile;
    }

    return () => {
      if (window.turnstile && turnstileContainerRef.current) {
        try {
          window.turnstile.remove();
        } catch (e) {
          // ignore
        }
      }
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!turnstileToken) {
      toast({
        variant: "destructive",
        title: "Security Check Required",
        description: "Please complete the security check.",
      });
      return;
    }

    setIsPending(true);

    try {
      await apiClient.post("/contact", {
        name,
        email,
        subject,
        message,
        turnstile_token: turnstileToken,
      });

      toast({
        title: "Message Sent",
        description: "Thank you! Your inquiry has been submitted successfully.",
      });

      // Reset form states
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
      setTurnstileToken(null);

      // Reset Turnstile widget visually
      if (window.turnstile) {
        try {
          // Trigger a reset/reload if we have the global object
          // Since we might not keep track of widgetId, re-rendering or native reset works:
          // In standard Turnstile, you can just call reset() on the widget container.
          // In custom rendering we can call reset() or it will reset on key trigger.
          // Cloudflare turnstile has turnstile.reset() which resets the first/all widgets if no id is passed.
          window.turnstile.reset();
        } catch (err) {
          // ignore
        }
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to Send Message",
        description:
          error?.message || "Something went wrong. Please try again.",
      });
    } finally {
      setIsPending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <input
          type="text"
          placeholder="Name"
          className="w-full rounded-2xl border border-border/40 bg-transparent px-4 py-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-emerald-500"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          disabled={isPending}
        />
        <input
          type="email"
          placeholder="Email"
          className="w-full rounded-2xl border border-border/40 bg-transparent px-4 py-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-emerald-500"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={isPending}
        />
      </div>
      <input
        type="text"
        placeholder="Subject"
        className="w-full rounded-2xl border border-border/40 bg-transparent px-4 py-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-emerald-500"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        required
        disabled={isPending}
      />
      <textarea
        placeholder="Message"
        className="h-36 w-full resize-none rounded-2xl border border-border/40 bg-transparent px-4 py-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-emerald-500"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        required
        disabled={isPending}
      />

      {/* Cloudflare Turnstile Spam Prevention */}
      {process.env.NEXT_PUBLIC_DISABLE_TURNSTILE !== "true" && (
        <div className="flex justify-center py-2">
          <div ref={turnstileContainerRef} />
        </div>
      )}

      <button
        type="submit"
        disabled={isPending || !turnstileToken}
        className="w-full sm:w-auto inline-flex items-center justify-center rounded-full bg-emerald-500 px-6 py-3 text-xs font-bold uppercase tracking-[0.18em] text-white transition-colors hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      >
        {isPending && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
        {isPending ? "Sending..." : "Send Message"}
      </button>
    </form>
  );
}
