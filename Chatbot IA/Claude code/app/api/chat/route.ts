import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { callMistral } from '@/lib/mistral/client'
import { assistantTools } from '@/lib/mistral/assistant-tools'
import { listEvents, createEvent } from '@/lib/google-calendar/client'
import { renderToBuffer } from '@react-pdf/renderer'
import { QuotePDF } from '@/lib/pdf/quote-template'
import { InvoicePDF } from '@/lib/pdf/invoice-template'
import { sendQuoteEmail, sendInvoiceEmail, sendReminderEmail } from '@/lib/resend/client'
import React from 'react'

export const maxDuration = 30

async function executeToolCall(
  toolName: string,
  args: Record<string, unknown>,
  artisanId: string
): Promise<string> {
  const supabase = await createClient()
  const { data: artisan } = await supabase
    .from('artisans')
    .select('*')
    .eq('id', artisanId)
    .single()

  if (!artisan) return 'Erreur: artisan introuvable'

  switch (toolName) {
    case 'list_pending_quote_requests': {
      const { data } = await supabase
        .from('quote_requests')
        .select('id, raw_message, trade_category, urgency, created_at, clients(name, email)')
        .eq('artisan_id', artisanId)
        .eq('status', 'new')
        .order('created_at', { ascending: false })
        .limit(10)

      if (!data || data.length === 0) return 'Aucune demande de devis en attente.'
      return data.map((r: Record<string, unknown>) => {
        const client = r.clients as { name?: string; email?: string } | null
        return `• ${client?.name || 'Anonyme'} (${client?.email || 'pas d\'email'}) - ${(r.raw_message as string).slice(0, 100)}... - Urgence: ${r.urgency || 'inconnue'}`
      }).join('\n')
    }

    case 'list_active_conversations': {
      const { data } = await supabase
        .from('conversations')
        .select('id, started_at, last_message_at, clients(name, email)')
        .eq('artisan_id', artisanId)
        .eq('status', 'active')
        .order('last_message_at', { ascending: false })
        .limit(10)

      if (!data || data.length === 0) return 'Aucune conversation active en ce moment.'
      return data.map((c: Record<string, unknown>) => {
        const client = c.clients as { name?: string; email?: string } | null
        return `• ${client?.name || 'Visiteur anonyme'} - Dernière activité: ${new Date(c.last_message_at as string).toLocaleString('fr-FR')}`
      }).join('\n')
    }

    case 'create_quote': {
      const { client_name, client_email, amount, description, lines } = args as {
        client_name: string
        client_email?: string
        amount: number
        description: string
        lines?: Array<{ description: string; quantity: number; unit_price: number }>
      }

      // Upsert client
      let clientId: string
      if (client_email) {
        const { data: existingClient } = await supabase
          .from('clients')
          .select('id')
          .eq('artisan_id', artisanId)
          .eq('email', client_email)
          .single()

        if (existingClient) {
          clientId = existingClient.id
        } else {
          const { data: newClient } = await supabase
            .from('clients')
            .insert({ artisan_id: artisanId, name: client_name, email: client_email })
            .select('id')
            .single()
          clientId = newClient!.id
        }
      } else {
        const { data: newClient } = await supabase
          .from('clients')
          .insert({ artisan_id: artisanId, name: client_name })
          .select('id')
          .single()
        clientId = newClient!.id
      }

      const quoteLinesData = lines || [{ description: description, quantity: 1, unit_price: amount }]
      const { data: quote } = await supabase
        .from('quotes')
        .insert({ artisan_id: artisanId, client_id: clientId, amount, details: { lines: quoteLinesData, description } })
        .select('id')
        .single()

      return `Devis créé avec succès (ID: ${quote?.id}). Montant: ${amount} €. Vous pouvez maintenant l'envoyer avec send_quote.`
    }

    case 'send_quote': {
      const { quote_id } = args as { quote_id: string }

      const { data: quote } = await supabase
        .from('quotes')
        .select('*, clients(name, email, address, phone)')
        .eq('id', quote_id)
        .eq('artisan_id', artisanId)
        .single()

      if (!quote) return 'Devis introuvable.'
      const client = quote.clients as { name?: string; email?: string; address?: string; phone?: string } | null
      if (!client?.email) return 'Le client n\'a pas d\'adresse email. Impossible d\'envoyer le devis.'

      const lines = (quote.details as { lines?: Array<{ description: string; quantity: number; unit_price: number }> })?.lines || [{ description: 'Travaux', quantity: 1, unit_price: quote.amount }]

      const pdfDoc = React.createElement(QuotePDF, {
        quoteNumber: `DEV-${quote_id.slice(0, 8).toUpperCase()}`,
        artisan: {
          company_name: artisan.company_name || 'Artisan',
          trade: artisan.trade || '',
          phone: artisan.phone || '',
          address: artisan.address || '',
        },
        client: { name: client.name || '', email: client.email, address: client.address || undefined, phone: client.phone || undefined },
        lines,
        createdAt: quote.created_at,
      })

      const pdfBuffer = await renderToBuffer(pdfDoc)

      await sendQuoteEmail({
        to: client.email,
        clientName: client.name || 'Client',
        artisanName: artisan.company_name || 'Artisan',
        quoteAmount: quote.amount,
        pdfBuffer: Buffer.from(pdfBuffer),
        quoteId: quote_id,
      })

      await supabase.from('quotes').update({ status: 'sent' }).eq('id', quote_id)

      return `Devis envoyé par email à ${client.email}. Le devis est maintenant marqué comme "envoyé".`
    }

    case 'get_planning': {
      const { date_from, date_to } = args as { date_from: string; date_to?: string }
      if (!artisan.google_refresh_token) return 'Google Calendar non connecté. Configurez-le dans les paramètres.'

      const timeMax = date_to ? new Date(date_to).toISOString() : new Date(new Date(date_from).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()

      const events = await listEvents(
        artisan.google_refresh_token,
        artisan.google_calendar_id || 'primary',
        new Date(date_from).toISOString(),
        timeMax
      )

      if (events.length === 0) return 'Aucun rendez-vous pour cette période.'
      return events.map(e => {
        const start = new Date(e.start.dateTime)
        return `• ${e.summary} — ${start.toLocaleDateString('fr-FR')} à ${start.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
      }).join('\n')
    }

    case 'create_appointment': {
      const { client_name, title, start_time, end_time } = args as {
        client_name?: string
        title: string
        start_time: string
        end_time: string
      }

      if (!artisan.google_refresh_token) return 'Google Calendar non connecté.'

      const calendarTitle = client_name ? `${title} — ${client_name}` : title

      const event = await createEvent(
        artisan.google_refresh_token,
        { summary: calendarTitle, start: { dateTime: start_time, timeZone: 'Europe/Paris' }, end: { dateTime: end_time, timeZone: 'Europe/Paris' } },
        artisan.google_calendar_id || 'primary'
      )

      await supabase.from('appointments').insert({
        artisan_id: artisanId,
        title: calendarTitle,
        start_time,
        end_time,
        google_event_id: event.id,
      })

      return `Rendez-vous créé : "${calendarTitle}" le ${new Date(start_time).toLocaleDateString('fr-FR')} à ${new Date(start_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}. Ajouté à votre Google Calendar.`
    }

    case 'create_invoice': {
      const { quote_id, due_date } = args as { quote_id: string; due_date: string }

      const { data: quote } = await supabase.from('quotes').select('*').eq('id', quote_id).eq('artisan_id', artisanId).single()
      if (!quote) return 'Devis introuvable.'

      const { data: invoice } = await supabase
        .from('invoices')
        .insert({ artisan_id: artisanId, client_id: quote.client_id, quote_id, amount: quote.amount, due_date, status: 'pending' })
        .select('id')
        .single()

      return `Facture créée (ID: ${invoice?.id}) d'un montant de ${quote.amount} €, échéance le ${due_date}.`
    }

    case 'send_invoice': {
      const { invoice_id } = args as { invoice_id: string }

      const { data: invoice } = await supabase
        .from('invoices')
        .select('*, clients(name, email, address, phone), quotes(details)')
        .eq('id', invoice_id)
        .eq('artisan_id', artisanId)
        .single()

      if (!invoice) return 'Facture introuvable.'
      const client = invoice.clients as { name?: string; email?: string; address?: string; phone?: string } | null
      if (!client?.email) return 'Le client n\'a pas d\'adresse email.'

      const lines = ((invoice.quotes as { details?: { lines?: Array<{ description: string; quantity: number; unit_price: number }> } } | null)?.details?.lines) || [{ description: 'Travaux', quantity: 1, unit_price: invoice.amount }]

      const pdfDoc = React.createElement(InvoicePDF, {
        invoiceNumber: `FAC-${invoice_id.slice(0, 8).toUpperCase()}`,
        artisan: { company_name: artisan.company_name || 'Artisan', trade: artisan.trade || '', phone: artisan.phone || '', address: artisan.address || '' },
        client: { name: client.name || '', email: client.email, address: client.address || undefined, phone: client.phone || undefined },
        lines,
        createdAt: invoice.created_at,
        dueDate: invoice.due_date,
      })

      const pdfBuffer = await renderToBuffer(pdfDoc)
      await sendInvoiceEmail({
        to: client.email,
        clientName: client.name || 'Client',
        artisanName: artisan.company_name || 'Artisan',
        invoiceAmount: invoice.amount,
        dueDate: new Date(invoice.due_date).toLocaleDateString('fr-FR'),
        pdfBuffer: Buffer.from(pdfBuffer),
        invoiceId: invoice_id,
      })

      return `Facture envoyée à ${client.email}.`
    }

    case 'list_overdue_invoices': {
      const today = new Date().toISOString().split('T')[0]
      const { data } = await supabase
        .from('invoices')
        .select('id, amount, due_date, clients(name, email)')
        .eq('artisan_id', artisanId)
        .in('status', ['pending', 'overdue'])
        .lt('due_date', today)

      if (!data || data.length === 0) return 'Aucune facture en retard. 🎉'
      return data.map((inv: Record<string, unknown>) => {
        const client = inv.clients as { name?: string; email?: string } | null
        const daysLate = Math.floor((new Date().getTime() - new Date(inv.due_date as string).getTime()) / (1000 * 60 * 60 * 24))
        return `• ${client?.name || 'Inconnu'} — ${(inv.amount as number).toLocaleString('fr-FR')} € — ${daysLate} jour(s) de retard (ID: ${inv.id})`
      }).join('\n')
    }

    case 'send_reminder': {
      const { invoice_id } = args as { invoice_id: string }

      const { data: invoice } = await supabase
        .from('invoices')
        .select('*, clients(name, email)')
        .eq('id', invoice_id)
        .eq('artisan_id', artisanId)
        .single()

      if (!invoice) return 'Facture introuvable.'
      const client = invoice.clients as { name?: string; email?: string } | null
      if (!client?.email) return 'Le client n\'a pas d\'adresse email.'

      const daysLate = Math.floor((new Date().getTime() - new Date(invoice.due_date).getTime()) / (1000 * 60 * 60 * 24))

      await sendReminderEmail({
        to: client.email,
        clientName: client.name || 'Client',
        artisanName: artisan.company_name || 'Artisan',
        invoiceAmount: invoice.amount,
        dueDate: new Date(invoice.due_date).toLocaleDateString('fr-FR'),
        invoiceId: invoice_id,
        daysPastDue: daysLate,
      })

      await supabase.from('invoices').update({ status: 'overdue', last_reminder_sent_at: new Date().toISOString() }).eq('id', invoice_id)

      return `Relance envoyée à ${client.email} pour la facture de ${invoice.amount} € (${daysLate} jours de retard).`
    }

    default:
      return `Outil inconnu: ${toolName}`
  }
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: artisan } = await supabase.from('artisans').select('*').eq('id', user.id).single()
  if (!artisan) return NextResponse.json({ error: 'Artisan not found' }, { status: 404 })

  const { messages: clientMessages } = await request.json()

  const systemPrompt = `Tu es l'assistant IA personnel de ${artisan.company_name || 'un artisan'} (${artisan.trade || 'artisan'}).
Tu l'aides à gérer son activité en langage naturel : devis, factures, planning, relances clients.
Sois professionnel, concis et efficace. Tu réponds toujours en français.
Date du jour : ${new Date().toLocaleDateString('fr-FR')}.

Quand tu effectues une action, confirme-le clairement. Si tu as besoin de plus d'informations, demande-les.`

  const messages = [
    { role: 'system' as const, content: systemPrompt },
    ...clientMessages.slice(-20).map((m: { role: string; content: string }) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
  ]

  // Log user message
  await supabase.from('chat_messages').insert({
    artisan_id: user.id,
    role: 'user',
    content: clientMessages[clientMessages.length - 1]?.content || '',
  })

  let response = await callMistral(messages, assistantTools)
  let finalMessage = ''

  // Handle tool calls loop
  const currentMessages = [...messages]
  let loopGuard = 0

  while (response.choices[0]?.message?.tool_calls && loopGuard < 5) {
    loopGuard++
    const assistantMsg = response.choices[0].message
    currentMessages.push({ role: 'assistant', content: assistantMsg.content || '', tool_calls: assistantMsg.tool_calls })

    for (const toolCall of assistantMsg.tool_calls!) {
      const toolArgs = JSON.parse(toolCall.function.arguments)
      const toolResult = await executeToolCall(toolCall.function.name, toolArgs, user.id)

      await supabase.from('chat_messages').insert({
        artisan_id: user.id,
        role: 'tool',
        content: toolResult,
        tool_call: { name: toolCall.function.name, args: toolArgs },
      })

      currentMessages.push({
        role: 'tool',
        content: toolResult,
        tool_call_id: toolCall.id,
      } as never)
    }

    response = await callMistral(currentMessages as never, assistantTools)
  }

  finalMessage = response.choices[0]?.message?.content || 'Je n\'ai pas pu traiter votre demande.'

  await supabase.from('chat_messages').insert({
    artisan_id: user.id,
    role: 'assistant',
    content: finalMessage,
  })

  return NextResponse.json({ message: finalMessage })
}
