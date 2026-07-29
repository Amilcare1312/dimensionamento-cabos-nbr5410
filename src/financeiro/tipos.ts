// Modelo de dados do aplicativo financeiro (partidas dobradas)
// Inspirado na planilha "Planilha_financeira_com_diario.xlsx":
// o Diário é a entrada única de dados e alimenta todos os demais relatórios.

export type TipoConta = 'Ativo' | 'Passivo' | 'Receita' | 'Despesa'
export type Natureza = 'Devedora' | 'Credora'

export interface Conta {
  codigo: string
  nome: string
  tipo: TipoConta
  grupo: string
  natureza: Natureza
}

/** Uma linha (partida) de um lançamento contábil. */
export interface Linha {
  codConta: string
  /** Valor a débito (R$). Zero quando a linha é de crédito. */
  debito: number
  /** Valor a crédito (R$). Zero quando a linha é de débito. */
  credito: number
  /** Nome exato do fornecedor/cliente — usado em Contas a Pagar/Receber. */
  parte?: string
  /** Data de vencimento (ISO yyyy-mm-dd), quando aplicável. */
  vencimento?: string
  /** Categoria do Fluxo de Caixa — preencher apenas em linhas da conta 1.1.2. */
  categFC?: string
}

/** Um lançamento = um documento com 2 ou mais linhas balanceadas. */
export interface Lancamento {
  id: string
  data: string // ISO yyyy-mm-dd
  noDoc: string
  historico: string
  ref: string
  linhas: Linha[]
}

export type StatusPagar = 'Pago' | 'Pendente' | 'Vencido'
export type StatusReceber = 'Recebido' | 'Pendente' | 'Vencido'

export interface ItemPagar {
  nome: string
  grupo: string
  totalNF: number
  totalPago: number
  saldo: number
  proximoVencimento?: string
  status: StatusPagar
}

export interface ItemReceber {
  cliente: string
  totalEmitido: number
  totalRecebido: number
  saldo: number
  proximoVencimento?: string
  status: StatusReceber
}

export interface LinhaFluxo {
  categoria: string
  grupo: 'entrada' | 'saida'
  meses: number[] // 12 posições (Jan..Dez)
  total: number
}

export interface FluxoCaixa {
  entradas: LinhaFluxo[]
  saidas: LinhaFluxo[]
  totalEntradasMes: number[]
  totalSaidasMes: number[]
  resultadoMes: number[]
  saldoFinalMes: number[]
  saldoInicial: number
  ano: number
}

export interface EstadoFinanceiro {
  ano: number
  saldoInicial: number
  lancamentos: Lancamento[]
}
