'use client'

import Link from 'next/link'
import { useState } from 'react'

import { Icon } from '@iconify/react'

import { useHasUser } from '@/lib/contexts/user-context'

import { IconLogo } from '@/components/ui/icons'

export function MarketingNav() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const hasUser = useHasUser()

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border h-16">
      <div className="mx-auto max-w-[1200px] px-6 h-full flex items-center justify-between">
        {/* Logo / wordmark */}
        <Link href="/" className="flex items-center gap-2 select-none">
          <IconLogo className="size-5 text-primary" />
          <span className="text-[14px] font-medium text-foreground tracking-tight">
            Morphic
          </span>
        </Link>

        {/* Nav links — desktop */}
        <nav className="hidden md:flex items-center gap-6">
          <Link
            href="#features"
            className="text-[14px] font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Features
          </Link>
          <Link
            href="#how-it-works"
            className="text-[14px] font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            How it works
          </Link>
          <Link
            href="https://github.com/miurla/morphic"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[14px] font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
          >
            <Icon icon="solar:code-bold" className="size-3.5" />
            GitHub
          </Link>
        </nav>

        {/* CTAs */}
        <div className="hidden md:flex items-center gap-2">
          {hasUser ? (
            <Link
              href="/chat"
              className="inline-flex items-center gap-1.5 rounded-[8px] bg-primary px-[18px] py-[10px] text-[14px] font-medium leading-none text-primary-foreground hover:bg-[#d04200] transition-colors"
            >
              Go to app
              <Icon icon="solar:alt-arrow-right-bold" className="size-3.5" />
            </Link>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="inline-flex items-center px-3 py-2 text-[14px] font-medium text-muted-foreground hover:text-foreground transition-colors rounded-[8px] hover:bg-accent"
              >
                Sign in
              </Link>
              <Link
                href="/chat"
                className="inline-flex items-center gap-1.5 rounded-[8px] bg-primary px-[18px] py-[10px] text-[14px] font-medium leading-none text-primary-foreground hover:bg-[#d04200] transition-colors"
              >
                Get started
                <Icon icon="solar:alt-arrow-right-bold" className="size-3.5" />
              </Link>
            </>
          )}
        </div>

        {/* Hamburger — mobile */}
        <button
          className="md:hidden flex items-center justify-center size-9 rounded-[8px] hover:bg-accent text-foreground"
          onClick={() => setMobileOpen(v => !v)}
          aria-label="Toggle menu"
        >
          <Icon
            icon={mobileOpen ? 'solar:close-circle-bold' : 'solar:sidebar-minimalistic-bold'}
            className="size-5"
          />
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-background px-6 py-4 flex flex-col gap-3">
          <Link href="#features" className="text-[14px] font-medium text-muted-foreground hover:text-foreground transition-colors py-2" onClick={() => setMobileOpen(false)}>Features</Link>
          <Link href="#how-it-works" className="text-[14px] font-medium text-muted-foreground hover:text-foreground transition-colors py-2" onClick={() => setMobileOpen(false)}>How it works</Link>
          <Link href="https://github.com/miurla/morphic" target="_blank" rel="noopener noreferrer" className="text-[14px] font-medium text-muted-foreground hover:text-foreground transition-colors py-2 flex items-center gap-1.5"><Icon icon="solar:code-bold" className="size-3.5" />GitHub</Link>
          <div className="pt-2 border-t border-border flex flex-col gap-2">
            {hasUser ? (
              <Link href="/chat" className="inline-flex items-center justify-center gap-1.5 rounded-[8px] bg-primary px-[18px] py-[10px] text-[14px] font-medium leading-none text-primary-foreground hover:bg-[#d04200] transition-colors" onClick={() => setMobileOpen(false)}>Go to app<Icon icon="solar:alt-arrow-right-bold" className="size-3.5" /></Link>
            ) : (
              <>
                <Link href="/auth/login" className="inline-flex items-center justify-center px-3 py-2.5 text-[14px] font-medium text-foreground border border-border rounded-[8px] hover:bg-accent transition-colors" onClick={() => setMobileOpen(false)}>Sign in</Link>
                <Link href="/chat" className="inline-flex items-center justify-center gap-1.5 rounded-[8px] bg-primary px-[18px] py-[10px] text-[14px] font-medium leading-none text-primary-foreground hover:bg-[#d04200] transition-colors" onClick={() => setMobileOpen(false)}>Get started<Icon icon="solar:alt-arrow-right-bold" className="size-3.5" /></Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
