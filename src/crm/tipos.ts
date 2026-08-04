// Modelo de dados do CRM de leads qualificados (origem principal: WhatsApp).
// Todo o estado vive no navegador (localStorage) — sem back-end.

export type Produto = 'FV' | 'BESS' | 'EVSE' | 'Usina' | 'Servico' | 'Outro'

export type Origem =
  | 'WhatsApp'
  | 'Indicacao'
  | 'Site'
  | 'Instagram'
  | 'Google'
  | 'Feira'
  | 'Outro'

/** Etapas do funil de vendas, na ordem em que aparecem no pipeline. */
export type Etapa =
  | 'novo'
  | 'qualificado'
  | 'proposta'
  | 'negociacao'
  | 'ganho'
  | 'perdido'

export type Temperatura = 'quente' | 'morno' | 'frio'

export type TipoInteracao =
  | 'mensagem'
  | 'ligacao'
  | 'reuniao'
  | 'proposta'
  | 'followup'
  | 'nota'

/** Um evento no histórico do lead (mensagem enviada, ligação, nota, etc.). */
export interface Interacao {
  id: string
  data: string // ISO datetime (yyyy-mm-ddThh:mm)
  tipo: TipoInteracao
  descricao: string
}

export interface Lead {
  id: string
  nome: string
  /** Somente dígitos, com DDI+DDD (ex.: 5548999998888). Usado no link wa.me. */
  telefone: string
  empresa?: string
  cidade?: string
  produto: Produto
  origem: Origem
  etapa: Etapa
  temperatura: Temperatura
  /** Valor potencial do negócio (R$). */
  valorEstimado: number
  responsavel?: string
  observacoes?: string
  /** Data do próximo follow-up agendado (ISO yyyy-mm-dd). */
  proximoContato?: string
  /** Preenchido quando a etapa vira "perdido". */
  motivoPerda?: string
  tags: string[]
  interacoes: Interacao[]
  criadoEm: string // ISO datetime
  atualizadoEm: string // ISO datetime
}

/** Modelo de mensagem de WhatsApp reutilizável, com variáveis {nome}, {empresa}... */
export interface Template {
  id: string
  titulo: string
  texto: string
}

export interface EstadoCRM {
  leads: Lead[]
  templates: Template[]
}

/** Metadados de cada etapa: rótulo, cor e se é um estado final. */
export interface MetaEtapa {
  id: Etapa
  rotulo: string
  /** Classe Tailwind de fundo para a coluna/selo. */
  cor: string
  /** Selo tonal reutilizado em <Selo>. */
  tom: 'verde' | 'amarelo' | 'vermelho' | 'neutro'
  aberta: boolean
}

export const ETAPAS: MetaEtapa[] = [
  { id: 'novo', rotulo: 'Novo', cor: 'bg-sky-500', tom: 'neutro', aberta: true },
  { id: 'qualificado', rotulo: 'Qualificado', cor: 'bg-indigo-500', tom: 'neutro', aberta: true },
  { id: 'proposta', rotulo: 'Proposta enviada', cor: 'bg-amber-500', tom: 'amarelo', aberta: true },
  { id: 'negociacao', rotulo: 'Negociação', cor: 'bg-orange-500', tom: 'amarelo', aberta: true },
  { id: 'ganho', rotulo: 'Ganho', cor: 'bg-emerald-500', tom: 'verde', aberta: false },
  { id: 'perdido', rotulo: 'Perdido', cor: 'bg-rose-500', tom: 'vermelho', aberta: false },
]

export function metaEtapa(id: Etapa): MetaEtapa {
  return ETAPAS.find((e) => e.id === id) ?? ETAPAS[0]
}

export const PRODUTOS: { id: Produto; rotulo: string }[] = [
  { id: 'FV', rotulo: 'Energia Solar (FV)' },
  { id: 'BESS', rotulo: 'Baterias (BESS)' },
  { id: 'EVSE', rotulo: 'Carregador Veicular (EVSE)' },
  { id: 'Usina', rotulo: 'Usina de Investimento' },
  { id: 'Servico', rotulo: 'Serviço/Laudo/Projeto' },
  { id: 'Outro', rotulo: 'Outro' },
]

export const ORIGENS: { id: Origem; rotulo: string }[] = [
  { id: 'WhatsApp', rotulo: 'WhatsApp' },
  { id: 'Indicacao', rotulo: 'Indicação' },
  { id: 'Site', rotulo: 'Site' },
  { id: 'Instagram', rotulo: 'Instagram' },
  { id: 'Google', rotulo: 'Google' },
  { id: 'Feira', rotulo: 'Feira/Evento' },
  { id: 'Outro', rotulo: 'Outro' },
]

export const TEMPERATURAS: { id: Temperatura; rotulo: string; emoji: string; tom: 'verde' | 'amarelo' | 'neutro' }[] = [
  { id: 'quente', rotulo: 'Quente', emoji: '🔥', tom: 'verde' },
  { id: 'morno', rotulo: 'Morno', emoji: '🌤️', tom: 'amarelo' },
  { id: 'frio', rotulo: 'Frio', emoji: '❄️', tom: 'neutro' },
]

export const TIPOS_INTERACAO: { id: TipoInteracao; rotulo: string; emoji: string }[] = [
  { id: 'mensagem', rotulo: 'Mensagem', emoji: '💬' },
  { id: 'ligacao', rotulo: 'Ligação', emoji: '📞' },
  { id: 'reuniao', rotulo: 'Reunião/Visita', emoji: '🤝' },
  { id: 'proposta', rotulo: 'Proposta', emoji: '📄' },
  { id: 'followup', rotulo: 'Follow-up', emoji: '⏰' },
  { id: 'nota', rotulo: 'Nota', emoji: '📝' },
]
