import type { Lancamento, Linha } from './tipos'
import { gerarId } from './armazenamento'
import { categoriaEntradaPara, categoriaSaidaPara } from './categorias'
import { CONTA_BANCO, CONTA_CLIENTES, CONTA_FORNECEDORES, CONTA_SALARIOS } from './planoContas'

// Modelos de transação para o preenchimento guiado (mapeiam para as partidas
// dobradas descritas nas instruções da planilha).
export type TipoTransacao =
  | 'despesa_prazo'
  | 'pagamento'
  | 'receita_prazo'
  | 'recebimento'
  | 'despesa_vista'
  | 'receita_vista'
  | 'folha'
  | 'manual'

export interface DescricaoModelo {
  tipo: TipoTransacao
  rotulo: string
  descricao: string
}

export const MODELOS: DescricaoModelo[] = [
  { tipo: 'despesa_prazo', rotulo: 'Compra / despesa a prazo', descricao: 'Gera conta a pagar (NF do fornecedor).' },
  { tipo: 'pagamento', rotulo: 'Pagamento a fornecedor', descricao: 'Baixa uma conta a pagar (saída de caixa).' },
  { tipo: 'receita_prazo', rotulo: 'Venda / serviço a prazo', descricao: 'Gera conta a receber (NF ao cliente).' },
  { tipo: 'recebimento', rotulo: 'Recebimento de cliente', descricao: 'Baixa uma conta a receber (entrada de caixa).' },
  { tipo: 'despesa_vista', rotulo: 'Despesa paga à vista', descricao: 'Despesa quitada direto pelo banco.' },
  { tipo: 'receita_vista', rotulo: 'Receita recebida à vista', descricao: 'Receita recebida direto no banco.' },
  { tipo: 'folha', rotulo: 'Folha de pagamento (provisão)', descricao: 'Provisiona salários a pagar.' },
  { tipo: 'manual', rotulo: 'Lançamento manual (avançado)', descricao: 'Monte as partidas livremente.' },
]

export interface DadosFormulario {
  tipo: TipoTransacao
  data: string
  noDoc: string
  historico: string
  valor: number
  parte: string
  vencimento: string
  contaResultado: string // conta de despesa ou receita escolhida
  categFC: string
  // Para lançamento manual:
  linhasManuais?: Linha[]
}

function linha(codConta: string, debito: number, credito: number, extra?: Partial<Linha>): Linha {
  return { codConta, debito, credito, ...extra }
}

/** Constrói um Lançamento balanceado a partir dos dados do formulário guiado. */
export function montarLancamento(d: DadosFormulario): Lancamento {
  const base = { id: gerarId(), data: d.data, noDoc: d.noDoc, historico: d.historico, ref: d.noDoc }
  const v = d.valor
  const parte = d.parte.trim() || undefined
  const venc = d.vencimento || undefined

  let linhas: Linha[] = []
  switch (d.tipo) {
    case 'despesa_prazo':
      // DR despesa / CR fornecedores
      linhas = [
        linha(d.contaResultado, v, 0, { parte, vencimento: venc }),
        linha(CONTA_FORNECEDORES, 0, v, { parte, vencimento: venc }),
      ]
      break
    case 'pagamento':
      // DR fornecedores / CR banco (categFC = saída)
      linhas = [
        linha(CONTA_FORNECEDORES, v, 0, { parte }),
        linha(CONTA_BANCO, 0, v, { parte, categFC: d.categFC || 'Outras Saidas' }),
      ]
      break
    case 'receita_prazo':
      // DR clientes / CR receita
      linhas = [
        linha(CONTA_CLIENTES, v, 0, { parte, vencimento: venc }),
        linha(d.contaResultado, 0, v, { parte, vencimento: venc }),
      ]
      break
    case 'recebimento':
      // DR banco (categFC = entrada) / CR clientes
      linhas = [
        linha(CONTA_BANCO, v, 0, { parte, categFC: d.categFC || 'Outros Recebimentos' }),
        linha(CONTA_CLIENTES, 0, v, { parte }),
      ]
      break
    case 'despesa_vista':
      // DR despesa / CR banco (categFC = saída)
      linhas = [
        linha(d.contaResultado, v, 0, { parte }),
        linha(CONTA_BANCO, 0, v, { parte, categFC: d.categFC || categoriaSaidaPara(d.contaResultado) }),
      ]
      break
    case 'receita_vista':
      // DR banco (categFC = entrada) / CR receita
      linhas = [
        linha(CONTA_BANCO, v, 0, { parte, categFC: d.categFC || categoriaEntradaPara(d.contaResultado) }),
        linha(d.contaResultado, 0, v, { parte }),
      ]
      break
    case 'folha':
      // DR folha / CR salários a pagar
      linhas = [
        linha('4.2.1', v, 0, { parte: parte || 'Folha de Pagamento', vencimento: venc }),
        linha(CONTA_SALARIOS, 0, v, { parte: parte || 'Folha de Pagamento', vencimento: venc }),
      ]
      break
    case 'manual':
      linhas = (d.linhasManuais ?? []).map((l) => ({ ...l }))
      break
  }

  return { ...base, linhas }
}

/** Categoria de FC sugerida ao escolher a conta, conforme o tipo de transação. */
export function categoriaSugerida(tipo: TipoTransacao, contaResultado: string): string {
  if (tipo === 'receita_vista' || tipo === 'recebimento') return categoriaEntradaPara(contaResultado)
  if (tipo === 'despesa_vista' || tipo === 'pagamento') return categoriaSaidaPara(contaResultado)
  return ''
}
