import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// Configuração via variáveis de ambiente do Vite (definidas no deploy).
// Sem elas, o app funciona em "modo local" (dados só no navegador).
const URL = import.meta.env.VITE_SUPABASE_URL as string | undefined
const ANON = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const NUVEM_CONFIGURADA = Boolean(URL && ANON)

// Id do preço (price) da assinatura no Stripe — usado no checkout.
export const STRIPE_PRICE_ID = (import.meta.env.VITE_STRIPE_PRICE_ID as string | undefined) ?? ''

let cliente: SupabaseClient | null = null

/** Retorna o cliente Supabase, ou null se a nuvem não estiver configurada. */
export function supa(): SupabaseClient | null {
  if (!NUVEM_CONFIGURADA) return null
  if (!cliente) {
    cliente = createClient(URL!, ANON!, {
      auth: { persistSession: true, autoRefreshToken: true },
    })
  }
  return cliente
}
