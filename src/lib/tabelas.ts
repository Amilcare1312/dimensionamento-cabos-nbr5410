/**
 * Tabelas técnicas de referência baseadas na ABNT NBR 5410:2004
 * (Instalações elétricas de baixa tensão), consolidadas a partir de
 * fontes técnicas públicas.
 *
 * IMPORTANTE — PROVENIÊNCIA DOS DADOS:
 * A coluna do método B1 (PVC, cobre) foi conferida diretamente contra
 * a Tabela 36 da norma. As demais colunas de ampacidade (métodos A1,
 * B2, C, D, E e isolação EPR/XLPE) são DERIVADAS dessa coluna-base por
 * meio de fatores relativos típicos entre métodos de referência e entre
 * temperaturas de isolação, e podem divergir ligeiramente dos valores
 * impressos na edição vigente da norma. As Tabelas 40 (correção de
 * temperatura) e 42 (correção de agrupamento) reproduzem os valores
 * classicamente publicados. Os valores de resistência/reatância dos
 * cabos são valores típicos de catálogo, não da norma em si.
 *
 * Este arquivo é a ÚNICA fonte de dados normativos do aplicativo — para
 * atualizar/corrigir valores diante da edição vigente da norma, edite
 * apenas aqui.
 */

export const SECOES_PADRONIZADAS = [
  1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120, 150, 185, 240,
] as const

export type Secao = (typeof SECOES_PADRONIZADAS)[number]

export type Isolacao = 'PVC' | 'EPR_XLPE'
export type Material = 'cobre' | 'aluminio'
export type TipoCircuito = 'monofasico' | 'bifasico' | 'trifasico'
export type NumCondutoresCarregados = 2 | 3

export const ISOLACOES: { codigo: Isolacao; nome: string; tempMax: number }[] = [
  { codigo: 'PVC', nome: 'PVC (termoplástico)', tempMax: 70 },
  { codigo: 'EPR_XLPE', nome: 'EPR / XLPE (termofixo)', tempMax: 90 },
]

export type MetodoInstalacao = 'A1' | 'B1' | 'B2' | 'C' | 'D' | 'E'

export interface MetodoInfo {
  codigo: MetodoInstalacao
  nome: string
  descricao: string
  /** referência de temperatura do ambiente: 'ar' (30°C) ou 'solo' (20°C) */
  referenciaTemperatura: 'ar' | 'solo'
  /** ilustração simplificada (emoji/ícone) usada na seleção visual */
  icone: string
}

export const METODOS_INSTALACAO: MetodoInfo[] = [
  {
    codigo: 'A1',
    nome: 'Eletroduto embutido em parede termicamente isolante',
    descricao:
      'Condutores isolados em eletroduto de seção circular embutido diretamente em parede termicamente isolante.',
    referenciaTemperatura: 'ar',
    icone: '🧱',
  },
  {
    codigo: 'B1',
    nome: 'Eletroduto aparente ou embutido em alvenaria',
    descricao:
      'Condutores isolados em eletroduto de seção circular, aparente ou embutido em alvenaria (método mais comum em instalações residenciais/comerciais).',
    referenciaTemperatura: 'ar',
    icone: '🪠',
  },
  {
    codigo: 'B2',
    nome: 'Eletroduto aparente — cabo multipolar',
    descricao:
      'Cabo multipolar em eletroduto de seção circular, aparente ou embutido em alvenaria.',
    referenciaTemperatura: 'ar',
    icone: '🔌',
  },
  {
    codigo: 'C',
    nome: 'Diretamente fixado em parede/teto (ao ar livre)',
    descricao:
      'Cabo unipolar ou multipolar diretamente fixado em parede ou teto, ao ar livre, sem eletroduto.',
    referenciaTemperatura: 'ar',
    icone: '🧵',
  },
  {
    codigo: 'D',
    nome: 'Diretamente enterrado no solo',
    descricao: 'Cabo multipolar diretamente enterrado no solo, sem eletroduto.',
    referenciaTemperatura: 'solo',
    icone: '⛏️',
  },
  {
    codigo: 'E',
    nome: 'Bandeja perfurada / leito (ao ar livre)',
    descricao:
      'Cabo multipolar sobre bandeja perfurada, leito ou suporte horizontal, ao ar livre, camada única.',
    referenciaTemperatura: 'ar',
    icone: '🗄️',
  },
]

