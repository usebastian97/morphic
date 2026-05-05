'use client'

import { useState } from 'react'

import { Icon } from '@iconify/react'

const faqs = [
  {
    q: 'Is Morphic free to use?',
    a: 'Morphic is open-source and free to self-host. You only pay for the API keys of the AI providers you choose (OpenAI, Anthropic, Google, etc.). The Morphic cloud deployment may have its own pricing tier.'
  },
  {
    q: 'What AI models are supported?',
    a: 'Morphic supports OpenAI (GPT-4o, o-series), Anthropic (Claude), Google (Gemini), and more. You can configure any combination and switch between them per-session. See the models.json config for the full list.'
  },
  {
    q: 'Can I self-host Morphic?',
    a: "Yes. Morphic ships with a Docker Compose setup that includes the app, PostgreSQL, Redis, and SearXNG for self-hosted search. Run docker compose up -d and you're live in minutes."
  },
  {
    q: 'Is my data private?',
    a: 'When self-hosted, your data stays entirely on your infrastructure. Chat history is stored in your PostgreSQL database. Morphic never sends your conversations to any external service beyond the AI provider you configure.'
  },
  {
    q: 'How does Morphic compare to ChatGPT or Perplexity?',
    a: "Morphic is fully open-source and self-hostable, unlike both. It focuses on transparent, cited answers with a generative UI — you can see exactly which sources informed each answer, and you're not locked into a single AI provider."
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
