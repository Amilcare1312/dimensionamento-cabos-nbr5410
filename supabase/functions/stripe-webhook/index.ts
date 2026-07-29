// Edge Function: recebe eventos do Stripe e atualiza a tabela `subscriptions`.
// Deploy: supabase functions deploy stripe-webhook --no-verify-jwt
// Segredos: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET.
// Configure o endpoint no painel do Stripe apontando para a URL desta função,
// assinando os eventos: checkout.session.completed, customer.subscription.updated,
// customer.subscription.deleted, invoice.paid.
import Stripe from 'https://esm.sh/stripe@17.0.0?target=denonext'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2?target=denonext'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', { apiVersion: '2024-09-30.acacia' })
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? ''

const admin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

Deno.serve(async (req) => {
  const assinatura = req.headers.get('stripe-signature')
  if (!assinatura) return new Response('Sem assinatura', { status: 400 })

  const corpo = await req.text()
  let evento: Stripe.Event
  try {
    evento = await stripe.webhooks.constructEventAsync(corpo, assinatura, webhookSecret)
  } catch (e) {
    return new Response(`Assinatura inválida: ${(e as Error).message}`, { status: 400 })
  }

  try {
    switch (evento.type) {
      case 'checkout.session.completed': {
        const s = evento.data.object as Stripe.Checkout.Session
        if (s.subscription) {
          const sub = await stripe.subscriptions.retrieve(s.subscription as string)
          await gravar(sub)
        }
        break
      }
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        await gravar(evento.data.object as Stripe.Subscription)
        break
      }
      case 'invoice.paid': {
        const inv = evento.data.object as Stripe.Invoice
        if (inv.subscription) {
          const sub = await stripe.subscriptions.retrieve(inv.subscription as string)
          await gravar(sub)
        }
        break
      }
    }
  } catch (e) {
    return new Response(`Erro ao processar: ${(e as Error).message}`, { status: 500 })
  }

  return new Response(JSON.stringify({ recebido: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})

async function gravar(sub: Stripe.Subscription) {
  // Descobre o user_id pela metadata da assinatura ou pelo mapa de clientes.
  let userId = sub.metadata?.user_id as string | undefined
  if (!userId) {
    const { data } = await admin
      .from('stripe_customers')
      .select('user_id')
      .eq('customer_id', sub.customer as string)
      .maybeSingle()
    userId = data?.user_id
  }
  if (!userId) return

  await admin.from('subscriptions').upsert({
    user_id: userId,
    customer_id: sub.customer as string,
    subscription_id: sub.id,
    status: sub.status,
    price_id: sub.items.data[0]?.price.id ?? null,
    current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  })
}
