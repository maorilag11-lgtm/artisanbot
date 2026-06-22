import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/client'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 })
  }

  let event
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = await createServiceClient()

  // Idempotency check
  const { data: existingEvent } = await supabase
    .from('processed_webhook_events')
    .select('event_id')
    .eq('event_id', event.id)
    .single()

  if (existingEvent) {
    return NextResponse.json({ received: true })
  }

  // Process event
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as { customer: string; subscription: string; metadata: Record<string, string> }
      const artisanId = session.metadata?.artisan_id

      if (artisanId) {
        await supabase
          .from('artisans')
          .update({
            stripe_customer_id: session.customer,
            stripe_subscription_id: session.subscription,
            subscription_status: 'active',
          })
          .eq('id', artisanId)
      }
      break
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as { id: string; status: string }
      const statusMap: Record<string, string> = {
        active: 'active',
        past_due: 'past_due',
        canceled: 'canceled',
        unpaid: 'past_due',
      }

      await supabase
        .from('artisans')
        .update({ subscription_status: statusMap[subscription.status] || 'inactive' })
        .eq('stripe_subscription_id', subscription.id)
      break
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as { id: string }
      await supabase
        .from('artisans')
        .update({ subscription_status: 'canceled' })
        .eq('stripe_subscription_id', subscription.id)
      break
    }
  }

  // Mark event as processed
  await supabase.from('processed_webhook_events').insert({ event_id: event.id })

  return NextResponse.json({ received: true })
}
