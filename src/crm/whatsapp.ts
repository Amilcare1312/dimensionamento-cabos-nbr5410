import type { Lead } from './tipos'

/**
 * Normaliza um telefone digitado em formato livre para só-dígitos com DDI.
 * Regras (Brasil): se vier sem DDI (10 ou 11 dígitos), assume 55.
 */
export function normalizarTelefone(entrada: string): string {
  let s = (entrada || '').replace(/\D/g, '')
  if (!s) return ''
  // Remove zeros de operadora/tronco à esquerda (ex.: 0xx).
  s = s.replace(/^0+/, '')
  if (s.length === 10 || s.length === 11) s = `55${s}`
  return s
}

/** Verdadeiro quando o número tem tamanho plausível para wa.me. */
export function telefoneValido(digitos: string): boolean {
  const s = (digitos || '').replace(/\D/g, '')
  return s.length >= 12 && s.length <= 15
}

/**
 * Substitui variáveis de um template pelos dados do lead.
 * Variáveis: {nome}, {primeiroNome}, {empresa}, {cidade}, {produto}, {responsavel}.
 */
export function preencherTemplate(texto: string, lead: Partial<Lead>): string {
  const primeiroNome = (lead.nome ?? '').trim().split(/\s+/)[0] ?? ''
  const mapa: Record<string, string> = {
    nome: lead.nome ?? '',
    primeiroNome,
    empresa: lead.empresa ?? '',
    cidade: lead.cidade ?? '',
    produto: lead.produto ?? '',
    responsavel: lead.responsavel ?? '',
  }
  return texto.replace(/\{(\w+)\}/g, (bruto, chave: string) => {
    const v = mapa[chave]
    return v !== undefined && v !== '' ? v : bruto
  })
}

/** Monta o link wa.me (click-to-chat) com mensagem opcional pré-preenchida. */
export function linkWhatsApp(telefone: string, mensagem?: string): string {
  const num = normalizarTelefone(telefone)
  const base = `https://wa.me/${num}`
  if (mensagem && mensagem.trim()) {
    return `${base}?text=${encodeURIComponent(mensagem)}`
  }
  return base
}

/** Abre a conversa do WhatsApp em nova aba. */
export function abrirWhatsApp(telefone: string, mensagem?: string): void {
  if (typeof window === 'undefined') return
  window.open(linkWhatsApp(telefone, mensagem), '_blank', 'noopener,noreferrer')
}
