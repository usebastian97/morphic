/**
 * GET /api/messages/[messageId]/export-pdf
 *
 * Returns a JSON payload (`MessageExportData`) containing all data needed to
 * generate the PDF on the client.  Uses the server-side Supabase client so
 * RLS is enforced — the caller must be authenticated and own the chat that
 * contains this message.
 *
 * Responses:
 *  200  { data: MessageExportData }  — export data is ready
 *  404  { error: "Not found" }       — message not found or access denied
 *  500  { error: string }            — unexpected server error
 */
import { NextResponse } from 'next/server'

import { getMessageExportData } from '@/lib/supabase/queries/export-message'
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

    const data = await getMessageExportData(messageId, supabase)

    if (!data) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json({ data })
  } catch (err) {
    console.error('[export-pdf route] Unexpected error:', {
      messageId,
      error: err instanceof Error ? err.message : String(err)
    })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
