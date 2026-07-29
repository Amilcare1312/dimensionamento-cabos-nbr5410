import type { Lancamento, StatusPagar } from '../tipos'
import { calcularContasPagar } from '../calculos'
import { moeda, dataBR } from '../formatar'
import { Cartao, Selo } from '../../components/ui'

const TOM: Record<StatusPagar, 'verde' | 'amarelo' | 'vermelho'> = {
  Pago: 'verde',
  Pendente: 'amarelo',
  Vencido: 'vermelho',
}

export function ContasPagar({ lancamentos }: { lancamentos: Lancamento[] }) {
  const itens = calcularContasPagar(lancamentos)
  const totNF = itens.reduce((a, i) => a + i.totalNF, 0)
  const totPago = itens.reduce((a, i) => a + i.totalPago, 0)
  const totSaldo = itens.reduce((a, i) => a + i.saldo, 0)

  return (
    <Cartao>
      <h2 className="mb-1 text-sm font-semibold text-slate-800 dark:text-slate-100">Contas a Pagar</h2>
      <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">Calculado automaticamente a partir do Diário (contas 2.1.1, 2.1.2, 2.1.3).</p>
      {itens.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">Nenhuma conta a pagar registrada.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500 dark:border-slate-700 dark:text-slate-400">
                <th className="py-2 pr-2">Fornecedor / Categoria</th>
                <th className="py-2 pr-2">Grupo</th>
                <th className="py-2 pr-2 text-right">Total NF</th>
                <th className="py-2 pr-2 text-right">Pago</th>
                <th className="py-2 pr-2 text-right">Saldo</th>
                <th className="py-2 pr-2">Próx. venc.</th>
                <th className="py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {itens.map((i) => (
                <tr key={i.grupo + i.nome} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="py-2 pr-2 font-medium text-slate-800 dark:text-slate-100">{i.nome}</td>
                  <td className="py-2 pr-2 text-xs text-slate-500 dark:text-slate-400">{i.grupo}</td>
                  <td className="py-2 pr-2 text-right tabular-nums">{moeda(i.totalNF)}</td>
                  <td className="py-2 pr-2 text-right tabular-nums">{moeda(i.totalPago)}</td>
                  <td className="py-2 pr-2 text-right font-medium tabular-nums">{moeda(i.saldo)}</td>
                  <td className="py-2 pr-2 text-xs text-slate-500 dark:text-slate-400">{dataBR(i.proximoVencimento)}</td>
                  <td className="py-2"><Selo tom={TOM[i.status]}>{i.status}</Selo></td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-200 font-semibold dark:border-slate-700">
                <td className="py-2 pr-2" colSpan={2}>Total geral a pagar</td>
                <td className="py-2 pr-2 text-right tabular-nums">{moeda(totNF)}</td>
                <td className="py-2 pr-2 text-right tabular-nums">{moeda(totPago)}</td>
                <td className="py-2 pr-2 text-right tabular-nums text-rose-600 dark:text-rose-400">{moeda(totSaldo)}</td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </Cartao>
  )
}