/**
 * Ampacidade-base (A) — método de referência B1, isolação PVC 70°C,
 * condutor de cobre — conferida contra a Tabela 36 da NBR 5410:2004.
 */
const AMPACIDADE_BASE_B1_PVC_COBRE: Record<Secao, { dois: number; tres: number }> = {
  1.5: { dois: 17.5, tres: 15.5 },
  2.5: { dois: 24, tres: 21 },
  4: { dois: 32, tres: 28 },
  6: { dois: 41, tres: 36 },
  10: { dois: 57, tres: 50 },
  16: { dois: 76, tres: 68 },
  25: { dois: 101, tres: 89 },
  35: { dois: 125, tres: 110 },
  50: { dois: 151, tres: 134 },
  70: { dois: 192, tres: 171 },
  95: { dois: 232, tres: 207 },
  120: { dois: 269, tres: 239 },
  150: { dois: 300, tres: 261 },
  185: { dois: 341, tres: 298 },
  240: { dois: 400, tres: 346 },
}

/** Fatores relativos típicos entre métodos de referência, tendo B1 como base 1,00. */
const FATOR_METODO: Record<MetodoInstalacao, number> = {
  A1: 0.89,
  B1: 1.0,
  B2: 0.96,
  C: 1.12,
  D: 1.03,
  E: 1.08,
}

/** Fator relativo entre isolações (EPR/XLPE vs. PVC), decrescente com a seção. */
function fatorIsolacaoPorSecao(secao: Secao, isolacao: Isolacao): number {
  if (isolacao === 'PVC') return 1
  if (secao <= 6) return 1.15
  if (secao <= 35) return 1.12
  if (secao <= 95) return 1.11
  return 1.1
}

function arredondaAmpacidade(valor: number): number {
  return valor < 25 ? Math.round(valor * 2) / 2 : Math.round(valor)
}

export interface AmpacidadeEntrada {
  dois: number
  tres: number
}

/** Tabela de ampacidade (cobre) — gerada a partir da coluna-base B1/PVC. */
export const AMPACIDADE_COBRE: Record<
  Isolacao,
  Record<MetodoInstalacao, Record<Secao, AmpacidadeEntrada>>
> = (() => {
  const resultado = {} as Record<
    Isolacao,
    Record<MetodoInstalacao, Record<Secao, AmpacidadeEntrada>>
  >
  for (const isolacao of ['PVC', 'EPR_XLPE'] as Isolacao[]) {
    resultado[isolacao] = {} as Record<MetodoInstalacao, Record<Secao, AmpacidadeEntrada>>
    for (const metodo of METODOS_INSTALACAO.map((m) => m.codigo)) {
      const porSecao = {} as Record<Secao, AmpacidadeEntrada>
      for (const secao of SECOES_PADRONIZADAS) {
        const base = AMPACIDADE_BASE_B1_PVC_COBRE[secao]
        const fator = FATOR_METODO[metodo] * fatorIsolacaoPorSecao(secao, isolacao)
        porSecao[secao] = {
          dois: arredondaAmpacidade(base.dois * fator),
          tres: arredondaAmpacidade(base.tres * fator),
        }
      }
      resultado[isolacao][metodo] = porSecao
    }
  }
  return resultado
})()

/** Fator de redução de ampacidade para condutor de alumínio em relação ao cobre de mesma seção. */
export const FATOR_AMPACIDADE_ALUMINIO = 0.78

/** Tabela 40 — fator de correção de temperatura ambiente (referência: 30°C ao ar, 20°C no solo). */
export const FATOR_TEMPERATURA: Record<
  Isolacao,
  { ar: { referencia: number; valores: [number, number][] }; solo: { referencia: number; valores: [number, number][] } }
