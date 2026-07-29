import type { Lancamento, StatusReceber } from '../tipos'
import { calcularContasReceber } from '../calculos'
import { moeda, dataBR } from '../formatar'
import { Cartao, Selo } from '../../components/ui'

const TOM: Record<StatusReceber, 'verde' | 'amarelo' | 'vermelho'> = {
  Recebido: 'verde',
  Pendente: 'amarelo',
  Vencido: 'vermelho',
}

export function ContasReceber({ lancamentos }: { lancamentos: Lancamento[] }) {
  const itens = calcularContasReceber(lancamentos)
  const totEmit = itens.reduce((a, i) => a + i.totalEmitido, 0)
  const totReceb = itens.reduce((a, i) => a + i.totalRecebido, 0)
  const totSaldo = itens.reduce((a, i) => a + i.saldo, 0)

  return (
    <Cartao>
      <h2 className="mb-1 text-sm font-semibold text-slate-800 dark:text-slate-100">Contas a Receber</h2>
      <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">Calculado automaticamente a partir do Diário (conta 1.1.3 — Clientes a Receber).</p>
      {itens.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">Nenhuma conta a receber registrada.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500 dark:border-slate-700 dark:text-slate-400">
                <th className="py-2 pr-2">Cliente</th>
                <th className="py-2 pr-2 text-right">NF emitida</th>
                <th className="py-2 pr-2 text-right">Recebido</th>
                <th className="py-2 pr-2 text-right">Saldo</th>
                <th className="py-2 pr-2">Próx. venc.</th>
                <th className="py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {itens.map((i) => (
                <tr key={i.cliente} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="py-2 pr-2 font-medium text-slate-800 dark:text-slate-100">{i.cliente}</td>
                  <td className="py-2 pr-2 text-right tabular-nums">{moeda(i.totalEmitido)}</td>
                  <td className="py-2 pr-2 text-right tabular-nums">{moeda(i.totalRecebido)}</td>
                  <td className="py-2 pr-2 text-right font-medium tabular-nums">{moeda(i.saldo)}</td>
                  <td className="py-2 pr-2 text-xs text-slate-500 dark:text-slate-400">{dataBR(i.proximoVencimento)}</td>
                  <td className="py-2"><Selo tom={TOM[i.status]}>{i.status}</Selo></td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-200 font-semibold dark:border-slate-700">
                <td className="py-2 pr-2">Total geral a receber</td>
                <td className="py-2 pr-2 text-right tabular-nums">{moeda(totEmit)}</td>
                <td className="py-2 pr-2 text-right tabular-nums">{moeda(totReceb)}</td>
                <td className="py-2 pr-2 text-right tabular-nums text-emerald-600 dark:text-emerald-400">{moeda(totSaldo)}</td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </Cartao>
  )
}
