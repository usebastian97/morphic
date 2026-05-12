'use client'

import { useState } from 'react'

import { Icon } from '@iconify/react'

const faqs = [
  {
    q: 'What is SwissTaxSearch?',
    a: 'SwissTaxSearch is an AI research app for current Swiss tax information. It searches official federal, cantonal, municipal, legal, statistics, and tax authority sources, then returns cited answers.'
  },
  {
    q: 'Is this tax advice?',
    a: 'No. SwissTaxSearch helps you find and understand official sources, but important decisions should still be checked against the cited authority or a qualified Swiss tax professional.'
  },
  {
    q: 'Which sources are searched?',
    a: 'The active search tool is constrained to official Swiss federal, cantonal, and municipal domains from the Supabase source catalogue plus static Swiss government fallbacks.'
  },
  {
    q: 'Is my data private?',
    a: 'When self-hosted, your data stays on your infrastructure. Chat history is stored in PostgreSQL, and AI/search requests use the providers you configure.'
  },
  {
    q: 'What do Speed and Quality modes do?',
    a: 'Speed mode uses fewer credits for fast official-source answers. Quality mode uses more credits for deeper reasoning across the same official Swiss tax source policy.'
  }
]

export function FaqSection() {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <section className="bg-background px-6 py-[80px]">
      <div className="mx-auto max-w-[720px]">
        {/* Section label */}
        <div className="mb-4 flex justify-center">
          <span className="text-[11px] font-semibold uppercase tracking-[0.88px] text-muted-foreground">
            FAQ
          </span>
        </div>

        {/* Section head */}
        <h2 className="mb-12 text-center text-[26px] sm:text-[36px] font-normal leading-[1.2] tracking-[-0.72px] text-foreground">
          Common questions.
        </h2>

        {/* Items */}
        <div className="divide-y divide-border border-t border-b border-border">
          {faqs.map((faq, i) => {
            const isOpen = open === i
            return (
              <div key={i}>
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-center justify-between px-0 py-5 text-left gap-4"
                  aria-expanded={isOpen}
                >
                  <span className="text-[16px] font-medium leading-[1.4] text-foreground">
                    {faq.q}
                  </span>
                  <Icon
                    icon={
                      isOpen
                        ? 'solar:alt-arrow-up-bold'
                        : 'solar:alt-arrow-down-bold'
                    }
                    className="size-4 shrink-0 text-muted-foreground"
                  />
                </button>
                {isOpen && (
                  <div className="pb-5">
                    <p className="text-[14px] leading-[1.5] text-muted-foreground">
                      {faq.a}
                    </p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
