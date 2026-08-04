import type { EstadoCRM, Etapa, Lead, Origem, Produto } from './tipos'
import { ETAPAS, metaEtapa } from './tipos'
import { diasAte } from './formatar'

export interface ContagemEtapa {
  etapa: Etapa
  rotulo: string
  quantidade: number
  valor: number
}

export interface DistribuicaoItem {
  chave: string
  rotulo: string
  quantidade: number
  valor: number
}

export interface DashboardCRM {
  totalLeads: number
  leadsAbertos: number
  valorPipeline: number // valor estimado das etapas abertas
  valorGanho: number
  ganhos: number
  perdidos: number
  fechados: number
  taxaConversao: number // ganhos / fechados
  ticketMedio: number // valor médio dos leads ganhos
  novosNoMes: number
  followupsHoje: number
  followupsAtrasados: number
  porEtapa: ContagemEtapa[]
  porOrigem: DistribuicaoItem[]
  porProduto: DistribuicaoItem[]
}

const ROTULO_ORIGEM: Record<Origem, string> = {
  WhatsApp: 'WhatsApp',
  Indicacao: 'Indicação',
  Site: 'Site',
  Instagram: 'Instagram',
  Google: 'Google',
  Feira: 'Feira/Evento',
  Outro: 'Outro',
}

const ROTULO_PRODUTO: Record<Produto, string> = {
  FV: 'Solar (FV)',
  BESS: 'Baterias (BESS)',
  EVSE: 'Carregador (EVSE)',
  Usina: 'Usina',
  Servico: 'Serviço',
  Outro: 'Outro',
}

export function calcularDashboard(estado: EstadoCRM): DashboardCRM {
  const { leads } = estado
  const abertos = leads.filter((l) => metaEtapa(l.etapa).aberta)
  const ganhosArr = leads.filter((l) => l.etapa === 'ganho')
  const perdidosArr = leads.filter((l) => l.etapa === 'perdido')
  const fechados = ganhosArr.length + perdidosArr.length

  const valorPipeline = abertos.reduce((a, l) => a + (l.valorEstimado || 0), 0)
  const valorGanho = ganhosArr.reduce((a, l) => a + (l.valorEstimado || 0), 0)

  const agora = new Date()
  const anoMes = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, '0')}`
  const novosNoMes = leads.filter((l) => (l.criadoEm ?? '').slice(0, 7) === anoMes).length

  let followupsHoje = 0
  let followupsAtrasados = 0
  for (const l of abertos) {
    const d = diasAte(l.proximoContato)
    if (d === null) continue
    if (d === 0) followupsHoje += 1
    else if (d < 0) followupsAtrasados += 1
  }

  const porEtapa: ContagemEtapa[] = ETAPAS.map((meta) => {
    const grupo = leads.filter((l) => l.etapa === meta.id)
    return {
      etapa: meta.id,
      rotulo: meta.rotulo,
      quantidade: grupo.length,
      valor: grupo.reduce((a, l) => a + (l.valorEstimado || 0), 0),
    }
  })

  const porOrigem = agruparDistribuicao(leads, (l) => l.origem, ROTULO_ORIGEM)
  const porProduto = agruparDistribuicao(leads, (l) => l.produto, ROTULO_PRODUTO)

  return {
    totalLeads: leads.length,
    leadsAbertos: abertos.length,
    valorPipeline,
    valorGanho,
    ganhos: ganhosArr.length,
    perdidos: perdidosArr.length,
    fechados,
    taxaConversao: fechados > 0 ? ganhosArr.length / fechados : 0,
    ticketMedio: ganhosArr.length > 0 ? valorGanho / ganhosArr.length : 0,
    novosNoMes,
    followupsHoje,
    followupsAtrasados,
    porEtapa,
    porOrigem,
    porProduto,
  }
}

function agruparDistribuicao<K extends string>(
  leads: Lead[],
  chaveDe: (l: Lead) => K,
  rotulos: Record<K, string>,
): DistribuicaoItem[] {
  const mapa = new Map<K, { quantidade: number; valor: number }>()
  for (const l of leads) {
    const k = chaveDe(l)
    const atual = mapa.get(k) ?? { quantidade: 0, valor: 0 }
    atual.quantidade += 1
    atual.valor += l.valorEstimado || 0
    mapa.set(k, atual)
  }
  return [...mapa.entries()]
    .map(([chave, v]) => ({ chave, rotulo: rotulos[chave] ?? chave, ...v }))
    .sort((a, b) => b.quantidade - a.quantidade)
}

/** Leads abertos com follow-up vencido ou para hoje, ordenados por urgência. */
export function pendenciasFollowup(leads: Lead[]): Lead[] {
  return leads
    .filter((l) => metaEtapa(l.etapa).aberta && l.proximoContato)
    .filter((l) => {
      const d = diasAte(l.proximoContato)
      return d !== null && d <= 0
    })
    .sort((a, b) => (diasAte(a.proximoContato) ?? 0) - (diasAte(b.proximoContato) ?? 0))
}
