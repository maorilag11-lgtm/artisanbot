import { NextRequest, NextResponse } from 'next/server'
import { getOAuth2Client } from '@/lib/google/gmail'
import { createServiceClient } from '@/lib/supabase/server'
import { startWatchForAccount, initialFullSync } from '@/lib/google/gmail'
import { google } from 'googleapis'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state') // user_id

  if (!code || !state) {
    return NextResponse.redirect(new URL('/dashboard/settings?error=oauth_missing', req.url))
  }

  const oauth2Client = getOAuth2Client()

  let tokens
  try {
    const { tokens: t } = await oauth2Client.getToken(code)
    tokens = t
  } catch {
    return NextResponse.redirect(new URL('/dashboard/settings?error=oauth_failed', req.url))
  }

  if (!tokens.refresh_token) {
    return NextResponse.redirect(new URL('/dashboard/settings?error=no_refresh_token', req.url))
  }

  // Get Gmail address
  oauth2Client.setCredentials(tokens)
  const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client })
  const { data: userInfo } = await oauth2.userinfo.get()
  const gmailEmail = userInfo.email!

  const supabase = createServiceClient()

  const tokenExpiry = tokens.expiry_date
    ? new Date(tokens.expiry_date).toISOString()
    : null

  const { data: account, error } = await supabase
    .from('gmail_accounts')
    .upsert(
      {
        user_id: state,
        email: gmailEmail,
        refresh_token: tokens.refresh_token,
        access_token: tokens.access_token,
        token_expiry: tokenExpiry,
      },
      { onConflict: 'user_id,email' }
    )
    .select()
    .single()

  if (error || !account) {
    return NextResponse.redirect(new URL('/dashboard/settings?error=db_error', req.url))
  }

  // Activate Pub/Sub watch
  try {
    await startWatchForAccount(account.id)
  } catch (err) {
    console.error('Watch failed:', err)
  }

  // Initial inbox sync (non-blocking)
  initialFullSync(account.id, tokens.refresh_token).catch(console.error)

  return NextResponse.redirect(new URL('/dashboard/settings?gmail=connected', req.url))
}
