import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { startWatchForAccount } from '@/lib/google/gmail'

// Cron: runs daily — renews Gmail watches expiring within 24h
// Add to vercel.json: { "path": "/api/cron/renew-gmail-watch", "schedule": "0 6 * * *" }
export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceClient()

  const cutoff = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

  const { data: accounts } = await supabase
    .from('gmail_accounts')
    .select('id')
    .eq('watch_active', true)
    .lt('watch_expiry', cutoff)

  if (!accounts?.length) {
    return NextResponse.json({ renewed: 0 })
  }

  let renewed = 0
  for (const account of accounts) {
    try {
      await startWatchForAccount(account.id)
      renewed++
    } catch (err) {
      console.error(`Watch renewal failed for ${account.id}:`, err)
    }
  }

  return NextResponse.json({ renewed })
}
