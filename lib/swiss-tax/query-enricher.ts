import { generateText } from 'ai'

import type { UserProfile } from '@/lib/supabase/types'
import { getModel } from '@/lib/utils/registry'

import { buildQueryEnricherUserContext } from './user-context'

const QUERY_ENRICHER_MODEL = 'deepseek:deepseek-v4-flash'
const QUERY_ENRICHER_TIMEOUT_MS = 3000

function cleanQueryLine(line: string): string {
  return line
    .trim()
    .replace(/^[-*]\s+/, '')
    .replace(/^\d+[.)]\s+/, '')
    .replace(/^['"]|['"]$/g, '')
    .trim()
}

function parseQueryLines(text: string): string[] {
  return text
    .split('\n')
    .map(cleanQueryLine)
    .filter(line => line.length > 0 && !line.startsWith('```'))
    .slice(0, 3)
}

export async function enrichQuery(
  userQuery: string,
  userProfile?: UserProfile | null
): Promise<string[]> {
  const controller = new AbortController()
  let timeoutId: ReturnType<typeof setTimeout> | undefined

  try {
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        controller.abort()
        reject(new Error('Query enrichment timed out'))
      }, QUERY_ENRICHER_TIMEOUT_MS)
    })

    const userContext = buildQueryEnricherUserContext(userProfile)

    const { text } = await Promise.race([
      generateText({
        model: getModel(QUERY_ENRICHER_MODEL),
        system: `You are a Swiss tax search query specialist.
Rewrite the user's question into two or three precise search queries optimized for official Swiss federal, cantonal, and municipal tax websites.

${userContext ? `User context for jurisdiction specificity: ${userContext}` : ''}

Rules:
- Prefer official Swiss tax terminology in the likely language of the source: German, French, Italian, and English where useful.
- Add ESTV, AFC, MWST, TVA, IVA, direkte Bundessteuer, canton names, form, deadline, legal basis, or official news terms when they match the question.
- If the question mentions or implies a canton, include that canton in at least one query.
- Keep the queries suitable for official government search results only.
- Return only query strings with no explanation, bullets, numbering, or formatting.
- Put one query per line.

Example input: "latest vat changes in switzerland"
Example output:
ESTV MWST Aenderungen Schweiz aktuell
AFC TVA modifications Suisse actualites officielles
Swiss VAT changes Federal Tax Administration official`,
        prompt: userQuery,
        abortSignal: controller.signal
      }),
      timeoutPromise
    ])

    const queries = parseQueryLines(text)

    return queries.length > 0 ? queries : [userQuery]
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[SwissTaxQueryEnricher] falling back to raw query:', error)
    }

    return [userQuery]
  } finally {
    if (timeoutId) clearTimeout(timeoutId)
  }
}
