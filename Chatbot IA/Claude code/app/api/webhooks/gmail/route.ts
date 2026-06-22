import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { syncGmailHistoryForAccount } from '@/lib/google/gmail'

export async function POST(req: NextRequest) {
  // Verify the request comes from Pub/Sub (OIDC token validation)
  // In production, validate the Bearer token from Google's OIDC
  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  // Pub/Sub message format
  const message = body?.message
  if (!message?.data) {
    return NextResponse.json({ ok: true }) // ack empty messages
  }

  let decoded: { emailAddress: string; historyId: number }
  try {
    const raw = Buffer.from(message.data, 'base64').toString('utf-8')
    decoded = JSON.parse(raw)
  } catch {
    return NextResponse.json({ error: 'Decode failed' }, { status: 400 })
  }

  const { emailAddress, historyId } = decoded

  if (!emailAddress || !historyId) {
    return NextResponse.json({ ok: true })
  }

  const supabase = createServiceClient()

  const { data: account } = await supabase
    .from('gmail_accounts')
    .select('id, refresh_token, history_id')
    .eq('email', emailAddress)
    .single()

  if (!account) {
    // Unknown account — ack to avoid retry storm
    return NextResponse.json({ ok: true })
  }

  try {
    await syncGmailHistoryForAccount(account, String(historyId))
  } catch (err) {
    console.error('Sync error:', err)
    // Return 500 so Pub/Sub retries
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
