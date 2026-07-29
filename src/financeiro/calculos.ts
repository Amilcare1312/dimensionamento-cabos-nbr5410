import type {
  EstadoFinanceiro,
  FluxoCaixa,
  ItemPagar,
  ItemReceber,
  Lancamento,
  LinhaFluxo,
  StatusPagar,
  StatusReceber,
} from './tipos'
import {
  CONTA_BANCO,
  CONTA_CLIENTES,
  CONTA_FORNECEDORES,
  CONTA_IMPOSTOS,
  CONTA_SALARIOS,
  nomeConta,
} from './planoContas'
import { CATEGORIAS_ENTRADA, CATEGORIAS_SAIDA } from './categorias'

const ARREDONDA = (n: number) => Math.round(n * 100) / 100

/** Soma dos débitos e créditos de um lançamento — usada para validação. */
export function totaisLancamento(l: Lancamento): { debito: number; credito: number; diferenca: number } {
  let debito = 0
  let credito = 0
  for (const linha of l.linhas) {
    debito += linha.debito || 0
    credito += linha.credito || 0
  }
  return { debito: ARREDONDA(debito), credito: ARREDONDA(credito), diferenca: ARREDONDA(debito - credito) }
}

/** Um lançamento é válido quando tem 2+ linhas e débito = crédito (> 0). */
export function lancamentoValido(l: Lancamento): boolean {
  const { debito, credito } = totaisLancamento(l)
  return l.linhas.length >= 2 && debito > 0 && Math.abs(debito - credito) < 0.005
}

interface LinhaPlana {
  data: string
  codConta: string
  debito: number
  credito: number
  parte?: string
  vencimento?: string
  categFC?: string
}

function achatar(lancamentos: Lancamento[]): LinhaPlana[] {
  const out: LinhaPlana[] = []
  for (const l of lancamentos) {
    for (const linha of l.linhas) {
      out.push({
        data: l.data,
        codConta: linha.codConta,
        debito: linha.debito || 0,
        credito: linha.credito || 0,
        parte: linha.parte,
        vencimento: linha.vencimento,
        categFC: linha.categFC,
      })
    }
  }
  return out
}

function hojeISO(): string {
  return new Date().toISOString().slice(0, 10)
}

/** Saldo atual de qualquer conta = Σdébitos − Σcréditos. */
export function saldoConta(lancamentos: Lancamento[], codConta: string): number {
  let saldo = 0
  for (const linha of achatar(lancamentos)) {
    if (linha.codConta === codConta) saldo += linha.debito - linha.credito
  }
  return ARREDONDA(saldo)
}

// ─────────────────────────── Contas a Pagar ───────────────────────────
// Passivos (2.1.1 fornecedores, 2.1.2 salários, 2.1.3 impostos):
//  crédito = obrigação incorrida (NF), débito = pagamento efetuado.

export function calcularContasPagar(lancamentos: Lancamento[]): ItemPagar[] {
  const linhas = achatar(lancamentos)
  const hoje = hojeISO()
  const grupos = new Map<string, ItemPagar>()

  for (const cod of [CONTA_FORNECEDORES, CONTA_SALARIOS, CONTA_IMPOSTOS]) {
    const grupoConta = nomeConta(cod)
    for (const linha of linhas) {
      if (linha.codConta !== cod) continue
      // Fornecedores agrupam por parte; salários/impostos agrupam pela conta.
      const chave = cod === CONTA_FORNECEDORES ? linha.parte?.trim() || 'Sem fornecedor' : grupoConta
      let item = grupos.get(cod + '|' + chave)
      if (!item) {
        item = { nome: chave, grupo: grupoConta, totalNF: 0, totalPago: 0, saldo: 0, status: 'Pendente' }
        grupos.set(cod + '|' + chave, item)
      }
      item.totalNF += linha.credito
      item.totalPago += linha.debito
      if (linha.vencimento && linha.credito > 0) {
        if (!item.proximoVencimento || linha.vencimento < item.proximoVencimento) {
          item.proximoVencimento = linha.vencimento
        }
      }
    }
  }

  const lista = [...grupos.values()]
  for (const item of lista) {
    item.totalNF = ARREDONDA(item.totalNF)
    item.totalPago = ARREDONDA(item.totalPago)
    item.saldo = ARREDONDA(item.totalNF - item.totalPago)
    item.status = statusPagar(item.saldo, item.proximoVencimento, hoje)
  }
  return lista.filter((i) => i.totalNF > 0 || i.totalPago > 0)
}

