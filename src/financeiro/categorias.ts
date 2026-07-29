// Categorias do Fluxo de Caixa (regime de caixa — conta 1.1.2).
// A categoria é registrada na linha da conta 1.1.2 do lançamento:
//  - débito em 1.1.2  -> ENTRADA de caixa
//  - crédito em 1.1.2 -> SAÍDA de caixa

export const CATEGORIAS_ENTRADA = [
  'Receitas de Servicos',
  'Receitas de Produtos',
  'Receitas Financeiras',
  'Outros Recebimentos',
] as const

export const CATEGORIAS_SAIDA = [
  'Folha de Pagamento',
  'Aluguel',
  'Energia Eletrica',
  'Marketing',
  'Servicos Terceiros',
  'Juros e Financiamentos',
  'Tarifas Bancarias',
  'Impostos',
  'Outras Saidas',
] as const

// Sugestão de categoria de FC a partir da conta de receita.
export function categoriaEntradaPara(codReceita: string): string {
  switch (codReceita) {
    case '3.1.2':
      return 'Receitas de Servicos'
    case '3.1.1':
      return 'Receitas de Produtos'
    case '3.2.1':
      return 'Receitas Financeiras'
    default:
      return 'Outros Recebimentos'
  }
}

// Sugestão de categoria de FC a partir da conta de despesa.
export function categoriaSaidaPara(codDespesa: string): string {
  switch (codDespesa) {
    case '4.2.1':
      return 'Folha de Pagamento'
    case '4.2.2':
      return 'Aluguel'
    case '4.2.3':
      return 'Energia Eletrica'
    case '4.2.5':
      return 'Marketing'
    case '4.2.6':
      return 'Servicos Terceiros'
    case '4.3.1':
      return 'Juros e Financiamentos'
    case '4.3.2':
      return 'Tarifas Bancarias'
    case '4.4.1':
    case '4.4.2':
      return 'Impostos'
    default:
      return 'Outras Saidas'
  }
}

export const MESES_CURTOS = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
]
