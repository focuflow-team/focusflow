import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { createServiceClient } from '@/lib/supabase/service'
import type { Stripe as StripeTypes } from 'stripe'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: StripeTypes.Event
  try {
    event = getStripe().webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Webhook verification failed'
    return NextResponse.json({ error: message }, { status: 400 })
  }

  const supabase = createServiceClient()

  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const subscription = event.data.object as StripeTypes.Subscription
      const userId = subscription.metadata?.supabase_user_id

      if (!userId) break

      const plan = subscription.metadata?.plan as 'pro' | 'team' | undefined
      const tier = plan === 'team' ? 'team' : plan === 'pro' ? 'pro' : 'free'
      const isActive = ['active', 'trialing'].includes(subscription.status)

      await supabase
        .from('profiles')
        .update({
          subscription_tier: isActive ? tier : 'free',
          stripe_subscription_id: subscription.id,
        })
        .eq('id', userId)
      break
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as StripeTypes.Subscription
      const userId = subscription.metadata?.supabase_user_id

      if (!userId) break

      await supabase
        .from('profiles')
        .update({
          subscription_tier: 'free',
          stripe_subscription_id: null,
        })
        .eq('id', userId)
      break
    }

    case 'checkout.session.completed': {
      // Subscription activation is handled by subscription.created/updated events
      // This is a no-op but kept for logging completeness
      void event.data.object
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as StripeTypes.Invoice
      // Subscription will eventually move to past_due/canceled, handled above
      void invoice
      break
    }
  }

  return NextResponse.json({ received: true })
}