function statusPagar(saldo: number, venc: string | undefined, hoje: string): StatusPagar {
  if (Math.abs(saldo) < 0.005) return 'Pago'
  if (venc && venc < hoje) return 'Vencido'
  return 'Pendente'
}

// ─────────────────────────── Contas a Receber ───────────────────────────
// Clientes a Receber (1.1.3): débito = NF emitida, crédito = recebimento.

export function calcularContasReceber(lancamentos: Lancamento[]): ItemReceber[] {
  const linhas = achatar(lancamentos)
  const hoje = hojeISO()
  const grupos = new Map<string, ItemReceber>()

  for (const linha of linhas) {
    if (linha.codConta !== CONTA_CLIENTES) continue
    const chave = linha.parte?.trim() || 'Sem cliente'
    let item = grupos.get(chave)
    if (!item) {
      item = { cliente: chave, totalEmitido: 0, totalRecebido: 0, saldo: 0, status: 'Pendente' }
      grupos.set(chave, item)
    }
    item.totalEmitido += linha.debito
    item.totalRecebido += linha.credito
    if (linha.vencimento && linha.debito > 0) {
      if (!item.proximoVencimento || linha.vencimento < item.proximoVencimento) {
        item.proximoVencimento = linha.vencimento
      }
    }
  }

  const lista = [...grupos.values()]
  for (const item of lista) {
    item.totalEmitido = ARREDONDA(item.totalEmitido)
    item.totalRecebido = ARREDONDA(item.totalRecebido)
    item.saldo = ARREDONDA(item.totalEmitido - item.totalRecebido)
    item.status = statusReceber(item.saldo, item.proximoVencimento, hoje)
  }
  return lista.filter((i) => i.totalEmitido > 0 || i.totalRecebido > 0)
}

function statusReceber(saldo: number, venc: string | undefined, hoje: string): StatusReceber {
  if (Math.abs(saldo) < 0.005) return 'Recebido'
  if (venc && venc < hoje) return 'Vencido'
  return 'Pendente'
}

// ─────────────────────────── Fluxo de Caixa ───────────────────────────
// Regime de caixa: movimentos na conta 1.1.2, classificados por categFC.

export function calcularFluxoCaixa(estado: EstadoFinanceiro): FluxoCaixa {
  const { ano, saldoInicial, lancamentos } = estado
  const linhas = achatar(lancamentos)

  const entradas: LinhaFluxo[] = CATEGORIAS_ENTRADA.map((c) => ({
    categoria: c,
    grupo: 'entrada',
    meses: new Array(12).fill(0),
    total: 0,
  }))
  const saidas: LinhaFluxo[] = CATEGORIAS_SAIDA.map((c) => ({
    categoria: c,
    grupo: 'saida',
    meses: new Array(12).fill(0),
    total: 0,
  }))
  const idxEntrada = new Map(entradas.map((l, i) => [l.categoria, i]))
  const idxSaida = new Map(saidas.map((l, i) => [l.categoria, i]))

  for (const linha of linhas) {
    if (linha.codConta !== CONTA_BANCO) continue
    if (!linha.data.startsWith(String(ano))) continue
    const mes = Number(linha.data.slice(5, 7)) - 1
    if (mes < 0 || mes > 11) continue

    if (linha.debito > 0) {
      const cat = linha.categFC && idxEntrada.has(linha.categFC) ? linha.categFC : 'Outros Recebimentos'
      entradas[idxEntrada.get(cat)!].meses[mes] += linha.debito
    }
    if (linha.credito > 0) {
      const cat = linha.categFC && idxSaida.has(linha.categFC) ? linha.categFC : 'Outras Saidas'
      saidas[idxSaida.get(cat)!].meses[mes] += linha.credito
    }
  }

  const finalizar = (lista: LinhaFluxo[]) => {
    for (const l of lista) {
      l.meses = l.meses.map(ARREDONDA)
      l.total = ARREDONDA(l.meses.reduce((a, b) => a + b, 0))
    }
  }
  finalizar(entradas)
  finalizar(saidas)

  const totalEntradasMes = new Array(12).fill(0)
  const totalSaidasMes = new Array(12).fill(0)
  const resultadoMes = new Array(12).fill(0)
  const saldoFinalMes = new Array(12).fill(0)

  for (let m = 0; m < 12; m++) {
    totalEntradasMes[m] = ARREDONDA(entradas.reduce((a, l) => a + l.meses[m], 0))
    totalSaidasMes[m] = ARREDONDA(saidas.reduce((a, l) => a + l.meses[m], 0))
    resultadoMes[m] = ARREDONDA(totalEntradasMes[m] - totalSaidasMes[m])
    const anterior = m === 0 ? saldoInicial : saldoFinalMes[m - 1]
    saldoFinalMes[m] = ARREDONDA(anterior + resultadoMes[m])
  }

  return {
    entradas,
    saidas,
    totalEntradasMes,
    totalSaidasMes,
    resultadoMes,
    saldoFinalMes,
    saldoInicial,
    ano,
  }
}

