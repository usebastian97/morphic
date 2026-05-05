/**
 * GET /api/messages/[messageId]/evidence-score
 *
 * Returns the precomputed evidence score stored in `messages.metadata.evidence_score`
 * for the given message.  Uses the server-side Supabase client so RLS is enforced —
 * the caller must be authenticated and own the chat containing this message.
 *
 * Responses:
 *  200  { score: EvidenceScore }   — score is available
 *  200  { score: null }            — message exists but score not yet computed
 *  404  { error: "Not found" }     — message does not exist or access denied
 *  500  { error: string }          — unexpected server error
 */
import { NextResponse } from 'next/server'

import type { EvidenceScore } from '@/lib/agri/evidence-score'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ messageId: string }> }
): Promise<NextResponse> {
  const { messageId } = await params

  if (!messageId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('messages')
      .select('metadata')
      .eq('id', messageId)
      .single()

    if (error) {
      // PGRST116 = "no rows returned" — can also mean RLS denied access
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Not found' }, { status: 404 })
      }
      console.error('[evidence-score route] Supabase error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const metadata = data.metadata as Record<string, unknown> | null
    const score = (metadata?.evidence_score ?? null) as EvidenceScore | null

    return NextResponse.json({ score })
  } catch (err) {
    console.error('[evidence-score route] Unexpected error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
