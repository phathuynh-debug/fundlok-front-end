"use client"

import Link from "next/link"
import { useState } from "react"
import Logo from "@/components/logo"
import { LocaleSwitcher } from "@/components/locale-switcher"
import { ThemeToggle } from "@/components/theme-toggle"
import { useTheme } from "next-themes"
type SiteHeaderProps = {
  onProcess?: (e: React.MouseEvent) => void
  onAchievements?: (e: React.MouseEvent) => void
  onTeam?: (e: React.MouseEvent) => void
  onContact?: (e?: React.MouseEvent) => void
}

export default function SiteHeader({ onProcess, onAchievements, onTeam, onContact }: SiteHeaderProps) {
  const [contactOpen, setContactOpen] = useState(false)

  

  return (
    <header className="sticky top-0 z-30 w-full bg-background/45 backdrop-blur-md border-b border-border/10 flex items-center justify-between px-6 py-4 md:px-12">
      <Link href="/" className="flex items-center gap-2 group relative z-40">
        <Logo />
      </Link>

      <nav className="hidden lg:flex items-center gap-6 xl:gap-8 text-[11px] font-mono tracking-widest font-semibold">
        <Link href="#" className="transition-colors duration-200 text-zinc-600 hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-white">
          PRODUCT
        </Link>

        <button onClick={onProcess} className="transition-colors duration-200 text-zinc-600 hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-white cursor-pointer font-mono tracking-widest text-[11px] font-semibold bg-transparent border-none p-0 outline-none">
          HOW IT WORKS
        </button>

        <button onClick={onAchievements} className="transition-colors duration-200 text-zinc-600 hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-white cursor-pointer font-mono tracking-widest text-[11px] font-semibold bg-transparent border-none p-0 outline-none">
          ACHIEVEMENTS
        </button>

        <button onClick={onTeam} className="transition-colors duration-200 text-zinc-600 hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-white cursor-pointer font-mono tracking-widest text-[11px] font-semibold bg-transparent border-none p-0 outline-none">
          TEAM
        </button>

        <div className="relative" onMouseEnter={() => setContactOpen(true)} onMouseLeave={() => setContactOpen(false)}>
          <button onFocus={() => setContactOpen(true)} onBlur={() => setContactOpen(false)} className="transition-colors duration-200 text-zinc-600 hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-white cursor-pointer font-mono tracking-widest text-[11px] font-semibold bg-transparent border-none p-0 outline-none" aria-haspopup="true" aria-expanded={contactOpen}>
            CONTACT
          </button>

          {contactOpen && (
            <div className="absolute right-0 mt-2 w-44 bg-white dark:bg-slate-900 border border-border/30 rounded-md shadow-lg z-40">
              <button onClick={onContact} className="w-full text-left px-3 py-2 text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-slate-800">Contact Us</button>
              <Link href="/faq" className="block px-3 py-2 text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-slate-800">FAQ</Link>
            </div>
          )}
        </div>
      </nav>

      <div className="flex items-center gap-4 relative z-30">
        <LocaleSwitcher />
        <ThemeToggle />
        <Link href="/login" className="rounded-full bg-emerald-500 hover:bg-emerald-600 text-white dark:bg-emerald-400 dark:hover:bg-emerald-300 dark:text-slate-950 px-6 py-2.5 text-xs font-mono tracking-widest font-bold uppercase transition-all duration-300 shadow-md hover:shadow-emerald-500/10 active:scale-95">ENTER APP</Link>
      </div>
    </header>
  )
}
