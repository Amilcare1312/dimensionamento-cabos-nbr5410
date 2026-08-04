import type { EstadoCRM, Lead } from './tipos'
import { estadoVazio } from './dadosIniciais'

const CHAVE = 'crm:estado:v1'

function normalizarLead(l: Partial<Lead>): Lead {
  const agora = new Date().toISOString()
  return {
    id: l.id ?? gerarId('lead'),
    nome: l.nome ?? 'Sem nome',
    telefone: l.telefone ?? '',
    empresa: l.empresa,
    cidade: l.cidade,
    produto: l.produto ?? 'FV',
    origem: l.origem ?? 'WhatsApp',
    etapa: l.etapa ?? 'novo',
    temperatura: l.temperatura ?? 'morno',
    valorEstimado: typeof l.valorEstimado === 'number' ? l.valorEstimado : 0,
    responsavel: l.responsavel,
    observacoes: l.observacoes,
    proximoContato: l.proximoContato,
    motivoPerda: l.motivoPerda,
    tags: Array.isArray(l.tags) ? l.tags : [],
    interacoes: Array.isArray(l.interacoes) ? l.interacoes : [],
    criadoEm: l.criadoEm ?? agora,
    atualizadoEm: l.atualizadoEm ?? agora,
  }
}

function sanear(dados: Partial<EstadoCRM> | null): EstadoCRM | null {
  if (!dados || !Array.isArray(dados.leads)) return null
  return {
    leads: dados.leads.map(normalizarLead),
    templates: Array.isArray(dados.templates) ? dados.templates : [],
  }
}

export function carregarEstado(): EstadoCRM {
  if (typeof window === 'undefined') return estadoVazio()
  try {
    const bruto = window.localStorage.getItem(CHAVE)
    if (!bruto) return estadoVazio()
    return sanear(JSON.parse(bruto)) ?? estadoVazio()
  } catch {
    return estadoVazio()
  }
}

export function salvarEstado(estado: EstadoCRM): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(CHAVE, JSON.stringify(estado))
  } catch {
    // Ignora falhas de quota/localStorage indisponível.
  }
}

export function gerarId(prefixo = 'id'): string {
  return `${prefixo}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

export function exportarJSON(estado: EstadoCRM): void {
  const blob = new Blob([JSON.stringify(estado, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `crm_leads_${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export function importarJSON(texto: string): EstadoCRM | null {
  try {
    return sanear(JSON.parse(texto))
  } catch {
    return null
  }
}

/** Exporta os leads em CSV (Excel-friendly, separador ';'). */
export function exportarCSV(leads: Lead[]): void {
  const cab = [
    'Nome',
    'Telefone',
    'Empresa',
    'Cidade',
    'Produto',
    'Origem',
    'Etapa',
    'Temperatura',
    'ValorEstimado',
    'ProximoContato',
    'CriadoEm',
    'Observacoes',
  ]
  const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const linhas = leads.map((l) =>
    [
      l.nome,
      l.telefone,
      l.empresa,
      l.cidade,
      l.produto,
      l.origem,
      l.etapa,
      l.temperatura,
      l.valorEstimado,
      l.proximoContato,
      l.criadoEm?.slice(0, 10),
      l.observacoes,
    ]
      .map(esc)
      .join(';'),
  )
  // BOM para o Excel reconhecer UTF-8.
  const csv = '﻿' + [cab.join(';'), ...linhas].join('\r\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `crm_leads_${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
