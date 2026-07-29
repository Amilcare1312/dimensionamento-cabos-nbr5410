import type { Conta } from './tipos'

// Plano de contas padrão (extraído da planilha original).
export const PLANO_CONTAS: Conta[] = [
  { codigo: '1.0.0', nome: 'ATIVO', tipo: 'Ativo', grupo: 'Balanco', natureza: 'Devedora' },
  { codigo: '1.1.0', nome: 'Ativo Circulante', tipo: 'Ativo', grupo: 'Balanco', natureza: 'Devedora' },
  { codigo: '1.1.1', nome: 'Caixa', tipo: 'Ativo', grupo: 'Caixa', natureza: 'Devedora' },
  { codigo: '1.1.2', nome: 'Banco Conta Corrente', tipo: 'Ativo', grupo: 'Caixa', natureza: 'Devedora' },
  { codigo: '1.1.3', nome: 'Clientes a Receber', tipo: 'Ativo', grupo: 'Contas a Receber', natureza: 'Devedora' },
  { codigo: '1.1.4', nome: 'Estoques', tipo: 'Ativo', grupo: 'Estoques', natureza: 'Devedora' },
  { codigo: '1.2.0', nome: 'Ativo Nao Circulante', tipo: 'Ativo', grupo: 'Balanco', natureza: 'Devedora' },
  { codigo: '1.2.1', nome: 'Imobilizado', tipo: 'Ativo', grupo: 'Imobilizado', natureza: 'Devedora' },
  { codigo: '1.2.2', nome: 'Depreciacao Acumulada', tipo: 'Ativo', grupo: 'Imobilizado', natureza: 'Credora' },
  { codigo: '2.0.0', nome: 'PASSIVO', tipo: 'Passivo', grupo: 'Balanco', natureza: 'Credora' },
  { codigo: '2.1.0', nome: 'Passivo Circulante', tipo: 'Passivo', grupo: 'Balanco', natureza: 'Credora' },
  { codigo: '2.1.1', nome: 'Fornecedores a Pagar', tipo: 'Passivo', grupo: 'Contas a Pagar', natureza: 'Credora' },
  { codigo: '2.1.2', nome: 'Salarios a Pagar', tipo: 'Passivo', grupo: 'Contas a Pagar', natureza: 'Credora' },
  { codigo: '2.1.3', nome: 'Impostos a Recolher', tipo: 'Passivo', grupo: 'Obrig. Fiscais', natureza: 'Credora' },
  { codigo: '2.1.4', nome: 'Emprestimos', tipo: 'Passivo', grupo: 'Financiamentos', natureza: 'Credora' },
  { codigo: '2.2.0', nome: 'Patrimonio Liquido', tipo: 'Passivo', grupo: 'Balanco', natureza: 'Credora' },
  { codigo: '2.2.1', nome: 'Capital Social', tipo: 'Passivo', grupo: 'Patr. Liquido', natureza: 'Credora' },
  { codigo: '2.2.2', nome: 'Lucros Acumulados', tipo: 'Passivo', grupo: 'Patr. Liquido', natureza: 'Credora' },
  { codigo: '3.0.0', nome: 'RECEITAS', tipo: 'Receita', grupo: 'DRE', natureza: 'Credora' },
  { codigo: '3.1.1', nome: 'Vendas de Produtos', tipo: 'Receita', grupo: 'DRE', natureza: 'Credora' },
  { codigo: '3.1.2', nome: 'Prestacao de Servicos', tipo: 'Receita', grupo: 'DRE', natureza: 'Credora' },
  { codigo: '3.2.1', nome: 'Receitas Financeiras', tipo: 'Receita', grupo: 'DRE', natureza: 'Credora' },
  { codigo: '4.0.0', nome: 'DESPESAS', tipo: 'Despesa', grupo: 'DRE', natureza: 'Devedora' },
  { codigo: '4.2.1', nome: 'Folha de Pagamento', tipo: 'Despesa', grupo: 'DRE', natureza: 'Devedora' },
  { codigo: '4.2.2', nome: 'Aluguel', tipo: 'Despesa', grupo: 'DRE', natureza: 'Devedora' },
  { codigo: '4.2.3', nome: 'Energia Eletrica', tipo: 'Despesa', grupo: 'DRE', natureza: 'Devedora' },
  { codigo: '4.2.4', nome: 'Material de Escritorio', tipo: 'Despesa', grupo: 'DRE', natureza: 'Devedora' },
  { codigo: '4.2.5', nome: 'Marketing', tipo: 'Despesa', grupo: 'DRE', natureza: 'Devedora' },
  { codigo: '4.2.6', nome: 'Servicos de Terceiros', tipo: 'Despesa', grupo: 'DRE', natureza: 'Devedora' },
  { codigo: '4.2.7', nome: 'Depreciacao', tipo: 'Despesa', grupo: 'DRE', natureza: 'Devedora' },
  { codigo: '4.3.1', nome: 'Juros Pagos', tipo: 'Despesa', grupo: 'DRE', natureza: 'Devedora' },
  { codigo: '4.3.2', nome: 'Tarifas Bancarias', tipo: 'Despesa', grupo: 'DRE', natureza: 'Devedora' },
  { codigo: '4.4.1', nome: 'IRPJ / CSLL', tipo: 'Despesa', grupo: 'DRE', natureza: 'Devedora' },
  { codigo: '4.4.2', nome: 'PIS / COFINS', tipo: 'Despesa', grupo: 'DRE', natureza: 'Devedora' },
]

const MAPA = new Map(PLANO_CONTAS.map((c) => [c.codigo, c]))

export function contaPorCodigo(codigo: string): Conta | undefined {
  return MAPA.get(codigo)
}

export function nomeConta(codigo: string): string {
  return MAPA.get(codigo)?.nome ?? codigo
}

// Códigos-chave usados na lógica de relatórios.
export const CONTA_BANCO = '1.1.2'
export const CONTA_CLIENTES = '1.1.3'
export const CONTA_FORNECEDORES = '2.1.1'
export const CONTA_SALARIOS = '2.1.2'
export const CONTA_IMPOSTOS = '2.1.3'
export const CONTAS_PAGAR = [CONTA_FORNECEDORES, CONTA_SALARIOS, CONTA_IMPOSTOS]

export const CONTAS_RECEITA = PLANO_CONTAS.filter((c) => c.tipo === 'Receita' && c.codigo !== '3.0.0')
export const CONTAS_DESPESA = PLANO_CONTAS.filter((c) => c.tipo === 'Despesa' && c.codigo !== '4.0.0')
