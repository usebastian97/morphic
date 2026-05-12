export const STATIC_OFFICIAL_SWISS_TAX_DOMAINS = [
  'admin.ch',
  'estv.admin.ch',
  'efd.admin.ch',
  'fedlex.admin.ch',
  'news.admin.ch',
  'ch.ch',
  'ag.ch',
  'ai.ch',
  'ar.ch',
  'be.ch',
  'bl.ch',
  'bs.ch',
  'fr.ch',
  'ge.ch',
  'gl.ch',
  'gr.ch',
  'jura.ch',
  'lu.ch',
  'ne.ch',
  'nw.ch',
  'ow.ch',
  'sg.ch',
  'sh.ch',
  'so.ch',
  'sz.ch',
  'tg.ch',
  'ti.ch',
  'ur.ch',
  'vd.ch',
  'vs.ch',
  'zg.ch',
  'zh.ch',
  'steuerverwaltung.bs.ch',
  'steuern.lu.ch',
  'steueramt.so.ch',
  'steuerverwaltung.tg.ch'
] as const

export function normalizeDomain(domain: string): string | null {
  const normalized = domain
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .split('/')[0]
    ?.split(':')[0]

  return normalized || null
}

export function getHostname(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, '').toLowerCase()
  } catch {
    return null
  }
}

export function uniqueDomains(domains: string[]): string[] {
  return Array.from(
    new Set(domains.map(normalizeDomain).filter((d): d is string => !!d))
  )
}

export function isOfficialSwissTaxUrl(
  url: string,
  officialDomains: readonly string[] = STATIC_OFFICIAL_SWISS_TAX_DOMAINS
): boolean {
  const hostname = getHostname(url)
  if (!hostname) return false

  return officialDomains.some(domain => {
    const normalized = normalizeDomain(domain)
    if (!normalized) return false
    return hostname === normalized || hostname.endsWith(`.${normalized}`)
  })
}

export function filterOfficialUrls<T extends { url: string }>(
  items: T[],
  officialDomains: readonly string[]
): T[] {
  return items.filter(item => isOfficialSwissTaxUrl(item.url, officialDomains))
}
