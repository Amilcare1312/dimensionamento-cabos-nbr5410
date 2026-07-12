import type { EntradaCircuito } from './calculos'

export interface CircuitoSalvo {
  id: string
  salvoEm: string
  entrada: EntradaCircuito
}

const CHAVE_STORAGE = 'nbr5410:circuitos'

export function carregarCircuitos(): CircuitoSalvo[] {
  if (typeof window === 'undefined') return []
  try {
    const bruto = window.localStorage.getItem(CHAVE_STORAGE)
    if (!bruto) return []
    return JSON.parse(bruto) as CircuitoSalvo[]
  } catch {
    return []
  }
}

export function salvarCircuitos(circuitos: CircuitoSalvo[]): void {
  window.localStorage.setItem(CHAVE_STORAGE, JSON.stringify(circuitos))
}

export function gerarIdCircuito(): string {
  return `circ_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}
