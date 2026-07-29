// Edge Function: cria uma sessão de Checkout do Stripe para o usuário logado.
// Deploy: supabase functions deploy create-checkout
// Segredos necessários: STRIPE_SECRET_KEY (SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY
// já são injetados automaticamente pelo Supabase).
import Stripe from 'https://esm.sh/stripe@17.0.0?target=denonext'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2?target=denonext'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', { apiVersion: '2024-09-30.acacia' })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  try {
    const authHeader = req.headers.get('Authorization') ?? ''
    const jwt = authHeader.replace('Bearer ', '')
    if (!jwt) return json({ error: 'Sem autenticação.' }, 401)

    // Cliente com service role (bypassa RLS) para ler/gravar mapeamentos.
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { data: userData, error: userErr } = await admin.auth.getUser(jwt)
    if (userErr || !userData.user) return json({ error: 'Usuário inválido.' }, 401)
    const user = userData.user

    const { priceId, sucessoUrl, cancelUrl } = await req.json()
    if (!priceId) return json({ error: 'priceId ausente.' }, 400)

    // Reaproveita (ou cria) o cliente Stripe do usuário.
    let customerId: string
    const { data: mapa } = await admin
      .from('stripe_customers')
      .select('customer_id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (mapa?.customer_id) {
      customerId = mapa.customer_id
    } else {
      const customer = await stripe.customers.create({
        email: user.email ?? undefined,
        metadata: { user_id: user.id },
      })
      customerId = customer.id
      await admin.from('stripe_customers').upsert({ user_id: user.id, customer_id: customerId })
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      allow_promotion_codes: true,
      success_url: sucessoUrl,
      cancel_url: cancelUrl,
      metadata: { user_id: user.id },
      subscription_data: { metadata: { user_id: user.id } },
    })

    return json({ url: session.url })
  } catch (e) {
    return json({ error: (e as Error).message }, 500)
  }
})

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  })
}
