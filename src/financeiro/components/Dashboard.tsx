import type { EstadoFinanceiro } from '../tipos'
import { calcularDashboard } from '../calculos'
import { moeda } from '../formatar'
import { MESES_CURTOS } from '../categorias'
import { Cartao, Selo } from '../../components/ui'
import { BarrasMensais, Rosca } from './graficos'

function CartaoKPI({
  titulo,
  valor,
  detalhe,
  tom,
}: {
  titulo: string
  valor: string
  detalhe?: string
  tom: 'teal' | 'emerald' | 'rose' | 'amber'
}) {
  const barras: Record<typeof tom, string> = {
    teal: 'from-teal-500 to-teal-600',
    emerald: 'from-emerald-500 to-emerald-600',
    rose: 'from-rose-500 to-rose-600',
    amber: 'from-amber-500 to-amber-600',
  }
  return (
    <Cartao className="relative overflow-hidden">
      <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${barras[tom]}`} />
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">{titulo}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900 dark:text-slate-50">{valor}</p>
      {detalhe && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{detalhe}</p>}
    </Cartao>
  )
}

export function Dashboard({ estado }: { estado: EstadoFinanceiro }) {
  const d = calcularDashboard(estado)
  const nomeMes = MESES_CURTOS[d.mesReferencia]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <CartaoKPI titulo="Total a Receber" valor={moeda(d.totalReceber)} detalhe="Saldo em aberto de clientes" tom="emerald" />
        <CartaoKPI titulo="Total a Pagar" valor={moeda(d.totalPagar)} detalhe="Saldo em aberto de fornecedores" tom="rose" />
        <CartaoKPI titulo={`Saldo de Caixa (${nomeMes})`} valor={moeda(d.saldoCaixaAtual)} detalhe="Saldo final acumulado no mês" tom="teal" />
        <CartaoKPI
          titulo={`Resultado (${nomeMes})`}
          valor={moeda(d.resultadoMesAtual)}
          detalhe={d.resultadoMesAtual >= 0 ? 'Superávit de caixa' : 'Déficit de caixa'}
          tom={d.resultadoMesAtual >= 0 ? 'emerald' : 'amber'}
        />
      </div>

      <Cartao>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Fluxo de Caixa {estado.ano}</h2>
          <span className="text-xs text-slate-500 dark:text-slate-400">Saldo do banco hoje: {moeda(d.saldoBanco)}</span>
        </div>
        <BarrasMensais entradas={d.fluxo.totalEntradasMes} saidas={d.fluxo.totalSaidasMes} saldo={d.fluxo.saldoFinalMes} />
      </Cartao>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Cartao>
          <h2 className="mb-3 text-sm font-semibold text-slate-800 dark:text-slate-100">A Pagar — por status</h2>
          <Rosca
            titulo="Contas a pagar por status"
            fatias={[
              { rotulo: 'Pago', valor: d.statusPagar.pago, cor: 'fill-emerald-500' },
              { rotulo: 'Pendente', valor: d.statusPagar.pendente, cor: 'fill-amber-500' },
              { rotulo: 'Vencido', valor: d.statusPagar.vencido, cor: 'fill-rose-500' },
            ]}
          />
        </Cartao>
        <Cartao>
          <h2 className="mb-3 text-sm font-semibold text-slate-800 dark:text-slate-100">A Receber — por status</h2>
          <Rosca
            titulo="Contas a receber por status"
            fatias={[
              { rotulo: 'Recebido', valor: d.statusReceber.pago, cor: 'fill-emerald-500' },
              { rotulo: 'Pendente', valor: d.statusReceber.pendente, cor: 'fill-amber-500' },
              { rotulo: 'Vencido', valor: d.statusReceber.vencido, cor: 'fill-rose-500' },
            ]}
          />
        </Cartao>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Cartao>
          <h2 className="mb-3 text-sm font-semibold text-slate-800 dark:text-slate-100">Maiores contas a receber</h2>
          <TabelaTop
            linhas={d.contasReceber
              .filter((i) => i.saldo > 0)
              .sort((a, b) => b.saldo - a.saldo)
              .slice(0, 6)
              .map((i) => ({ nome: i.cliente, valor: i.saldo, status: i.status }))}
            vazio="Nenhuma conta a receber em aberto."
          />
        </Cartao>
        <Cartao>
          <h2 className="mb-3 text-sm font-semibold text-slate-800 dark:text-slate-100">Maiores contas a pagar</h2>
          <TabelaTop
            linhas={d.contasPagar
              .filter((i) => i.saldo > 0)
              .sort((a, b) => b.saldo - a.saldo)
              .slice(0, 6)
              .map((i) => ({ nome: i.nome, valor: i.saldo, status: i.status }))}
            vazio="Nenhuma conta a pagar em aberto."
          />
        </Cartao>
      </div>
    </div>
  )
}

function TabelaTop({
  linhas,
  vazio,
}: {
  linhas: { nome: string; valor: number; status: string }[]
  vazio: string
}) {
  if (linhas.length === 0) return <p className="text-sm text-slate-500 dark:text-slate-400">{vazio}</p>
  const total = linhas.reduce((a, l) => a + l.valor, 0)
  return (
    <ul className="space-y-2">
      {linhas.map((l) => (
        <li key={l.nome}>
          <div className="flex items-center justify-between text-sm">
            <span className="truncate text-slate-700 dark:text-slate-200">{l.nome}</span>
            <span className="ml-2 shrink-0 font-medium tabular-nums text-slate-900 dark:text-slate-100">{moeda(l.valor)}</span>
          </div>
          <div className="mt-1 flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div
                className={`h-full rounded-full ${l.status === 'Vencido' ? 'bg-rose-500' : 'bg-teal-500'}`}
                style={{ width: `${total > 0 ? (l.valor / total) * 100 : 0}%` }}
              />
            </div>
            <Selo tom={l.status === 'Vencido' ? 'vermelho' : 'amarelo'}>{l.status}</Selo>
          </div>
        </li>
      ))}
      <li className="flex items-center justify-between border-t border-slate-100 pt-2 text-sm font-semibold dark:border-slate-800">
        <span className="text-slate-600 dark:text-slate-300">Total exibido</span>
        <span className="tabular-nums text-slate-900 dark:text-slate-100">{moeda(total)}</span>
      </li>
    </ul>
  )
}
