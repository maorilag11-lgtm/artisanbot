import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { callMistral } from '@/lib/mistral/client'
import { sendNewLeadNotification } from '@/lib/resend/client'

const requestCounts = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = requestCounts.get(ip)
  if (!entry || now > entry.resetAt) {
    requestCounts.set(ip, { count: 1, resetAt: now + 60 * 60 * 1000 })
    return true
  }
  if (entry.count >= 5) return false
  entry.count++
  return true
}

function hashIp(ip: string): string {
  let hash = 0
  for (let i = 0; i < ip.length; i++) {
    hash = ((hash << 5) - hash) + ip.charCodeAt(i)
    hash = hash & hash
  }
  return hash.toString(16)
}

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || '0.0.0.0'
  const ipHash = hashIp(ip)

  if (!checkRateLimit(ipHash)) {
    return NextResponse.json({ error: 'Trop de demandes. Réessayez dans une heure.' }, { status: 429 })
  }

  const body = await request.json()
  const { slug, name, email, phone, description } = body as {
    slug: string
    name: string
    email: string
    phone?: string
    description: string
  }

  if (!slug || !name || !email || !description) {
    return NextResponse.json({ error: 'Champs obligatoires manquants.' }, { status: 400 })
  }

  const supabase = await createServiceClient()

  const { data: artisan, error: artisanError } = await supabase
    .from('artisans')
    .select('id, company_name, trade, subscription_status')
    .eq('public_slug', slug)
    .single()

  if (artisanError || !artisan || artisan.subscription_status !== 'active') {
    return NextResponse.json({ error: 'Artisan introuvable.' }, { status: 404 })
  }

  // Upsert client
  let clientId: string | undefined
  const { data: existingClient } = await supabase
    .from('clients')
    .select('id')
    .eq('artisan_id', artisan.id)
    .eq('email', email)
    .single()

  if (existingClient) {
    clientId = existingClient.id
  } else {
    const { data: newClient } = await supabase
      .from('clients')
      .insert({ artisan_id: artisan.id, name, email, phone })
      .select('id')
      .single()
    clientId = newClient?.id
  }

  // Insert quote request
  const { data: quoteRequest, error: insertError } = await supabase
    .from('quote_requests')
    .insert({
      artisan_id: artisan.id,
      client_id: clientId,
      raw_message: description,
      status: 'new',
      source_ip_hash: ipHash,
    })
    .select('id')
    .single()

  if (insertError || !quoteRequest) {
    return NextResponse.json({ error: 'Erreur lors de l\'enregistrement.' }, { status: 500 })
  }

  // Async qualification with AI (don't await to keep response fast)
  qualifyRequest(quoteRequest.id, artisan.id, artisan.trade, description, artisan.company_name)
    .catch(console.error)

  return NextResponse.json({ success: true, message: 'Votre demande a bien été reçue. Nous vous contacterons rapidement.' })
}

async function qualifyRequest(
  requestId: string,
  artisanId: string,
  trade: string | null,
  description: string,
  artisanName: string | null
) {
  const supabase = await createServiceClient()

  try {
    const response = await callMistral([
      {
        role: 'system',
        content: `Tu es un assistant qui qualifie des demandes de travaux pour un artisan ${trade || ''}.
Analyse la demande et retourne un JSON avec ces champs :
- trade_category: la catégorie de travaux (string)
- urgency: "faible", "moyen", ou "urgent"
- estimated_budget: budget estimé en euros (number, null si impossible à estimer)
Réponds uniquement avec le JSON, sans markdown.`,
      },
      { role: 'user', content: description },
    ])

    const content = response.choices[0]?.message?.content || '{}'
    let parsed: { trade_category?: string; urgency?: string; estimated_budget?: number } = {}

    try {
      parsed = JSON.parse(content)
    } catch {}

    await supabase
      .from('quote_requests')
      .update({
        trade_category: parsed.trade_category || null,
        urgency: parsed.urgency || 'moyen',
        estimated_budget: parsed.estimated_budget || null,
        status: 'qualified',
      })
      .eq('id', requestId)

    // Notify artisan
    const { data: authUser } = await supabase.auth.admin.getUserById(artisanId)
    const artisanEmail = authUser?.user?.email
    if (artisanEmail) {
      await sendNewLeadNotification({
        to: artisanEmail,
        artisanName: artisanName || 'Artisan',
        clientDescription: description,
        source: 'form',
      })
    }
  } catch (error) {
    console.error('Qualification error:', error)
    await supabase.from('quote_requests').update({ status: 'qualified' }).eq('id', requestId)
  }
}
