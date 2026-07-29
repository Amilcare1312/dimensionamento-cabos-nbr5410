import { useMemo, useState } from 'react'
import type { Lancamento } from '../tipos'
import { nomeConta } from '../planoContas'
import { moeda, dataBR } from '../formatar'
import { totaisLancamento } from '../calculos'
import { Cartao } from '../../components/ui'
import { FormularioLancamento } from './FormularioLancamento'

export function Diario({
  lancamentos,
  onAdicionar,
  onRemover,
}: {
  lancamentos: Lancamento[]
  onAdicionar: (l: Lancamento) => void
  onRemover: (id: string) => void
}) {
  const [busca, setBusca] = useState('')

  const ordenados = useMemo(() => {
    const filtro = busca.trim().toLowerCase()
    return [...lancamentos]
      .filter((l) => {
        if (!filtro) return true
        return (
          l.historico.toLowerCase().includes(filtro) ||
          l.noDoc.toLowerCase().includes(filtro) ||
          l.linhas.some((li) => (li.parte ?? '').toLowerCase().includes(filtro))
        )
      })
      .sort((a, b) => (a.data < b.data ? 1 : a.data > b.data ? -1 : 0))
  }, [lancamentos, busca])

  const totalGeral = useMemo(() => {
    let deb = 0
    for (const l of lancamentos) deb += totaisLancamento(l).debito
    return deb
  }, [lancamentos])

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[380px_1fr]">
      <div>
        <Cartao>
          <h2 className="mb-1 text-sm font-semibold text-slate-800 dark:text-slate-100">Novo lançamento</h2>
          <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">
            Entrada única de dados. Cada transação gera as partidas (débito e crédito) automaticamente.
          </p>
          <FormularioLancamento onAdicionar={onAdicionar} />
        </Cartao>
      </div>

      <div>
        <Cartao>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              Diário de lançamentos <span className="text-slate-400">({lancamentos.length})</span>
            </h2>
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por histórico, doc ou parte…"
              className="w-56 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>

          {ordenados.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
              Nenhum lançamento. Adicione o primeiro no formulário ao lado.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500 dark:border-slate-700 dark:text-slate-400">
                    <th className="py-2 pr-2">Data</th>
                    <th className="py-2 pr-2">Doc</th>
                    <th className="py-2 pr-2">Histórico / Conta</th>
                    <th className="py-2 pr-2 text-right">Débito</th>
                    <th className="py-2 pr-2 text-right">Crédito</th>
                    <th className="py-2" />
                  </tr>
                </thead>
                  {ordenados.map((l) => (
                    <tbody key={l.id} className="align-top">
                      {l.linhas.map((li, idx) => (
                        <tr
                          key={idx}
                          className={idx === 0 ? 'border-t border-slate-100 dark:border-slate-800' : ''}
                        >
                          <td className="py-1 pr-2 text-xs text-slate-500 dark:text-slate-400">{idx === 0 ? dataBR(l.data) : ''}</td>
                          <td className="py-1 pr-2 text-xs text-slate-500 dark:text-slate-400">{idx === 0 ? l.noDoc : ''}</td>
                          <td className="py-1 pr-2">
                            {idx === 0 && <div className="font-medium text-slate-800 dark:text-slate-100">{l.historico}</div>}
                            <div className="text-xs text-slate-500 dark:text-slate-400">
                              {li.codConta} — {nomeConta(li.codConta)}
                              {li.parte ? ` · ${li.parte}` : ''}
                              {li.categFC ? ` · FC: ${li.categFC}` : ''}
                            </div>
                          </td>
                          <td className="py-1 pr-2 text-right tabular-nums text-emerald-600 dark:text-emerald-400">{li.debito ? moeda(li.debito) : ''}</td>
                          <td className="py-1 pr-2 text-right tabular-nums text-rose-600 dark:text-rose-400">{li.credito ? moeda(li.credito) : ''}</td>
                          <td className="py-1 text-right">
                            {idx === 0 && (
                              <button
                                onClick={() => onRemover(l.id)}
                                className="text-slate-400 transition hover:text-rose-500"
                                aria-label="Remover lançamento"
                                title="Remover lançamento"
                              >
                                ✕
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  ))}
                <tfoot>
                  <tr className="border-t-2 border-slate-200 font-semibold dark:border-slate-700">
                    <td colSpan={3} className="py-2 text-slate-600 dark:text-slate-300">Total lançado (débitos)</td>
                    <td className="py-2 pr-2 text-right tabular-nums text-slate-900 dark:text-slate-100">{moeda(totalGeral)}</td>
                    <td colSpan={2} />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </Cartao>
      </div>
    </div>
  )
}
