import Link from 'next/link'

import { Icon } from '@iconify/react'

import { IconLogo } from '@/components/ui/icons'

export function MarketingFooter() {
  return (
    <footer className="bg-background border-t border-border px-6 py-[48px]">
      <div className="mx-auto max-w-[1200px]">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          {/* Brand */}
          <div className="flex flex-col gap-3">
            <Link href="/" className="flex items-center gap-2">
              <IconLogo className="size-5 text-primary" />
              <span className="text-[14px] font-medium text-foreground">
                SwissTaxSearch
              </span>
            </Link>
            <p className="text-[14px] leading-[1.5] text-muted-foreground max-w-[240px]">
              Real-time AI search across official Swiss tax sources.
            </p>
          </div>

          {/* Link columns */}
          <div className="flex flex-wrap gap-x-12 gap-y-6">
            <div className="flex flex-col gap-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.88px] text-muted-foreground">
                Product
              </p>
              <Link
                href="/chat"
                className="text-[14px] text-muted-foreground hover:text-foreground transition-colors"
              >
                Search now
              </Link>
              <Link
                href="#features"
                className="text-[14px] text-muted-foreground hover:text-foreground transition-colors"
              >
                Features
              </Link>
              <Link
                href="#how-it-works"
                className="text-[14px] text-muted-foreground hover:text-foreground transition-colors"
              >
                How it works
              </Link>
            </div>

            <div className="flex flex-col gap-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.88px] text-muted-foreground">
                Open Source
              </p>
              <Link
                href="https://github.com/miurla/morphic"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-[14px] text-muted-foreground hover:text-foreground transition-colors"
              >
                <Icon icon="solar:code-bold" className="size-3.5" />
                Source
              </Link>
              <Link
                href="https://github.com/miurla/morphic/blob/main/README.md"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-[14px] text-muted-foreground hover:text-foreground transition-colors"
              >
                <Icon icon="solar:book-2-bold" className="size-3.5" />
                Docs
              </Link>
              <Link
                href="https://github.com/miurla/morphic/blob/main/LICENSE"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[14px] text-muted-foreground hover:text-foreground transition-colors"
              >
                MIT License
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-2 border-t border-border pt-6 md:flex-row">
          <p className="text-[13px] text-muted-foreground">
            © {new Date().getFullYear()} SwissTaxSearch. Open-source under the
            MIT License.
          </p>
          <p className="text-[13px] text-muted-foreground">
            Built with Next.js · Vercel AI SDK · Tailwind CSS
          </p>
        </div>
      </div>
    </footer>
  )
}
