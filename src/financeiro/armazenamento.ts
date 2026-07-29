import type { EstadoFinanceiro } from './tipos'
import { estadoInicial } from './dadosIniciais'

const CHAVE = 'financeiro:estado:v1'

export function carregarEstado(): EstadoFinanceiro {
  if (typeof window === 'undefined') return estadoInicial()
  try {
    const bruto = window.localStorage.getItem(CHAVE)
    if (!bruto) return estadoInicial()
    const dados = JSON.parse(bruto) as EstadoFinanceiro
    if (!dados || !Array.isArray(dados.lancamentos)) return estadoInicial()
    return {
      ano: dados.ano ?? 2026,
      saldoInicial: dados.saldoInicial ?? 0,
      lancamentos: dados.lancamentos,
    }
  } catch {
    return estadoInicial()
  }
}

export function salvarEstado(estado: EstadoFinanceiro): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(CHAVE, JSON.stringify(estado))
  } catch {
    // Ignora falhas de quota/localStorage indisponível.
  }
}

export function gerarId(): string {
  return `lc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export function exportarJSON(estado: EstadoFinanceiro): void {
  const blob = new Blob([JSON.stringify(estado, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `financeiro_${estado.ano}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export function importarJSON(texto: string): EstadoFinanceiro | null {
  try {
    const dados = JSON.parse(texto) as EstadoFinanceiro
    if (!dados || !Array.isArray(dados.lancamentos)) return null
    return {
      ano: dados.ano ?? 2026,
      saldoInicial: dados.saldoInicial ?? 0,
      lancamentos: dados.lancamentos,
    }
  } catch {
    return null
  }
}