> = {
  PVC: {
    ar: {
      referencia: 30,
      valores: [
        [10, 1.22], [15, 1.17], [20, 1.12], [25, 1.06], [30, 1.0],
        [35, 0.94], [40, 0.87], [45, 0.79], [50, 0.71], [55, 0.61], [60, 0.5],
      ],
    },
    solo: {
      referencia: 20,
      valores: [
        [10, 1.1], [15, 1.05], [20, 1.0], [25, 0.95], [30, 0.89],
        [35, 0.84], [40, 0.77], [45, 0.71], [50, 0.63],
      ],
    },
  },
  EPR_XLPE: {
    ar: {
      referencia: 30,
      valores: [
        [10, 1.15], [15, 1.12], [20, 1.08], [25, 1.04], [30, 1.0],
        [35, 0.96], [40, 0.91], [45, 0.87], [50, 0.82], [55, 0.76],
        [60, 0.71], [65, 0.65], [70, 0.58], [75, 0.5], [80, 0.41],
      ],
    },
    solo: {
      referencia: 20,
      valores: [
        [10, 1.07], [15, 1.04], [20, 1.0], [25, 0.96], [30, 0.93],
        [35, 0.89], [40, 0.85], [45, 0.8], [50, 0.76],
      ],
    },
  },
}

/** Tabela 42 — fator de correção de agrupamento de circuitos. */
export const FATOR_AGRUPAMENTO: [number, number][] = [
  [1, 1.0], [2, 0.8], [3, 0.7], [4, 0.65], [5, 0.6], [6, 0.57],
  [7, 0.54], [8, 0.52], [9, 0.5], [10, 0.48], [12, 0.45], [14, 0.43],
  [16, 0.41], [18, 0.39], [20, 0.38],
]

/** Resistência (Ω/km, à temperatura de operação) e reatância (Ω/km) típicas por seção — condutor de cobre, em eletroduto. */
export const IMPEDANCIA_CABO_COBRE: Record<Secao, { r: number; x: number }> = {
  1.5: { r: 14.8, x: 0.168 },
  2.5: { r: 8.87, x: 0.156 },
  4: { r: 5.52, x: 0.143 },
  6: { r: 3.72, x: 0.135 },
  10: { r: 2.24, x: 0.119 },
  16: { r: 1.41, x: 0.112 },
  25: { r: 0.889, x: 0.106 },
  35: { r: 0.641, x: 0.101 },
  50: { r: 0.473, x: 0.101 },
  70: { r: 0.328, x: 0.0965 },
  95: { r: 0.236, x: 0.0975 },
  120: { r: 0.188, x: 0.0939 },
  150: { r: 0.153, x: 0.0928 },
  185: { r: 0.123, x: 0.0908 },
  240: { r: 0.0943, x: 0.0902 },
}

/** Fator de multiplicação da resistência do alumínio em relação ao cobre (mesma seção). */
export const FATOR_RESISTENCIA_ALUMINIO = 1.64

/** Correntes nominais padronizadas de disjuntores termomagnéticos (IEC 60898 / NBR NM 60898). */
export const CORRENTES_DISJUNTOR = [
  6, 10, 16, 20, 25, 32, 40, 50, 63, 70, 80, 100, 125, 150, 160, 175, 200,
  225, 250, 300, 350, 400, 500, 600, 630, 700, 800,
]

/** Constante k (Tabela 48 / IEC 60364-5-54) para verificação térmica de curto-circuito. */
export const K_CURTO_CIRCUITO: Record<Material, Record<Isolacao, number>> = {
  cobre: { PVC: 115, EPR_XLPE: 143 },
  aluminio: { PVC: 76, EPR_XLPE: 94 },
}

/** Seção mínima exigida por norma conforme a finalidade do circuito. */
export const SECAO_MINIMA_NORMA = {
  iluminacao: 1.5,
  tomadasUsoGeral: 2.5,
  sinalizacaoControle: 0.5,
} as const

export const QUEDA_TENSAO_PADRAO: { valor: number; nome: string }[] = [
  { valor: 4, nome: '4% — padrão geral (circuito terminal)' },
  { valor: 5, nome: '5% — ramal (instalação alimentada por ramal de entrada)' },
  { valor: 7, nome: '7% — a partir dos terminais de transformador de distribuição' },
]

export const CUSTO_REFERENCIA_POR_MM2_METRO: Record<Material, number> = {
  cobre: 0.62,
  aluminio: 0.21,
}
