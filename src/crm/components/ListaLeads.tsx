import { useMemo, useState } from 'react'
import type { Etapa, Lead, Produto } from '../tipos'
import { ETAPAS, PRODUTOS, TEMPERATURAS, metaEtapa } from '../tipos'
import { diasAte, iniciais, moeda, relativoDias, telefoneBR } from '../formatar'
import { abrirWhatsApp, telefoneValido } from '../whatsapp'
import { Selo } from '../../components/ui'
import { Avatar, SelectCrm } from './ui'

type OrdenarPor = 'recente' | 'valor' | 'followup' | 'nome'

export function ListaLeads({ leads, onAbrir }: { leads: Lead[]; onAbrir: (id: string) => void }) {
  const [busca, setBusca] = useState('')
  const [fEtapa, setFEtapa] = useState<Etapa | 'todas'>('todas')
  const [fProduto, setFProduto] = useState<Produto | 'todos'>('todos')
  const [ordenar, setOrdenar] = useState<OrdenarPor>('recente')

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    const arr = leads.filter((l) => {
      if (fEtapa !== 'todas' && l.etapa !== fEtapa) return false
      if (fProduto !== 'todos' && l.produto !== fProduto) return false
      if (!termo) return true
      return [l.nome, l.empresa, l.cidade, l.telefone, l.tags.join(' ')]
        .filter(Boolean)
        .some((c) => c!.toLowerCase().includes(termo))
    })
    return arr.sort((a, b) => {
      switch (ordenar) {
        case 'valor':
          return b.valorEstimado - a.valorEstimado
        case 'nome':
          return a.nome.localeCompare(b.nome)
        case 'followup': {
          const da = diasAte(a.proximoContato)
          const db = diasAte(b.proximoContato)
          if (da === null) return 1
          if (db === null) return -1
          return da - db
        }
        default:
          return (b.atualizadoEm ?? '').localeCompare(a.atualizadoEm ?? '')
      }
    })
  }, [leads, busca, fEtapa, fProduto, ordenar])

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="🔎 Buscar nome, empresa, cidade, tag…"
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
        />
        <SelectCrm value={fEtapa} onChange={(e) => setFEtapa(e.target.value as Etapa | 'todas')}>
          <option value="todas">Todas as etapas</option>
          {ETAPAS.map((et) => (
            <option key={et.id} value={et.id}>
              {et.rotulo}
            </option>
          ))}
        </SelectCrm>
        <SelectCrm value={fProduto} onChange={(e) => setFProduto(e.target.value as Produto | 'todos')}>
          <option value="todos">Todos os produtos</option>
          {PRODUTOS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.rotulo}
            </option>
          ))}
        </SelectCrm>
        <SelectCrm value={ordenar} onChange={(e) => setOrdenar(e.target.value as OrdenarPor)}>
          <option value="recente">Ordenar: mais recentes</option>
          <option value="valor">Ordenar: maior valor</option>
          <option value="followup">Ordenar: follow-up mais urgente</option>
          <option value="nome">Ordenar: nome (A-Z)</option>
        </SelectCrm>
      </div>

      <p className="text-xs text-slate-500 dark:text-slate-400">
        {filtrados.length} de {leads.length} leads
      </p>

      {filtrados.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 py-10 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
          Nenhum lead encontrado com esses filtros.
        </p>
      ) : (
        <>
          {/* Tabela em telas médias+ */}
          <div className="hidden overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 md:block">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
                <tr>
                  <th className="px-3 py-2 font-medium">Lead</th>
                  <th className="px-3 py-2 font-medium">Produto</th>
                  <th className="px-3 py-2 font-medium">Etapa</th>
                  <th className="px-3 py-2 text-right font-medium">Valor</th>
                  <th className="px-3 py-2 font-medium">Follow-up</th>
                  <th className="px-3 py-2 font-medium">Origem</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtrados.map((l) => {
                  const meta = metaEtapa(l.etapa)
                  const dias = diasAte(l.proximoContato)
                  const temp = TEMPERATURAS.find((t) => t.id === l.temperatura)
                  return (
                    <tr
                      key={l.id}
                      onClick={() => onAbrir(l.id)}
                      className="cursor-pointer transition hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    >
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <Avatar nome={l.nome} texto={iniciais(l.nome)} />
                          <div className="min-w-0">
                            <p className="truncate font-medium text-slate-800 dark:text-slate-100">
                              {temp?.emoji} {l.nome}
                            </p>
                            <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                              {l.empresa || telefoneBR(l.telefone)}
                              {l.cidade ? ` · ${l.cidade}` : ''}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-slate-600 dark:text-slate-300">{l.produto}</td>
                      <td className="px-3 py-2">
                        <Selo tom={meta.tom}>{meta.rotulo}</Selo>
                      </td>
                      <td className="px-3 py-2 text-right font-medium tabular-nums text-slate-700 dark:text-slate-200">
                        {moeda(l.valorEstimado)}
                      </td>
                      <td className="px-3 py-2">
                        {l.proximoContato ? (
                          <span
                            className={
                              dias !== null && dias < 0
                                ? 'text-rose-600 dark:text-rose-400'
                                : dias === 0
                                  ? 'text-amber-600 dark:text-amber-400'
                                  : 'text-slate-500 dark:text-slate-400'
                            }
                          >
                            {relativoDias(l.proximoContato)}
                          </span>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-slate-500 dark:text-slate-400">{l.origem}</td>
                      <td className="px-3 py-2 text-right">
                        {telefoneValido(l.telefone) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              abrirWhatsApp(l.telefone)
                            }}
                            title="Abrir WhatsApp"
                            className="rounded p-1 text-emerald-600 transition hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-900/30"
                          >
                            💬
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Cartões em telas pequenas */}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:hidden">
            {filtrados.map((l) => {
              const meta = metaEtapa(l.etapa)
              const temp = TEMPERATURAS.find((t) => t.id === l.temperatura)
              return (
                <button
                  key={l.id}
                  onClick={() => onAbrir(l.id)}
                  className="rounded-xl border border-slate-200 bg-white p-3 text-left shadow-sm transition hover:border-teal-300 dark:border-slate-700 dark:bg-slate-800"
                >
                  <div className="flex items-center gap-2">
                    <Avatar nome={l.nome} texto={iniciais(l.nome)} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-slate-800 dark:text-slate-100">
                        {temp?.emoji} {l.nome}
                      </p>
                      <p className="truncate text-xs text-slate-500 dark:text-slate-400">{l.empresa || telefoneBR(l.telefone)}</p>
                    </div>
                    <Selo tom={meta.tom}>{meta.rotulo}</Selo>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400">{l.produto}</span>
                    <span className="font-semibold tabular-nums text-slate-700 dark:text-slate-200">{moeda(l.valorEstimado)}</span>
                  </div>
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
