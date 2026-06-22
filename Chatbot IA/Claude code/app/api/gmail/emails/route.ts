import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getEmails } from '@/lib/google/gmail'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const accountId = searchParams.get('account_id')

  const service = createServiceClient()

  const query = service
    .from('gmail_messages')
    .select(`
      id,
      message_id,
      from_email,
      from_name,
      subject,
      snippet,
      labels,
      is_read,
      received_at,
      ai_events(event_type, status, result)
    `)
    .order('received_at', { ascending: false })
    .limit(50)

  if (accountId) {
    query.eq('gmail_account_id', accountId)
  } else {
    // Get all account ids for this user
    const { data: accounts } = await service
      .from('gmail_accounts')
      .select('id')
      .eq('user_id', user.id)

    const ids = accounts?.map((a) => a.id) ?? []
    query.in('gmail_account_id', ids)
  }

  const { data: messages, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ messages })
}
