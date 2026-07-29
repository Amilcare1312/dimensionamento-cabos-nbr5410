import type { EstadoFinanceiro, LinhaFluxo } from '../tipos'
import { calcularFluxoCaixa } from '../calculos'
import { moeda } from '../formatar'
import { MESES_CURTOS } from '../categorias'
import { Cartao, NumberInput } from '../../components/ui'

function celulaValor(v: number, key: number, negativo = false) {
  const cor = v === 0 ? 'text-slate-300 dark:text-slate-600' : negativo ? 'text-rose-600 dark:text-rose-400' : ''
  return <td key={key} className={`px-2 py-1 text-right tabular-nums ${cor}`}>{v === 0 ? '—' : moeda(v)}</td>
}

function LinhaCategoria({ l }: { l: LinhaFluxo }) {
  return (
    <tr className="border-t border-slate-100 dark:border-slate-800">
      <td className="sticky left-0 bg-white px-2 py-1 text-slate-700 dark:bg-slate-900 dark:text-slate-200">{l.categoria}</td>
      {l.meses.map((v, i) => (
        <td key={i} className={`px-2 py-1 text-right tabular-nums ${v === 0 ? 'text-slate-300 dark:text-slate-600' : ''}`}>
          {v === 0 ? '·' : moeda(v)}
        </td>
      ))}
      <td className="px-2 py-1 text-right font-medium tabular-nums">{moeda(l.total)}</td>
    </tr>
  )
}

export function FluxoCaixa({
  estado,
  onSaldoInicial,
}: {
  estado: EstadoFinanceiro
  onSaldoInicial: (v: number) => void
}) {
  const fc = calcularFluxoCaixa(estado)

  return (
    <div className="space-y-4">
      <Cartao>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Fluxo de Caixa — Regime de Caixa {estado.ano}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Movimentos da conta 1.1.2 (banco), classificados por categoria.</p>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <span className="text-slate-600 dark:text-slate-300">Saldo inicial (Jan)</span>
            <div className="w-36">
              <NumberInput
                value={estado.saldoInicial}
                step="0.01"
                onChange={(e) => onSaldoInicial(Number(e.target.value) || 0)}
              />
            </div>
          </label>
        </div>
      </Cartao>

      <Cartao className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-xs">
            <thead>
              <tr className="text-slate-500 dark:text-slate-400">
                <th className="sticky left-0 bg-white px-2 py-2 text-left dark:bg-slate-900">Categoria</th>
                {MESES_CURTOS.map((m) => (
                  <th key={m} className="px-2 py-2 text-right">{m}</th>
                ))}
                <th className="px-2 py-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr className="bg-emerald-50 font-semibold text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300">
                <td className="sticky left-0 bg-emerald-50 px-2 py-1 dark:bg-emerald-900/20" colSpan={14}>ENTRADAS DE CAIXA</td>
              </tr>
              {fc.entradas.map((l) => <LinhaCategoria key={l.categoria} l={l} />)}
              <tr className="border-t border-slate-200 font-semibold dark:border-slate-700">
                <td className="sticky left-0 bg-white px-2 py-1 dark:bg-slate-900">Total entradas</td>
                {fc.totalEntradasMes.map((v, i) => celulaValor(v, i))}
                <td className="px-2 py-1 text-right tabular-nums">{moeda(fc.entradas.reduce((a, l) => a + l.total, 0))}</td>
              </tr>

              <tr className="bg-rose-50 font-semibold text-rose-800 dark:bg-rose-900/20 dark:text-rose-300">
                <td className="sticky left-0 bg-rose-50 px-2 py-1 dark:bg-rose-900/20" colSpan={14}>SAÍDAS DE CAIXA</td>
              </tr>
              {fc.saidas.map((l) => <LinhaCategoria key={l.categoria} l={l} />)}
              <tr className="border-t border-slate-200 font-semibold dark:border-slate-700">
                <td className="sticky left-0 bg-white px-2 py-1 dark:bg-slate-900">Total saídas</td>
                {fc.totalSaidasMes.map((v, i) => celulaValor(v, i))}
                <td className="px-2 py-1 text-right tabular-nums">{moeda(fc.saidas.reduce((a, l) => a + l.total, 0))}</td>
              </tr>

              <tr className="border-t-2 border-slate-300 font-semibold dark:border-slate-600">
                <td className="sticky left-0 bg-white px-2 py-1 dark:bg-slate-900">Resultado do período</td>
                {fc.resultadoMes.map((v, i) => celulaValor(v, i, v < 0))}
                <td className="px-2 py-1 text-right tabular-nums">{moeda(fc.resultadoMes.reduce((a, v) => a + v, 0))}</td>
              </tr>
              <tr className="font-semibold text-teal-700 dark:text-teal-300">
                <td className="sticky left-0 bg-white px-2 py-1 dark:bg-slate-900">Saldo final</td>
                {fc.saldoFinalMes.map((v, i) => celulaValor(v, i, v < 0))}
                <td className="px-2 py-1 text-right tabular-nums">{moeda(fc.saldoFinalMes[11])}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Cartao>
    </div>
  )
}
