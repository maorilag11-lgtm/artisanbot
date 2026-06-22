import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { InvoicePDF } from '@/lib/pdf/invoice-template'
import { sendInvoiceEmail } from '@/lib/resend/client'
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

  const { data: invoice } = await supabase
    .from('invoices')
    .select('*, clients(name, email, address, phone), quotes(details)')
    .eq('id', id)
    .eq('artisan_id', user.id)
    .single()

  if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })

  const client = invoice.clients as { name?: string; email?: string; address?: string; phone?: string } | null
  if (!client?.email) return NextResponse.json({ error: 'Client has no email' }, { status: 400 })

  const lines = ((invoice.quotes as { details?: { lines?: Array<{ description: string; quantity: number; unit_price: number }> } } | null)?.details?.lines) || [{ description: 'Travaux', quantity: 1, unit_price: invoice.amount }]

  const pdfDoc = React.createElement(InvoicePDF, {
    invoiceNumber: `FAC-${id.slice(0, 8).toUpperCase()}`,
    artisan: { company_name: artisan.company_name || 'Artisan', trade: artisan.trade || '', phone: artisan.phone || '', address: artisan.address || '' },
    client: { name: client.name || '', email: client.email, address: client.address || undefined, phone: client.phone || undefined },
    lines,
    createdAt: invoice.created_at,
    dueDate: invoice.due_date,
  })

  const pdfBuffer = await renderToBuffer(pdfDoc)

  const pdfPath = `invoices/${user.id}/${id}.pdf`
  await supabase.storage.from('documents').upload(pdfPath, Buffer.from(pdfBuffer), {
    contentType: 'application/pdf',
    upsert: true,
  })

  const { data: urlData } = supabase.storage.from('documents').getPublicUrl(pdfPath)

  await sendInvoiceEmail({
    to: client.email,
    clientName: client.name || 'Client',
    artisanName: artisan.company_name || 'Artisan',
    invoiceAmount: invoice.amount,
    dueDate: new Date(invoice.due_date).toLocaleDateString('fr-FR'),
    pdfBuffer: Buffer.from(pdfBuffer),
    invoiceId: id,
  })

  await supabase.from('invoices').update({ pdf_url: urlData.publicUrl }).eq('id', id)

  return NextResponse.json({ success: true, pdf_url: urlData.publicUrl })
}
