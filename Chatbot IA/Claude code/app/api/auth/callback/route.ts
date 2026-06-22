import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function generateSlug(name: string): string {
  const base = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 30)

  const suffix = Math.random().toString(36).slice(2, 7)
  return `${base}-${suffix}`
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      const user = data.user

      // Check if artisan profile exists
      const { data: existing } = await supabase
        .from('artisans')
        .select('id')
        .eq('id', user.id)
        .single()

      if (!existing) {
        // Create artisan profile
        const companyName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Mon Atelier'
        const slug = generateSlug(companyName)

        const { error: insertError } = await supabase
          .from('artisans')
          .insert({
            id: user.id,
            company_name: companyName,
            public_slug: slug,
            subscription_status: 'inactive',
          })

        if (insertError) {
          console.error('Error creating artisan profile:', insertError)
        }

        // Redirect to onboarding to select trade
        return NextResponse.redirect(`${origin}/dashboard/settings?onboarding=true`)
      }

      // Store Google refresh token if available
      if (data.session?.provider_refresh_token) {
        await supabase
          .from('artisans')
          .update({ google_refresh_token: data.session.provider_refresh_token })
          .eq('id', user.id)
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
