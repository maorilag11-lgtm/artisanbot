import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { QuotePDF } from '@/lib/pdf/quote-template'
import { sendQuoteEmail } from '@/lib/resend/client'
import React from 'react'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: artisan } = await supabase.from('artisans').select('*').eq('id', user.id).single()
  if (!artisan) return NextResponse.json({ error: 'Artisan not found' }, { status: 404 })

  const { data: quote } = await supabase
    .from('quotes')
    .select('*, clients(name, email, address, phone)')
    .eq('id', id)
    .eq('artisan_id', user.id)
    .single()

  if (!quote) return NextResponse.json({ error: 'Quote not found' }, { status: 404 })

  const client = quote.clients as { name?: string; email?: string; address?: string; phone?: string } | null
  if (!client?.email) return NextResponse.json({ error: 'Client has no email' }, { status: 400 })

  const lines = (quote.details as { lines?: Array<{ description: string; quantity: number; unit_price: number }> })?.lines || [{ description: 'Travaux', quantity: 1, unit_price: quote.amount }]

  const pdfDoc = React.createElement(QuotePDF, {
    quoteNumber: `DEV-${id.slice(0, 8).toUpperCase()}`,
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

  // Store in Supabase Storage
  const pdfPath = `quotes/${user.id}/${id}.pdf`
  await supabase.storage.from('documents').upload(pdfPath, Buffer.from(pdfBuffer), {
    contentType: 'application/pdf',
    upsert: true,
  })

  const { data: urlData } = supabase.storage.from('documents').getPublicUrl(pdfPath)

  await sendQuoteEmail({
    to: client.email,
    clientName: client.name || 'Client',
    artisanName: artisan.company_name || 'Artisan',
    quoteAmount: quote.amount,
    pdfBuffer: Buffer.from(pdfBuffer),
    quoteId: id,
  })

  await supabase.from('quotes').update({ status: 'sent', pdf_url: urlData.publicUrl }).eq('id', id)

  return NextResponse.json({ success: true, pdf_url: urlData.publicUrl })
}
