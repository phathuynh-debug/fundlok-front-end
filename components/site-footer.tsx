"use client";

import Link from "next/link";
import type { SVGProps } from "react";
import { Mail, ArrowRight } from "lucide-react";
import { useTranslations } from "@/lib/i18n";

const FacebookIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
    <path d="M22 12a10 10 0 1 0-11.563 9.88v-6.99H7.898V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.095 0 2.24.196 2.24.196v2.459h-1.262c-1.243 0-1.632.772-1.632 1.565V12h2.777l-.444 2.89h-2.333v6.99A10 10 0 0 0 22 12z" />
  </svg>
);

const LinkedInIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
    <path d="M19 0h-14C2.239 0 0 2.239 0 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5V5c0-2.761-2.238-5-5-5Zm-11 19H5v-8h3v8ZM6.5 9.268C5.534 9.268 4.75 8.477 4.75 7.5S5.534 5.732 6.5 5.732s1.75.791 1.75 1.768S7.466 9.268 6.5 9.268ZM19 19h-3v-4.604c0-3.368-4-3.113-4 0V19H9v-8h3v1.765c1.396-2.586 7-2.777 7 2.476V19Z" />
  </svg>
);

const InstagramIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
  </svg>
);

const aboutLinks = [
  { label: "Our Story", href: "/why-us" },
  { label: "Our Solution", href: "/#process" },
  { label: "Team", href: "/#team" },
  { label: "Achievements", href: "/why-us#achievements" },
];

const supportLinks = [
  { label: "Contact Us", href: "/contact" },
  { label: "Project Application", href: "/project-application" },
  { label: "Terms of Service", href: "/terms" },
  { label: "Log In", href: "/login" },
  { label: "Register", href: "/register" },
];

const socialLinks = [
  {
    label: "Facebook",
    href: "https://www.facebook.com/profile.php?id=61579474545924",
    icon: FacebookIcon,
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/fundlokvn/",
    icon: InstagramIcon,
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/company/fundlok/posts/?feedView=all",
    icon: LinkedInIcon,
  },
  {
    label: "Email",
    href: "mailto:support@fundlok.com",
    icon: Mail,
  },
];

export default function SiteFooter() {
  const { t } = useTranslations();

  return (
    <footer className="w-full border-t border-white/10 bg-[#0b1217] text-zinc-100">
      <div className="mx-auto max-w-6xl px-6 py-14 md:py-16">
        <div className="grid gap-12 md:grid-cols-[1.05fr_1.05fr_1.3fr]">
          <div>
            <h4 className="text-[13px] font-black uppercase tracking-[0.22em] text-white/95">
              About Us
            </h4>
            <ul className="mt-6 space-y-3 text-sm text-zinc-300">
              {aboutLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-[13px] font-black uppercase tracking-[0.22em] text-white/95">
              Customer Support
            </h4>
            <ul className="mt-6 space-y-3 text-sm text-zinc-300">
              {supportLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-[13px] font-black uppercase tracking-[0.22em] text-white/95">
              Connect With Us
            </h4>
            <div className="mt-5 flex items-center gap-3">
              {socialLinks.map(({ label, href, icon: Icon }) => (
                <a
                  key={label}
                  href={href}
                  target={href.startsWith("http") ? "_blank" : undefined}
                  rel={
                    href.startsWith("http") ? "noreferrer noopener" : undefined
                  }
                  aria-label={label}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition-all duration-300 hover:border-white/20 hover:bg-white/10 hover:scale-105"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
            <p className="mt-5 max-w-sm text-sm leading-6 text-zinc-300">
              Want to reach the team directly or get updates about FundLok?
              Visit the contact page for the quickest response.
            </p>
            <Link
              href="/contact"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-emerald-500 px-5 py-3 text-xs font-bold uppercase tracking-[0.18em] text-white transition-colors duration-300 hover:bg-emerald-600"
            >
              Get in the Loop
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="mt-12 border-t border-white/10 pt-6 text-[10px] leading-5 text-zinc-500 md:flex md:items-center md:justify-between">
          <p>{t("common.copyright")}</p>
          <p className="mt-2 md:mt-0">
            FundLok builds flexible capital tools for SMEs and investors.
          </p>
        </div>
      </div>
    </footer>
  );
}
