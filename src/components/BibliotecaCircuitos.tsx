import { dimensionarCabo } from '../lib/calculos'
import type { CircuitoSalvo } from '../lib/biblioteca'
import { BotaoSecundario, Cartao, Selo } from './ui'

export function BibliotecaCircuitos({
  circuitos,
  onRemover,
  onCarregar,
}: {
  circuitos: CircuitoSalvo[]
  onRemover: (id: string) => void
  onCarregar: (circuito: CircuitoSalvo) => void
}) {
  if (circuitos.length === 0) {
    return (
      <Cartao>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Nenhum circuito salvo ainda. Dimensione um circuito na aba "Dimensionar" e clique em
          "Salvar na biblioteca" para montar o resumo do seu quadro de distribuição.
        </p>
      </Cartao>
    )
  }

  const linhas = circuitos.map((c) => ({ circuito: c, resultado: dimensionarCabo(c.entrada) }))
  const potenciaTotalA = linhas.reduce((soma, l) => soma + l.resultado.correnteProjeto, 0)

  return (
    <div className="flex flex-col gap-4">
      <Cartao>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">
            Biblioteca de circuitos — quadro de distribuição
          </h2>
          <Selo tom="neutro">{circuitos.length} circuito(s) · Ib total ≈ {potenciaTotalA.toFixed(1)} A</Selo>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-500 dark:text-slate-400">
                <th className="py-1 pr-3">Circuito</th>
                <th className="py-1 pr-3">Método</th>
                <th className="py-1 pr-3">Ib (A)</th>
                <th className="py-1 pr-3">Seção</th>
                <th className="py-1 pr-3">Disjuntor</th>
                <th className="py-1 pr-3">ΔV%</th>
                <th className="py-1 pr-3">Situação</th>
                <th className="py-1 pr-3"></th>
              </tr>
            </thead>
            <tbody>
              {linhas.map(({ circuito, resultado }) => (
                <tr key={circuito.id} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="py-1.5 pr-3 font-medium text-slate-800 dark:text-slate-100">
                    {circuito.entrada.nome}
                  </td>
                  <td className="py-1.5 pr-3">{circuito.entrada.metodoInstalacao}</td>
                  <td className="py-1.5 pr-3">{resultado.correnteProjeto.toFixed(1)}</td>
                  <td className="py-1.5 pr-3">{resultado.secaoEscolhida} mm²</td>
                  <td className="py-1.5 pr-3">{resultado.disjuntorSugeridoA ?? '—'} A</td>
                  <td className="py-1.5 pr-3">{resultado.quedaTensaoPercent.toFixed(2)}%</td>
                  <td className="py-1.5 pr-3">
                    <Selo tom={resultado.alertas.some((a) => a.nivel === 'erro') ? 'vermelho' : resultado.quedaTensaoOk ? 'verde' : 'amarelo'}>
                      {resultado.alertas.some((a) => a.nivel === 'erro')
                        ? 'Erro'
                        : resultado.quedaTensaoOk
                          ? 'OK'
                          : 'Atenção'}
                    </Selo>
                  </td>
                  <td className="py-1.5 pr-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => onCarregar(circuito)}
                        className="text-xs font-medium text-teal-700 hover:underline dark:text-teal-400"
                      >
                        Carregar
                      </button>
                      <button
                        onClick={() => onRemover(circuito.id)}
                        className="text-xs font-medium text-red-600 hover:underline dark:text-red-400"
                      >
                        Remover
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Cartao>
      <BotaoSecundario onClick={() => window.print()} className="self-start">
        Imprimir resumo do quadro
      </BotaoSecundario>
    </div>
  )
}
