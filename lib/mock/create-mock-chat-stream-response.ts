/**
 * Mock Chat Stream Response
 *
 * Returns a realistic AI SDK-compatible streaming response without calling any
 * external AI or search API. Used exclusively when ENABLE_MOCK_CHAT=true.
 *
 * REMOVAL: Delete this file and the lib/mock/ directory, then remove the
 * ENABLE_MOCK_CHAT guard block in app/api/chat/route.ts.
 */

import {
  consumeStream,
  createUIMessageStream,
  createUIMessageStreamResponse
} from 'ai'
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
    const textPart = (
      message as { parts: { type?: string; text?: string }[] }
    ).parts.find(p => p.type === 'text')
    if (textPart?.text) return textPart.text
  }
  return 'your question'
}

/** Canned mock responses (cycling) for SwissTaxSearch */
const MOCK_RESPONSES: string[] = [
  `### Direct Answer
The official Swiss tax answer depends on whether the question is federal, cantonal, or municipal. SwissTaxSearch prioritizes Federal Tax Administration and cantonal tax authority sources before summarizing the practical outcome.

### Official Source Update
- **Federal source:** Mock Federal Tax Administration guidance confirms that federal tax rules and forms should be checked first.
- **Cantonal source:** Mock Zurich tax office guidance shows that cantonal deadlines and deductions can differ by canton.

### Applicability
This mock answer is structured for Swiss federal and cantonal tax research.

### Practical Next Steps
- **Verify:** Check the official canton page and any linked forms.
- **Track dates:** Confirm filing or payment deadlines on the competent authority website.

### Source Confidence
Official mock sources were used for development mode only. This is not individualized tax or legal advice.`,

  `### Direct Answer
For Swiss VAT, start with official ESTV/MWST guidance and confirm whether the taxpayer is subject to registration, reporting, or rate changes.

### Official Source Update
- **ESTV:** Mock ESTV guidance is the primary source for MWST/TVA/IVA rules.
- **Fedlex:** Mock legal references should be used when a rule depends on statutory text.

### Applicability
VAT is federal, but some related business tax obligations can still vary by canton.

### Practical Next Steps
- **Search terms:** MWST, TVA, IVA, ESTV, registration threshold, tax period.
- **Forms:** Use only forms linked from ESTV or official cantonal portals.

### Source Confidence
Official mock sources were used for development mode only. This is not individualized tax or legal advice.`,

  `### Direct Answer
For cantonal deductions, SwissTaxSearch should search the relevant canton tax administration first, then compare with federal direct tax guidance.

### Official Source Update
- **Canton:** Mock cantonal guidance is authoritative for canton-specific deduction rules.
- **Federal:** Mock federal guidance is authoritative for direct federal tax treatment.

### Applicability
The result applies to the selected canton and may not transfer to other cantons.

### Practical Next Steps
- **Confirm canton:** Use the profile canton or ask the user when missing.
- **Use forms:** Link to the current official form or online portal when available.

### Source Confidence
Official mock sources were used for development mode only. This is not individualized tax or legal advice.`
]

let mockResponseIndex = 0

/** Fake search tool output that exercise the search-results UI components */
const MOCK_SEARCH_RESULTS = {
  results: [
    {
      title: '[MOCK] Federal Tax Administration - VAT guidance',
      url: 'https://www.estv.admin.ch/mock-vat',
      content: 'Mock result: ESTV guidance on Swiss VAT rules and forms.',
      score: 0.92
    },
    {
      title: '[MOCK] Canton Zurich tax office - deductions',
      url: 'https://www.zh.ch/mock-tax-deductions',
      content: 'Mock result: official Zurich tax information on deductions.',
      score: 0.88
    },
    {
      title: '[MOCK] Fedlex - Federal direct tax law',
      url: 'https://www.fedlex.admin.ch/mock-dbg',
      content: 'Mock result: federal law reference for Swiss direct tax.',
      score: 0.81
    }
  ],
  query: 'mock search query',
  used_fallback: false,
  providers_used: ['mock']
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
  const responseText =
    MOCK_RESPONSES[mockResponseIndex % MOCK_RESPONSES.length]!
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
          traceId: undefined
        }
      })

      writer.write({ type: 'start-step' })

      // 2. Simulate a "search" tool call
      writer.write({
        type: 'tool-input-start',
        toolCallId,
        toolName: 'search'
      })

      await delay(80)

      const searchQuery = `[MOCK] ${userText.slice(0, 60)}`
      writer.write({
        type: 'tool-input-available',
        toolCallId,
        toolName: 'search',
        input: { query: searchQuery }
      })

      await delay(250)

      writer.write({
        type: 'tool-output-available',
        toolCallId,
        output: MOCK_SEARCH_RESULTS
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
          delta: word + ' '
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
          traceId: undefined
        }
      })
    },
    onError: (error: unknown) =>
      error instanceof Error ? error.message : String(error)
  })

  return createUIMessageStreamResponse({
    stream,
    consumeSseStream: consumeStream
  })
}
