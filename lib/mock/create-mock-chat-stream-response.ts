/**
 * Mock Chat Stream Response
 *
 * Returns a realistic AI SDK-compatible streaming response without calling any
 * external AI or search API. Used exclusively when ENABLE_MOCK_CHAT=true.
 *
 * REMOVAL: Delete this file and the lib/mock/ directory, then remove the
 * ENABLE_MOCK_CHAT guard block in app/api/chat/route.ts.
 */

import { consumeStream, createUIMessageStream, createUIMessageStreamResponse } from 'ai'
import { randomUUID } from 'crypto'

/** Delay helper (used to simulate streaming speed) */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/** Extract the plaintext content from the message parts array sent by the client */
function extractUserText(message: unknown): string {
  if (
    message !== null &&
    typeof message === 'object' &&
    'parts' in message &&
    Array.isArray((message as { parts: unknown[] }).parts)
  ) {
    const textPart = (message as { parts: { type?: string; text?: string }[] }).parts.find(
      p => p.type === 'text'
    )
    if (textPart?.text) return textPart.text
  }
  return 'your question'
}

/** Canned mock responses (cycling) — agriculture-themed to match AgriEvidence */
const MOCK_RESPONSES: string[] = [
  `Based on the search results, here is what the research says:

**Optimal soil pH for most crops** falls between 6.0 and 7.0. Slightly acidic to neutral conditions favour nutrient availability — particularly phosphorus, calcium, and magnesium.

**Key considerations:**
- Maize performs best between pH 5.8–7.0
- Wheat tolerates a slightly wider range: 5.5–7.5
- Legumes (soy, beans) benefit from pH 6.0–7.0 and require adequate calcium for root-nodule formation

Regular soil testing (every 2–3 seasons) and lime or sulfur amendments allow you to correct drift before yields are affected.

**Evidence:** This assessment draws on peer-reviewed agronomic trials from CGIAR and regional soil science institutes. Trust score: **High**.`,

  `The evidence on integrated pest management (IPM) for smallholder farmers consistently shows:

1. **Scouting first** — identify the pest and damage threshold before any intervention to avoid unnecessary chemical use.
2. **Biological controls** — natural enemies (parasitoid wasps, predatory beetles) reduce aphid and caterpillar pressure by 40–70% in field trials.
3. **Targeted, threshold-based spraying** — applying pesticide only when pest counts exceed the economic threshold cuts input costs by 30–50% without significant yield loss.

FAO IPM guidelines recommend a stepwise approach: cultural practices → biological → chemical (as last resort). This is consistent across sub-Saharan, South Asian, and Latin American smallholder contexts.`,

  `Drought-tolerant crop varieties recommended for semi-arid regions include:

| Crop | Variety | Yield advantage under drought |
|------|---------|-------------------------------|
| Maize | WEMA drought-tolerant hybrids | +20–30% vs. conventional |
| Sorghum | ICRISAT-developed lines | High tolerance; 450 mm rainfall threshold |
| Cowpea | IT97K-499-35 | Excellent heat + drought tolerance |
| Cassava | IITA TME series | Resilient at <600 mm/year |

**Planting date** is equally critical — early planting (onset of rains) ensures the grain-fill stage aligns with residual soil moisture.

Source: CGIAR Excellence in Breeding platform, IITA varietal release notes 2023.`,
]

let mockResponseIndex = 0

/** Fake search tool output that exercise the search-results UI components */
const MOCK_SEARCH_RESULTS = {
  results: [
    {
      title: '[MOCK] Soil pH and Nutrient Availability — FAO',
      url: 'https://www.fao.org/soils/mock',
      content: 'Mock result: FAO guidelines on soil pH management for tropical crops.',
      score: 0.92,
    },
    {
      title: '[MOCK] Crop Tolerance to Soil Acidity — CIMMYT',
      url: 'https://www.cimmyt.org/mock-soil-acidity',
      content: 'Mock result: CIMMYT research on maize tolerance to low-pH soils.',
      score: 0.88,
    },
    {
      title: '[MOCK] Integrated Soil Fertility Management — IITA',
      url: 'https://www.iita.org/mock-isfm',
      content: 'Mock result: IITA recommendations for smallholder soil management.',
      score: 0.81,
    },
  ],
  query: 'mock search query',
  used_fallback: false,
  providers_used: ['mock'],
}

interface MockRequestBody {
  message?: unknown
  chatId?: string
  trigger?: string
  searchMode?: string
}

/**
 * Creates a mock streaming chat response that is fully compatible with the
 * Vercel AI SDK client parser. No external calls are made.
 */
export async function createMockChatStreamResponse(
  body: MockRequestBody
): Promise<Response> {
  const userText = extractUserText(body.message)
  const searchMode = (body.searchMode as string) ?? 'adaptive'
  const mockModelId = 'mock:mock-model'
  const toolCallId = `mock-tool-${randomUUID().slice(0, 8)}`

  // Pick the next canned response (cycling)
  const responseText = MOCK_RESPONSES[mockResponseIndex % MOCK_RESPONSES.length]!
  mockResponseIndex++

  const words = responseText.split(' ')

  const stream = createUIMessageStream({
    execute: async ({ writer }) => {
      // 1. Emit start chunk (metadata mirrors what the real stream sends)
      writer.write({
        type: 'start',
        messageId: randomUUID(),
        messageMetadata: {
          searchMode,
          modelId: mockModelId,
          traceId: undefined,
        },
      })

      writer.write({ type: 'start-step' })

      // 2. Simulate a "search" tool call
      writer.write({
        type: 'tool-input-start',
        toolCallId,
        toolName: 'search',
      })

      await delay(80)

      const searchQuery = `[MOCK] ${userText.slice(0, 60)}`
      writer.write({
        type: 'tool-input-available',
        toolCallId,
        toolName: 'search',
        input: { query: searchQuery },
      })

      await delay(250)

      writer.write({
        type: 'tool-output-available',
        toolCallId,
        output: MOCK_SEARCH_RESULTS,
      })

      writer.write({ type: 'finish-step' })
      writer.write({ type: 'start-step' })

      // 3. Stream text response word-by-word
      const textId = randomUUID()
      writer.write({ type: 'text-start', id: textId })

      for (const word of words) {
        writer.write({
          type: 'text-delta',
          id: textId,
          delta: word + ' ',
        })
        await delay(28)
      }

      writer.write({ type: 'text-end', id: textId })

      writer.write({ type: 'finish-step' })

      // 4. Finish
      writer.write({
        type: 'finish',
        finishReason: 'stop',
        messageMetadata: {
          searchMode,
          modelId: mockModelId,
          traceId: undefined,
        },
      })
    },
    onError: (error: unknown) =>
      error instanceof Error ? error.message : String(error),
  })

  return createUIMessageStreamResponse({
    stream,
    consumeSseStream: consumeStream,
  })
}
