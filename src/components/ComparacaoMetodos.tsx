import { useMemo } from 'react'
import { compararMetodosInstalacao, type EntradaCircuito } from '../lib/calculos'
import { ROTULO_CRITERIO } from '../lib/rotulos'
import { METODOS_INSTALACAO } from '../lib/tabelas'
import { Cartao, Selo } from './ui'

export function ComparacaoMetodos({ entrada }: { entrada: EntradaCircuito }) {
  const comparativos = useMemo(
    () =>
      compararMetodosInstalacao(
        entrada,
        METODOS_INSTALACAO.map((m) => m.codigo),
      ),
    [entrada],
  )

  return (
    <Cartao>
      <h2 className="mb-1 text-base font-semibold text-slate-800 dark:text-slate-100">
        Comparação entre métodos de instalação
      </h2>
      <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
        Mesmo circuito ({entrada.nome}), simulado em todos os métodos de referência da Tabela 33 —
        útil para avaliar o impacto da forma de instalação na seção final.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-slate-500 dark:text-slate-400">
              <th className="py-1 pr-3">Método</th>
              <th className="py-1 pr-3">Seção</th>
              <th className="py-1 pr-3">Iz corrigida</th>
              <th className="py-1 pr-3">ΔV%</th>
              <th className="py-1 pr-3">Critério</th>
              <th className="py-1 pr-3">Situação</th>
            </tr>
          </thead>
          <tbody>
            {comparativos.map(({ metodo, resultado }) => {
              const info = METODOS_INSTALACAO.find((m) => m.codigo === metodo)!
              const atual = metodo === entrada.metodoInstalacao
              return (
                <tr
                  key={metodo}
                  className={`border-t border-slate-100 dark:border-slate-800 ${atual ? 'bg-teal-50 dark:bg-teal-900/20' : ''}`}
                >
                  <td className="py-1.5 pr-3">
                    <span className="mr-1">{info.icone}</span>
                    {metodo} — {info.nome}
                  </td>
                  <td className="py-1.5 pr-3 font-semibold">{resultado.secaoEscolhida} mm²</td>
                  <td className="py-1.5 pr-3">{resultado.ampacidadeCorrigida.toFixed(1)} A</td>
                  <td className="py-1.5 pr-3">{resultado.quedaTensaoPercent.toFixed(2)}%</td>
                  <td className="py-1.5 pr-3 text-xs">{ROTULO_CRITERIO[resultado.criterioDeterminante]}</td>
                  <td className="py-1.5 pr-3">
                    <Selo tom={resultado.quedaTensaoOk ? 'verde' : 'amarelo'}>
                      {resultado.quedaTensaoOk ? 'OK' : 'Atenção'}
                    </Selo>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </Cartao>
  )
}