// ─────────────────────────── Dashboard ───────────────────────────

export interface ResumoStatus {
  pago: number
  pendente: number
  vencido: number
  total: number
}

export interface DashboardDados {
  totalReceber: number
  totalPagar: number
  saldoCaixaAtual: number
  resultadoMesAtual: number
  saldoBanco: number
  mesReferencia: number // 0..11
  statusPagar: ResumoStatus
  statusReceber: ResumoStatus
  fluxo: FluxoCaixa
  contasPagar: ItemPagar[]
  contasReceber: ItemReceber[]
}

/** Último mês com movimento de caixa (para KPIs do painel). */
export function mesReferencia(fluxo: FluxoCaixa): number {
  for (let m = 11; m >= 0; m--) {
    if (fluxo.totalEntradasMes[m] !== 0 || fluxo.totalSaidasMes[m] !== 0) return m
  }
  return new Date().getMonth()
}

export function calcularDashboard(estado: EstadoFinanceiro, mesEscolhido?: number): DashboardDados {
  const contasPagar = calcularContasPagar(estado.lancamentos)
  const contasReceber = calcularContasReceber(estado.lancamentos)
  const fluxo = calcularFluxoCaixa(estado)
  const mes = mesEscolhido ?? mesReferencia(fluxo)

  const totalPagar = ARREDONDA(contasPagar.reduce((a, i) => a + i.saldo, 0))
  const totalReceber = ARREDONDA(contasReceber.reduce((a, i) => a + i.saldo, 0))

  const statusPagar: ResumoStatus = { pago: 0, pendente: 0, vencido: 0, total: 0 }
  for (const i of contasPagar) {
    if (i.status === 'Pago') statusPagar.pago += i.totalNF
    else if (i.status === 'Vencido') statusPagar.vencido += i.saldo
    else statusPagar.pendente += i.saldo
  }
  statusPagar.total = ARREDONDA(statusPagar.pago + statusPagar.pendente + statusPagar.vencido)

  const statusReceber: ResumoStatus = { pago: 0, pendente: 0, vencido: 0, total: 0 }
  for (const i of contasReceber) {
    if (i.status === 'Recebido') statusReceber.pago += i.totalEmitido
    else if (i.status === 'Vencido') statusReceber.vencido += i.saldo
    else statusReceber.pendente += i.saldo
  }
  statusReceber.total = ARREDONDA(statusReceber.pago + statusReceber.pendente + statusReceber.vencido)

  return {
    totalReceber,
    totalPagar,
    saldoCaixaAtual: fluxo.saldoFinalMes[mes],
    resultadoMesAtual: fluxo.resultadoMes[mes],
    saldoBanco: saldoConta(estado.lancamentos, CONTA_BANCO),
    mesReferencia: mes,
    statusPagar,
    statusReceber,
    fluxo,
    contasPagar,
    contasReceber,
  }
}
