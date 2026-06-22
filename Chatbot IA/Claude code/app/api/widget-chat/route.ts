import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { callMistral } from '@/lib/mistral/client'
import { widgetTools } from '@/lib/mistral/widget-tools'
import { getSystemPrompt, DEFAULT_TRADE_TEMPLATES } from '@/lib/mistral/trade-templates'
import { sendNewLeadNotification } from '@/lib/resend/client'
import type { Trade } from '@/types'

export const maxDuration = 30

// Simple in-memory rate limiter (per process — for production use Redis/Upstash)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(key)

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }

  if (entry.count >= maxRequests) return false
  entry.count++
  return true
}

function hashIp(ip: string): string {
  let hash = 0
  for (let i = 0; i < ip.length; i++) {
    const char = ip.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return hash.toString(16)
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}

export async function POST(request: Request) {
  const corsHeaders = { 'Access-Control-Allow-Origin': '*' }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || '0.0.0.0'
  const ipHash = hashIp(ip)

  // Rate limit: 20 messages per minute per IP
  if (!checkRateLimit(`ip:${ipHash}`, 20, 60_000)) {
    return NextResponse.json({ error: 'Trop de messages. Attendez une minute.' }, { status: 429, headers: corsHeaders })
  }

  const body = await request.json()
  const { slug, conversation_id, message, messages: history } = body as {
    slug: string
    conversation_id: string
    message: string
    messages: Array<{ role: string; content: string }>
  }

  if (!slug || !message) {
    return NextResponse.json({ error: 'Paramètres manquants.' }, { status: 400, headers: corsHeaders })
  }

  // Rate limit per conversation
  if (conversation_id && !checkRateLimit(`conv:${conversation_id}`, 50, 60_000)) {
    return NextResponse.json({ error: 'Limite atteinte pour cette conversation.' }, { status: 429, headers: corsHeaders })
  }

  const supabase = await createServiceClient()

  // Load artisan by slug
  const { data: artisan, error: artisanError } = await supabase
    .from('artisans')
    .select('id, company_name, trade, widget_bot_name, widget_welcome_message, subscription_status')
    .eq('public_slug', slug)
    .single()

  if (artisanError || !artisan || artisan.subscription_status !== 'active') {
    return NextResponse.json({ error: 'Service non disponible.' }, { status: 404, headers: corsHeaders })
  }

  // Load or create conversation
  let convId = conversation_id
  if (!convId) {
    const { data: conv } = await supabase
      .from('conversations')
      .insert({ artisan_id: artisan.id, source_ip_hash: ipHash })
      .select('id')
      .single()
    convId = conv?.id
  }

  // Measure first response time
  const startTime = Date.now()
  const { count } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .eq('conversation_id', convId)

  // Save user message
  await supabase.from('messages').insert({
    conversation_id: convId,
    role: 'visitor',
    content: message,
  })

  // Load trade template
  const trade = (artisan.trade || 'autre') as Trade

  const { data: customTemplate } = await supabase
    .from('trade_templates')
    .select('questions, system_prompt_extra')
    .eq('artisan_id', artisan.id)
    .eq('is_default', false)
    .single()

  const template = customTemplate || DEFAULT_TRADE_TEMPLATES[trade]
  const systemPrompt = getSystemPrompt(
    template,
    artisan.company_name || 'Artisan',
    artisan.widget_bot_name || 'ArtisanBot'
  )

  const mistralMessages = [
    { role: 'system' as const, content: systemPrompt },
    ...(history || []).slice(-10).map((m: { role: string; content: string }) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
    { role: 'user' as const, content: message },
  ]

  // Execute tool calls loop
  let response = await callMistral(mistralMessages, widgetTools)
  const currentMessages = [...mistralMessages]
  let assistantContent = ''
  let loopGuard = 0

  while (response.choices[0]?.message?.tool_calls && loopGuard < 3) {
    loopGuard++
    const assistantMsg = response.choices[0].message
    currentMessages.push({ role: 'assistant', content: assistantMsg.content || '', tool_calls: assistantMsg.tool_calls })

    for (const toolCall of assistantMsg.tool_calls!) {
      const toolArgs = JSON.parse(toolCall.function.arguments)
      let toolResult = ''

      if (toolCall.function.name === 'save_client_info') {
        const { name, email, phone } = toolArgs as { name: string; email?: string; phone?: string }

        const { data: existingClient } = email
          ? await supabase.from('clients').select('id').eq('artisan_id', artisan.id).eq('email', email).single()
          : { data: null }

        if (!existingClient) {
          const { data: newClient } = await supabase
            .from('clients')
            .insert({ artisan_id: artisan.id, name, email, phone })
            .select('id')
            .single()

          if (newClient) {
            await supabase.from('conversations').update({ client_id: newClient.id }).eq('id', convId)
          }
        } else {
          await supabase.from('conversations').update({ client_id: existingClient.id }).eq('id', convId)
        }
        toolResult = `Coordonnées sauvegardées pour ${name}.`

      } else if (toolCall.function.name === 'create_quote_draft') {
        const { description, estimated_amount } = toolArgs as { conversation_id: string; description: string; estimated_amount?: number; lines?: unknown[] }

        const { data: conv } = await supabase.from('conversations').select('client_id').eq('id', convId).single()
        if (conv?.client_id) {
          await supabase.from('quotes').insert({
            artisan_id: artisan.id,
            client_id: conv.client_id,
            conversation_id: convId,
            amount: estimated_amount || 0,
            details: { description },
            status: 'draft',
          })
        }

        // Notify artisan
        const { data: artisanFull } = await supabase.from('artisans').select('*').eq('id', artisan.id).single()
        if (artisanFull) {
          const { data: authUser } = await supabase.auth.admin.getUserById(artisan.id)
          const artisanEmail = authUser?.user?.email
          if (artisanEmail) {
            await sendNewLeadNotification({
              to: artisanEmail,
              artisanName: artisan.company_name || 'Artisan',
              clientDescription: description,
              source: 'widget',
            }).catch(() => {})
          }
        }

        toolResult = `Brouillon de devis créé pour: ${description}`

      } else if (toolCall.function.name === 'mark_conversation_qualified') {
        await supabase.from('conversations').update({ status: 'converted_to_quote' }).eq('id', convId)
        toolResult = 'Conversation qualifiée.'
      }

      currentMessages.push({ role: 'tool', content: toolResult, tool_call_id: toolCall.id } as never)
    }

    response = await callMistral(currentMessages as never, widgetTools)
  }

  assistantContent = response.choices[0]?.message?.content || 'Désolé, je n\'ai pas pu traiter votre demande.'

  // Save assistant message
  await supabase.from('messages').insert({
    conversation_id: convId,
    role: 'assistant',
    content: assistantContent,
  })

  // Record first response time
  if (count === 0) {
    const responseTime = (Date.now() - startTime) / 1000
    await supabase.from('conversations').update({ first_response_seconds: responseTime }).eq('id', convId)
  }

  // Update last_message_at
  await supabase.from('conversations').update({ last_message_at: new Date().toISOString() }).eq('id', convId)

  return NextResponse.json({ message: assistantContent, conversation_id: convId }, { headers: corsHeaders })
}
