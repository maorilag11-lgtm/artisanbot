import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { markAsRead } from '@/lib/google/gmail'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { account_id, message_id } = await req.json()

  if (!account_id || !message_id) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const service = createServiceClient()

  const { data: account } = await service
    .from('gmail_accounts')
    .select('refresh_token')
    .eq('id', account_id)
    .eq('user_id', user.id)
    .single()

  if (!account) return NextResponse.json({ error: 'Account not found' }, { status: 404 })

  try {
    await markAsRead(account.refresh_token, message_id)

    // Update local DB
    await service
      .from('gmail_messages')
      .update({ is_read: true })
      .eq('gmail_account_id', account_id)
      .eq('message_id', message_id)

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
