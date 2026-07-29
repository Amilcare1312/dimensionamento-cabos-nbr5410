import type { EstadoFinanceiro } from '../financeiro/tipos'
import { estadoVazio } from '../financeiro/dadosIniciais'
import { supa } from './supabase'

// Persistência do estado financeiro na nuvem (uma linha por usuário).
// Tabela: financeiro_estado (user_id uuid pk, dados jsonb, updated_at timestamptz)

export async function carregarEstadoNuvem(userId: string): Promise<EstadoFinanceiro> {
  const cliente = supa()
  if (!cliente) return estadoVazio()
  const { data, error } = await cliente
    .from('financeiro_estado')
    .select('dados')
    .eq('user_id', userId)
    .maybeSingle()
  if (error || !data?.dados) return estadoVazio()
  const d = data.dados as EstadoFinanceiro
  return {
    ano: d.ano ?? new Date().getFullYear(),
    saldoInicial: d.saldoInicial ?? 0,
    lancamentos: Array.isArray(d.lancamentos) ? d.lancamentos : [],
  }
}

export async function salvarEstadoNuvem(userId: string, estado: EstadoFinanceiro): Promise<void> {
  const cliente = supa()
  if (!cliente) return
  await cliente
    .from('financeiro_estado')
    .upsert({ user_id: userId, dados: estado, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
}
