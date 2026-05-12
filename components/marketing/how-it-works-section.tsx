import { Icon } from '@iconify/react'

const steps = [
  {
    number: '01',
    icon: 'solar:chat-round-bold',
    title: 'Ask a Swiss tax question',
    description:
      'Ask about federal tax, cantonal rules, VAT/MWST, deductions, forms, deadlines, or official tax news.'
  },
  {
    number: '02',
    icon: 'solar:magnifer-bold',
    title: 'Search official sources',
    description:
      'The search tool queries official Swiss federal, cantonal, municipal, legal, and tax authority domains only.'
  },
  {
    number: '03',
    icon: 'solar:document-text-bold',
    title: 'Get a cited answer',
    description:
      'Receive a clear response with inline citations, jurisdiction notes, source coverage, and exportable research context.'
  }
]

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="bg-muted px-6 py-[80px]">
      <div className="mx-auto max-w-[1200px]">
        {/* Section label */}
        <div className="mb-4 flex justify-center">
          <span className="text-[11px] font-semibold uppercase tracking-[0.88px] text-muted-foreground">
            How it works
          </span>
        </div>

        {/* Section head */}
        <h2 className="mx-auto mb-4 max-w-2xl text-center text-[26px] sm:text-[36px] font-normal leading-[1.2] tracking-[-0.72px] text-foreground">
          From tax question to official answer.
        </h2>
        <p className="mx-auto mb-14 max-w-xl text-center text-[16px] leading-[1.5] text-muted-foreground">
          Every answer is traceable back to official Swiss sources, with clear
          notes when coverage is federal-only, canton-specific, or incomplete.
        </p>

        {/* Steps */}
        <div className="relative grid gap-6 lg:grid-cols-3">
          {/* Connector line — desktop only */}
          <div
            className="absolute top-[52px] left-[calc(16.67%+24px)] right-[calc(16.67%+24px)] hidden h-px bg-border lg:block"
            aria-hidden="true"
          />

          {steps.map((step, i) => (
            <div
              key={step.number}
              className="rounded-[12px] border border-border bg-card p-6"
            >
              {/* Step circle */}
              <div className="relative mb-6 inline-flex size-[52px] items-center justify-center rounded-full border border-border bg-background">
                <Icon icon={step.icon} className="size-6 text-foreground" />
                {/* Number badge */}
                <span className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
                  {i + 1}
                </span>
              </div>

              <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.88px] text-muted-foreground">
                Step {step.number}
              </p>
              <h3 className="mb-2 text-[18px] font-semibold leading-[1.4] text-foreground">
                {step.title}
              </h3>
              <p className="text-[14px] leading-[1.5] text-muted-foreground">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
