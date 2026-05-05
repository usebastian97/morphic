import { Icon } from '@iconify/react'

const features = [
  {
    icon: 'solar:magnifer-bold',
    title: 'Real-time Web Search',
    description:
      'Every answer is grounded in live search results. Morphic queries the web at the moment you ask, not from a stale training snapshot.'
  },
  {
    icon: 'solar:magic-stick-bold',
    title: 'Generative UI',
    description:
      "Answers aren't walls of text. Morphic renders structured responses — with sources, follow-up questions, and rich components — in real time."
  },
  {
    icon: 'solar:layers-bold',
    title: 'Multiple AI Providers',
    description:
      'Switch between OpenAI, Anthropic, Google, and more. Bring your own API keys and stay in control of which models power your searches.'
  },
  {
    icon: 'solar:code-bold',
    title: 'Fully Open Source',
    description:
      'Every line is on GitHub under the MIT license. Self-host it in minutes with Docker, or deploy to Vercel with a single click.'
  }
]

export function FeaturesSection() {
  return (
    <section id="features" className="bg-background px-6 py-[80px]">
      <div className="mx-auto max-w-[1200px]">
        {/* Section label */}
        <div className="mb-4 flex justify-center">
          <span className="text-[11px] font-semibold uppercase tracking-[0.88px] text-muted-foreground">
            Capabilities
          </span>
        </div>

        {/* Section head — weight 400, not bold */}
        <h2 className="mx-auto mb-4 max-w-2xl text-center text-[26px] sm:text-[36px] font-normal leading-[1.2] tracking-[-0.72px] text-foreground">
          Built for answers, not just chat.
        </h2>
        <p className="mx-auto mb-14 max-w-xl text-center text-[16px] leading-[1.5] text-muted-foreground">
          Morphic combines a powerful search engine with a generative UI
          framework to give you answers you can actually trust and trace.
        </p>

        {/* Feature cards — hairline bordered, white on cream */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map(f => (
            <div
              key={f.title}
              className="rounded-[12px] border border-border bg-card p-6"
            >
              <div className="mb-4 inline-flex size-9 items-center justify-center rounded-[8px] border border-border bg-background">
                <Icon icon={f.icon} className="size-4 text-foreground" />
              </div>
              <h3 className="mb-2 text-[16px] font-semibold leading-[1.4] text-foreground">
                {f.title}
              </h3>
              <p className="text-[14px] leading-[1.5] text-muted-foreground">
                {f.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
