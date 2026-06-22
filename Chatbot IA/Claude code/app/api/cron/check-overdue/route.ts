import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { sendReminderEmail } from '@/lib/resend/client'

export const maxDuration = 60

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createServiceClient()
  const today = new Date().toISOString().split('T')[0]

  // Mark overdue invoices
  await supabase
    .from('invoices')
    .update({ status: 'overdue' })
    .eq('status', 'pending')
    .lt('due_date', today)

  // Get all artisans with active subscriptions and reminders enabled
  const { data: artisans } = await supabase
    .from('artisans')
    .select('id, company_name')
    .eq('subscription_status', 'active')

  if (!artisans) return NextResponse.json({ ok: true, processed: 0 })

  let processed = 0

  for (const artisan of artisans) {
    // Load automation settings
    const { data: settings } = await supabase
      .from('automation_settings')
      .select('reminder_enabled, reminder_delay_days')
      .eq('artisan_id', artisan.id)
      .single()

    const reminderEnabled = settings?.reminder_enabled ?? true
    const reminderDelayDays = settings?.reminder_delay_days ?? 7

    if (!reminderEnabled) continue

    // Find overdue invoices that need reminders
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - reminderDelayDays)

    const { data: invoices } = await supabase
      .from('invoices')
      .select('*, clients(name, email)')
      .eq('artisan_id', artisan.id)
      .eq('status', 'overdue')
      .lt('due_date', cutoffDate.toISOString().split('T')[0])
      .or('last_reminder_sent_at.is.null,last_reminder_sent_at.lt.' + cutoffDate.toISOString())

    if (!invoices) continue

    for (const invoice of invoices) {
      const client = invoice.clients as { name?: string; email?: string } | null
      if (!client?.email) continue

      const daysLate = Math.floor((new Date().getTime() - new Date(invoice.due_date).getTime()) / (1000 * 60 * 60 * 24))

      try {
        await sendReminderEmail({
          to: client.email,
          clientName: client.name || 'Client',
          artisanName: artisan.company_name || 'Artisan',
          invoiceAmount: invoice.amount,
          dueDate: new Date(invoice.due_date).toLocaleDateString('fr-FR'),
          invoiceId: invoice.id,
          daysPastDue: daysLate,
        })

        await supabase
          .from('invoices')
          .update({ last_reminder_sent_at: new Date().toISOString() })
          .eq('id', invoice.id)

        processed++
      } catch (error) {
        console.error(`Failed to send reminder for invoice ${invoice.id}:`, error)
      }
    }
  }

  return NextResponse.json({ ok: true, processed })
}
