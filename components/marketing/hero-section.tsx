import Link from 'next/link'

import { Icon } from '@iconify/react'

export function HeroSection() {
  return (
    <section className="bg-background pt-40 pb-[80px] px-6">
      <div className="mx-auto max-w-[1200px]">
        {/* Section label */}
        <div className="mb-6 flex justify-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-[10px] py-[4px] text-[11px] font-semibold uppercase tracking-[0.88px] text-muted-foreground">
            <Icon icon="solar:code-bold" className="size-3" />
            Open Source · MIT License
          </span>
        </div>

        {/* Display headline — weight 400, editorial */}
        <h1 className="mx-auto max-w-3xl text-center text-[32px] sm:text-[56px] lg:text-[72px] font-normal leading-[1.1] tracking-[-2.16px] text-foreground">
          The AI answer engine
          <br />
          <span className="text-muted-foreground">that shows its work.</span>
        </h1>

        {/* Subhead */}
        <p className="mx-auto mt-6 max-w-xl text-center text-[16px] leading-[1.5] text-muted-foreground">
          Morphic searches the web in real time, reasons through results, and
          delivers structured answers with cited sources — powered by the AI
          model you choose.
        </p>

        {/* CTAs */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/chat"
            className="inline-flex items-center gap-2 rounded-[8px] bg-foreground px-[20px] py-[12px] text-[14px] font-medium leading-none text-background hover:bg-foreground/90 transition-colors"
          >
            Start searching
            <Icon icon="solar:alt-arrow-right-bold" className="size-4" />
          </Link>
          <Link
            href="https://github.com/miurla/morphic"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-[8px] border border-border bg-card px-[20px] py-[12px] text-[14px] font-medium leading-none text-foreground hover:bg-accent transition-colors"
          >
            <Icon icon="solar:code-bold" className="size-4" />
            View on GitHub
          </Link>
        </div>

        {/* IDE-style mockup card */}
        <div className="mt-16 mx-auto max-w-2xl">
          <div className="rounded-[12px] border border-border bg-card overflow-hidden">
            {/* Pane header */}
            <div className="flex items-center gap-1.5 border-b border-border px-4 py-3 bg-muted">
              <span className="size-2.5 rounded-full bg-border" />
              <span className="size-2.5 rounded-full bg-border" />
              <span className="size-2.5 rounded-full bg-border" />
              <span className="ml-3 text-[11px] font-medium uppercase tracking-[0.88px] text-muted-foreground">
                Morphic
              </span>
            </div>

            {/* Pane body */}
            <div className="bg-muted p-4 font-mono text-[13px] leading-[1.5] text-muted-foreground">
              {/* Search bar row */}
              <div className="flex items-center gap-3 rounded-[8px] border border-border bg-card px-4 py-2.5">
                <Icon
                  icon="solar:magnifer-bold"
                  className="size-4 shrink-0 text-muted-foreground"
                />
                <span className="truncate text-foreground">
                  How does quantum entanglement work?
                </span>
                <div className="ml-auto flex items-center gap-1 shrink-0">
                  <div className="size-2 rounded-full bg-primary animate-pulse" />
                </div>
              </div>

              {/* AI timeline pills */}
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#dfa88f] px-[10px] py-[4px] text-[11px] font-semibold uppercase tracking-[0.88px] text-[#26251e]">
                  Thinking
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#9fc9a2] px-[10px] py-[4px] text-[11px] font-semibold uppercase tracking-[0.88px] text-[#26251e]">
                  Searching
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#9fbbe0] px-[10px] py-[4px] text-[11px] font-semibold uppercase tracking-[0.88px] text-[#26251e]">
                  Reading
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#c0a8dd] px-[10px] py-[4px] text-[11px] font-semibold uppercase tracking-[0.88px] text-[#26251e]">
                  Composing
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#c08532] px-[10px] py-[4px] text-[11px] font-semibold uppercase tracking-[0.88px] text-white">
                  Done
                </span>
              </div>

              {/* Answer preview */}
              <div className="mt-4 space-y-2">
                <div className="h-2.5 rounded-full bg-border w-full" />
                <div className="h-2.5 rounded-full bg-border w-4/5" />
                <div className="h-2.5 rounded-full bg-border w-3/5" />
              </div>

              {/* Source pills */}
              <div className="mt-4 flex gap-2 flex-wrap">
                {['arxiv.org', 'nature.com', 'phys.org'].map(s => (
                  <span
                    key={s}
                    className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2.5 py-1 text-[11px] text-muted-foreground"
                  >
                    <Icon icon="solar:link-bold" className="size-2.5" />
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Trust line */}
        <p className="mt-8 text-center text-[13px] text-muted-foreground/70">
          Open-source · Self-hostable · No vendor lock-in
        </p>
      </div>
    </section>
  )
}
