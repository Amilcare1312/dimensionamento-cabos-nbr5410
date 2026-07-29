import { useEffect, useMemo, useState } from 'react'
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
  onRemoverVarios,
}: {
  lancamentos: Lancamento[]
  onAdicionar: (l: Lancamento) => void
  onRemover: (id: string) => void
  onRemoverVarios: (ids: string[]) => void
}) {
  const [busca, setBusca] = useState('')
  const [selecionados, setSelecionados] = useState<Set<string>>(() => new Set())

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

  // Remove da seleção ids que não existem mais (após exclusão externa).
  useEffect(() => {
    setSelecionados((sel) => {
      const existentes = new Set(lancamentos.map((l) => l.id))
      let mudou = false
      const nova = new Set<string>()
      for (const id of sel) {
        if (existentes.has(id)) nova.add(id)
        else mudou = true
      }
      return mudou ? nova : sel
    })
  }, [lancamentos])

  const totalGeral = useMemo(() => {
    let deb = 0
    for (const l of lancamentos) deb += totaisLancamento(l).debito
    return deb
  }, [lancamentos])

  const idsVisiveis = ordenados.map((l) => l.id)
  const todosMarcados = idsVisiveis.length > 0 && idsVisiveis.every((id) => selecionados.has(id))
  const algunsMarcados = idsVisiveis.some((id) => selecionados.has(id))

  function alternar(id: string) {
    setSelecionados((sel) => {
      const nova = new Set(sel)
      if (nova.has(id)) nova.delete(id)
      else nova.add(id)
      return nova
    })
  }

  function alternarTodos() {
    setSelecionados((sel) => {
      const nova = new Set(sel)
      if (todosMarcados) idsVisiveis.forEach((id) => nova.delete(id))
      else idsVisiveis.forEach((id) => nova.add(id))
      return nova
    })
  }

  function excluirSelecionados() {
    const ids = [...selecionados]
    if (ids.length === 0) return
    onRemoverVarios(ids)
    setSelecionados(new Set())
  }

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

          {selecionados.size > 0 && (
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-teal-50 px-3 py-2 text-sm dark:bg-teal-900/20">
              <span className="font-medium text-teal-800 dark:text-teal-200">
                {selecionados.size} lançamento(s) selecionado(s)
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelecionados(new Set())}
                  className="rounded-md px-2 py-1 text-xs font-medium text-slate-600 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Limpar seleção
                </button>
                <button
                  onClick={excluirSelecionados}
                  className="rounded-md bg-rose-600 px-3 py-1 text-xs font-medium text-white shadow-sm transition hover:bg-rose-700"
                >
                  Excluir selecionados
                </button>
              </div>
            </div>
          )}

          {ordenados.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
              {lancamentos.length === 0
                ? 'Nenhum lançamento. Adicione o primeiro no formulário ao lado.'
                : 'Nenhum lançamento corresponde à busca.'}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500 dark:border-slate-700 dark:text-slate-400">
                    <th className="py-2 pr-2">
                      <input
                        type="checkbox"
                        checked={todosMarcados}
                        ref={(el) => {
                          if (el) el.indeterminate = !todosMarcados && algunsMarcados
                        }}
                        onChange={alternarTodos}
                        aria-label="Selecionar todos"
                        className="h-4 w-4 cursor-pointer accent-teal-600"
                      />
                    </th>
                    <th className="py-2 pr-2">Data</th>
                    <th className="py-2 pr-2">Doc</th>
                    <th className="py-2 pr-2">Histórico / Conta</th>
                    <th className="py-2 pr-2 text-right">Débito</th>
                    <th className="py-2 pr-2 text-right">Crédito</th>
                    <th className="py-2" />
                  </tr>
                </thead>
                {ordenados.map((l) => {
                  const marcado = selecionados.has(l.id)
                  return (
                    <tbody key={l.id} className={`align-top ${marcado ? 'bg-teal-50/60 dark:bg-teal-900/10' : ''}`}>
                      {l.linhas.map((li, idx) => (
                        <tr
                          key={idx}
                          className={idx === 0 ? 'border-t border-slate-100 dark:border-slate-800' : ''}
                        >
                          <td className="py-1 pr-2">
                            {idx === 0 && (
                              <input
                                type="checkbox"
                                checked={marcado}
                                onChange={() => alternar(l.id)}
                                aria-label={`Selecionar ${l.noDoc}`}
                                className="h-4 w-4 cursor-pointer accent-teal-600"
                              />
                            )}
                          </td>
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
                  )
                })}
                <tfoot>
                  <tr className="border-t-2 border-slate-200 font-semibold dark:border-slate-700">
                    <td colSpan={4} className="py-2 text-slate-600 dark:text-slate-300">Total lançado (débitos)</td>
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
