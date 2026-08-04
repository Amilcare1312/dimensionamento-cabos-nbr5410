import type { EstadoCRM } from '../tipos'
import { calcularDashboard, pendenciasFollowup } from '../calculos'
import { iniciais, moeda, moedaCompacta, percentual, relativoDias } from '../formatar'
import { Cartao, Selo } from '../../components/ui'
import { Avatar } from './ui'
import { Funil, Rosca } from './graficos'

const CORES_ROSCA = ['fill-teal-500', 'fill-sky-500', 'fill-indigo-500', 'fill-amber-500', 'fill-rose-500', 'fill-emerald-500', 'fill-slate-400']

function CartaoKPI({
  titulo,
  valor,
  detalhe,
  tom,
}: {
  titulo: string
  valor: string
  detalhe?: string
  tom: 'teal' | 'emerald' | 'rose' | 'amber' | 'indigo'
}) {
  const barras: Record<typeof tom, string> = {
    teal: 'from-teal-500 to-teal-600',
    emerald: 'from-emerald-500 to-emerald-600',
    rose: 'from-rose-500 to-rose-600',
    amber: 'from-amber-500 to-amber-600',
    indigo: 'from-indigo-500 to-indigo-600',
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

export function Dashboard({ estado, onAbrir }: { estado: EstadoCRM; onAbrir: (id: string) => void }) {
  const d = calcularDashboard(estado)
  const pendencias = pendenciasFollowup(estado.leads)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <CartaoKPI titulo="Leads em aberto" valor={String(d.leadsAbertos)} detalhe={`${d.totalLeads} no total · ${d.novosNoMes} novos no mês`} tom="teal" />
        <CartaoKPI titulo="Valor no pipeline" valor={moedaCompacta(d.valorPipeline)} detalhe="Soma dos negócios em aberto" tom="indigo" />
        <CartaoKPI titulo="Taxa de conversão" valor={percentual(d.taxaConversao)} detalhe={`${d.ganhos} ganhos / ${d.fechados} fechados`} tom="emerald" />
        <CartaoKPI titulo="Ganho (fechado)" valor={moedaCompacta(d.valorGanho)} detalhe={`Ticket médio ${moeda(d.ticketMedio)}`} tom="amber" />
      </div>

      {(d.followupsAtrasados > 0 || d.followupsHoje > 0) && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm dark:border-amber-900 dark:bg-amber-900/20">
          <span className="text-lg">⏰</span>
          <span className="text-amber-800 dark:text-amber-300">
            {d.followupsAtrasados > 0 && <strong>{d.followupsAtrasados} follow-up(s) atrasado(s)</strong>}
            {d.followupsAtrasados > 0 && d.followupsHoje > 0 && ' · '}
            {d.followupsHoje > 0 && <strong>{d.followupsHoje} para hoje</strong>}
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Cartao className="lg:col-span-2">
          <h2 className="mb-3 text-sm font-semibold text-slate-800 dark:text-slate-100">Funil de vendas</h2>
          <Funil etapas={d.porEtapa} />
        </Cartao>

        <Cartao>
          <h2 className="mb-3 text-sm font-semibold text-slate-800 dark:text-slate-100">⏰ A fazer hoje</h2>
          {pendencias.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">Nenhum follow-up pendente. 🎉</p>
          ) : (
            <ul className="space-y-2">
              {pendencias.slice(0, 6).map((l) => (
                <li key={l.id}>
                  <button
                    onClick={() => onAbrir(l.id)}
                    className="flex w-full items-center gap-2 rounded-lg p-1.5 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <Avatar nome={l.nome} texto={iniciais(l.nome)} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">{l.nome}</p>
                      <p className="truncate text-xs text-slate-500 dark:text-slate-400">{l.empresa || l.produto}</p>
                    </div>
                    <Selo tom="vermelho">{relativoDias(l.proximoContato)}</Selo>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Cartao>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Cartao>
          <h2 className="mb-3 text-sm font-semibold text-slate-800 dark:text-slate-100">Leads por origem</h2>
          <Rosca
            titulo="Distribuição por origem"
            fatias={d.porOrigem.map((o, i) => ({ rotulo: o.rotulo, valor: o.quantidade, cor: CORES_ROSCA[i % CORES_ROSCA.length] }))}
          />
        </Cartao>
        <Cartao>
          <h2 className="mb-3 text-sm font-semibold text-slate-800 dark:text-slate-100">Leads por produto</h2>
          <Rosca
            titulo="Distribuição por produto"
            fatias={d.porProduto.map((o, i) => ({ rotulo: o.rotulo, valor: o.quantidade, cor: CORES_ROSCA[i % CORES_ROSCA.length] }))}
          />
        </Cartao>
      </div>
    </div>
  )
}
