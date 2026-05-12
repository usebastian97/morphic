import { Icon } from '@iconify/react'

const features = [
  {
    icon: 'solar:magnifer-bold',
    title: 'Official-only search',
    description:
      'Every search is constrained to Swiss federal, cantonal, municipal, legal, statistics, and official tax authority domains.'
  },
  {
    icon: 'solar:map-point-bold',
    title: 'Canton-aware context',
    description:
      'Profiles can capture canton, municipality, taxpayer type, and language so answers highlight the right jurisdiction.'
  },
  {
    icon: 'solar:document-text-bold',
    title: 'Source-backed answers',
    description:
      'Responses include inline citations, official-source coverage scores, source breakdowns, and PDF exports for later review.'
  },
  {
    icon: 'solar:code-bold',
    title: 'Self-hostable stack',
    description:
      'Run the app with your own Supabase database, Redis cache, DeepSeek models, Parallel Search key, and Docker services.'
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
          Built for Swiss tax research.
        </h2>
        <p className="mx-auto mb-14 max-w-xl text-center text-[16px] leading-[1.5] text-muted-foreground">
          SwissTaxSearch combines real-time retrieval with structured answers
          for tax rates, forms, deadlines, official news, and jurisdiction
          comparisons.
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
