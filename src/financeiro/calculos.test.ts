import { describe, expect, it } from 'vitest'
import { estadoInicial } from './dadosIniciais'
import {
  calcularContasPagar,
  calcularContasReceber,
  calcularDashboard,
  calcularFluxoCaixa,
  lancamentoValido,
  saldoConta,
} from './calculos'
import { montarLancamento } from './modelos'

const estado = estadoInicial()

describe('Contas a Pagar', () => {
  const cp = calcularContasPagar(estado.lancamentos)

  it('marca fornecedor quitado como Pago', () => {
    const aluguel = cp.find((i) => i.nome === 'Aluguel Comercial Ltda')!
    expect(aluguel.saldo).toBe(0)
    expect(aluguel.status).toBe('Pago')
  })

  it('marca NF em aberto e vencida como Vencido', () => {
    const mkt = cp.find((i) => i.nome === 'Marketing Digital Co.')!
    expect(mkt.saldo).toBe(2500)
    expect(mkt.status).toBe('Vencido')
  })

  it('soma total a pagar em aberto', () => {
    const total = cp.reduce((a, i) => a + i.saldo, 0)
    expect(total).toBeCloseTo(3480, 2)
  })
})

describe('Contas a Receber', () => {
  const cr = calcularContasReceber(estado.lancamentos)

  it('marca cliente que pagou como Recebido', () => {
    const beta = cr.find((i) => i.cliente === 'Beta Comercio S.A.')!
    expect(beta.saldo).toBe(0)
    expect(beta.status).toBe('Recebido')
  })

  it('soma total a receber em aberto', () => {
    const total = cr.reduce((a, i) => a + i.saldo, 0)
    expect(total).toBeCloseTo(6200, 2)
  })
})

describe('Saldo de conta', () => {
  it('calcula saldo do banco (1.1.2)', () => {
    expect(saldoConta(estado.lancamentos, '1.1.2')).toBeCloseTo(6030, 2)
  })
})

describe('Fluxo de Caixa', () => {
  const fc = calcularFluxoCaixa(estado)

  it('classifica entradas e saídas de maio', () => {
    const maio = 4
    expect(fc.totalEntradasMes[maio]).toBeCloseTo(23500, 2)
    expect(fc.totalSaidasMes[maio]).toBeCloseTo(17470, 2)
    expect(fc.resultadoMes[maio]).toBeCloseTo(6030, 2)
  })

  it('acumula saldo final mês a mês', () => {
    expect(fc.saldoFinalMes[4]).toBeCloseTo(6030, 2)
    expect(fc.saldoFinalMes[11]).toBeCloseTo(6030, 2)
  })
})

describe('Dashboard', () => {
  const d = calcularDashboard(estado)
  it('consolida KPIs principais', () => {
    expect(d.totalPagar).toBeCloseTo(3480, 2)
    expect(d.totalReceber).toBeCloseTo(6200, 2)
    expect(d.mesReferencia).toBe(4)
  })
})

describe('Lançamento guiado', () => {
  it('gera partidas balanceadas para despesa a prazo', () => {
    const l = montarLancamento({
      tipo: 'despesa_prazo',
      data: '2026-06-01',
      noDoc: 'NF-X',
      historico: 'Teste',
      valor: 1000,
      parte: 'Fornecedor X',
      vencimento: '2026-06-10',
      contaResultado: '4.2.4',
      categFC: '',
    })
    expect(l.linhas).toHaveLength(2)
    expect(lancamentoValido(l)).toBe(true)
  })

  it('recebimento credita clientes e debita banco', () => {
    const l = montarLancamento({
      tipo: 'recebimento',
      data: '2026-06-01',
      noDoc: 'REC-X',
      historico: 'Teste',
      valor: 500,
      parte: 'Cliente Y',
      vencimento: '',
      contaResultado: '',
      categFC: 'Receitas de Servicos',
    })
    const banco = l.linhas.find((x) => x.codConta === '1.1.2')!
    expect(banco.debito).toBe(500)
    expect(banco.categFC).toBe('Receitas de Servicos')
    expect(lancamentoValido(l)).toBe(true)
  })
})
