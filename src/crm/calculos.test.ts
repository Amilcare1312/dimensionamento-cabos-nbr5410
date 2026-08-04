import { describe, expect, it } from 'vitest'
import type { EstadoCRM, Lead } from './tipos'
import { calcularDashboard, pendenciasFollowup } from './calculos'
import { normalizarTelefone, preencherTemplate, telefoneValido, linkWhatsApp } from './whatsapp'
import { telefoneBR, diasAte } from './formatar'

function lead(p: Partial<Lead>): Lead {
  const agora = new Date().toISOString()
  return {
    id: p.id ?? Math.random().toString(36).slice(2),
    nome: p.nome ?? 'Fulano',
    telefone: p.telefone ?? '5548999998888',
    empresa: p.empresa,
    cidade: p.cidade,
    produto: p.produto ?? 'FV',
    origem: p.origem ?? 'WhatsApp',
    etapa: p.etapa ?? 'novo',
    temperatura: p.temperatura ?? 'morno',
    valorEstimado: p.valorEstimado ?? 0,
    tags: p.tags ?? [],
    interacoes: p.interacoes ?? [],
    proximoContato: p.proximoContato,
    criadoEm: p.criadoEm ?? agora,
    atualizadoEm: p.atualizadoEm ?? agora,
  }
}

function isoDaqui(dias: number): string {
  const d = new Date()
  d.setDate(d.getDate() + dias)
  return d.toISOString().slice(0, 10)
}

describe('normalizarTelefone', () => {
  it('adiciona DDI 55 quando ausente', () => {
    expect(normalizarTelefone('(48) 99999-8888')).toBe('5548999998888')
    expect(normalizarTelefone('4899998888')).toBe('554899998888')
  })
  it('mantém DDI quando presente', () => {
    expect(normalizarTelefone('+55 48 99999-8888')).toBe('5548999998888')
  })
  it('remove zero de tronco à esquerda', () => {
    expect(normalizarTelefone('048 99999-8888')).toBe('5548999998888')
  })
  it('retorna vazio para entrada vazia', () => {
    expect(normalizarTelefone('')).toBe('')
  })
})

describe('telefoneValido', () => {
  it('aceita número BR completo', () => {
    expect(telefoneValido('5548999998888')).toBe(true)
  })
  it('rejeita número curto', () => {
    expect(telefoneValido('99998888')).toBe(false)
  })
})

describe('preencherTemplate', () => {
  it('substitui variáveis conhecidas', () => {
    const l = lead({ nome: 'Carlos Menezes', produto: 'FV' })
    expect(preencherTemplate('Olá {primeiroNome}, sobre {produto}', l)).toBe('Olá Carlos, sobre FV')
  })
  it('preserva variáveis sem valor', () => {
    const l = lead({ nome: 'Ana', empresa: undefined })
    expect(preencherTemplate('{empresa}', l)).toBe('{empresa}')
  })
})

describe('linkWhatsApp', () => {
  it('gera link wa.me com texto codificado', () => {
    const url = linkWhatsApp('5548999998888', 'Olá mundo')
    expect(url).toBe('https://wa.me/5548999998888?text=Ol%C3%A1%20mundo')
  })
  it('gera link sem texto quando vazio', () => {
    expect(linkWhatsApp('5548999998888')).toBe('https://wa.me/5548999998888')
  })
})

describe('telefoneBR', () => {
  it('formata número com DDI', () => {
    expect(telefoneBR('5548999998888')).toBe('+55 (48) 99999-8888')
  })
})

describe('diasAte', () => {
  it('conta dias corretamente', () => {
    expect(diasAte(isoDaqui(0))).toBe(0)
    expect(diasAte(isoDaqui(3))).toBe(3)
    expect(diasAte(isoDaqui(-2))).toBe(-2)
  })
})

describe('calcularDashboard', () => {
  const estado: EstadoCRM = {
    templates: [],
    leads: [
      lead({ etapa: 'novo', valorEstimado: 100, origem: 'WhatsApp', produto: 'FV' }),
      lead({ etapa: 'proposta', valorEstimado: 200, origem: 'WhatsApp', produto: 'BESS' }),
      lead({ etapa: 'ganho', valorEstimado: 300, origem: 'Indicacao', produto: 'FV' }),
      lead({ etapa: 'ganho', valorEstimado: 500, origem: 'Site', produto: 'FV' }),
      lead({ etapa: 'perdido', valorEstimado: 400, origem: 'Google', produto: 'EVSE' }),
    ],
  }
  const d = calcularDashboard(estado)

  it('conta leads abertos (não fechados)', () => {
    expect(d.leadsAbertos).toBe(2)
  })
  it('soma valor do pipeline aberto', () => {
    expect(d.valorPipeline).toBe(300)
  })
  it('soma valor ganho', () => {
    expect(d.valorGanho).toBe(800)
  })
  it('calcula taxa de conversão = ganhos / fechados', () => {
    // 2 ganhos / 3 fechados
    expect(d.taxaConversao).toBeCloseTo(2 / 3)
  })
  it('calcula ticket médio dos ganhos', () => {
    expect(d.ticketMedio).toBe(400)
  })
  it('agrupa por origem ordenado por quantidade', () => {
    expect(d.porOrigem[0].quantidade).toBeGreaterThanOrEqual(d.porOrigem[1].quantidade)
    const wpp = d.porOrigem.find((o) => o.chave === 'WhatsApp')
    expect(wpp?.quantidade).toBe(2)
  })
  it('agrupa por produto', () => {
    const fv = d.porProduto.find((p) => p.chave === 'FV')
    expect(fv?.quantidade).toBe(3)
  })
})

describe('pendenciasFollowup', () => {
  it('retorna apenas leads abertos com follow-up vencido ou hoje', () => {
    const leads = [
      lead({ id: 'atrasado', etapa: 'novo', proximoContato: isoDaqui(-2) }),
      lead({ id: 'hoje', etapa: 'proposta', proximoContato: isoDaqui(0) }),
      lead({ id: 'futuro', etapa: 'novo', proximoContato: isoDaqui(5) }),
      lead({ id: 'ganho-vencido', etapa: 'ganho', proximoContato: isoDaqui(-1) }),
    ]
    const p = pendenciasFollowup(leads)
    expect(p.map((l) => l.id)).toEqual(['atrasado', 'hoje'])
  })
})
