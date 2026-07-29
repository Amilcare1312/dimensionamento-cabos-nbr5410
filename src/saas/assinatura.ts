import { supa, STRIPE_PRICE_ID } from './supabase'

// Estado da assinatura do usuário. A tabela `subscriptions` é mantida pelo
// webhook do Stripe (ver supabase/functions/stripe-webhook).
// Tabela: subscriptions (user_id uuid pk, status text, current_period_end timestamptz)

export type StatusAssinatura = 'ativa' | 'inativa' | 'periodo_teste' | 'desconhecido'

const STATUS_ATIVOS = new Set(['active', 'trialing', 'past_due'])

export async function buscarStatusAssinatura(userId: string): Promise<StatusAssinatura> {
  const cliente = supa()
  if (!cliente) return 'desconhecido'
  const { data, error } = await cliente
    .from('subscriptions')
    .select('status')
    .eq('user_id', userId)
    .maybeSingle()
  if (error || !data) return 'inativa'
  if (data.status === 'trialing') return 'periodo_teste'
  return STATUS_ATIVOS.has(data.status) ? 'ativa' : 'inativa'
}

/** Chama a Edge Function que cria a sessão de checkout do Stripe e redireciona. */
export async function iniciarCheckout(): Promise<{ erro?: string }> {
  const cliente = supa()
  if (!cliente) return { erro: 'Nuvem não configurada.' }
  const { data, error } = await cliente.functions.invoke('create-checkout', {
    body: {
      priceId: STRIPE_PRICE_ID,
      sucessoUrl: window.location.origin + window.location.pathname + '?assinatura=sucesso',
      cancelUrl: window.location.origin + window.location.pathname + '?assinatura=cancelada',
    },
  })
  if (error) return { erro: error.message }
  const url = (data as { url?: string })?.url
  if (!url) return { erro: 'Não foi possível iniciar o checkout.' }
  window.location.href = url
  return {}
}
