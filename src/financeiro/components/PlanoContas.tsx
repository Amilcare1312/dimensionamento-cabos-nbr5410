import { PLANO_CONTAS } from '../planoContas'
import { Cartao, Selo } from '../../components/ui'

const TOM_TIPO = {
  Ativo: 'neutro',
  Passivo: 'amarelo',
  Receita: 'verde',
  Despesa: 'vermelho',
} as const

export function PlanoContas() {
  return (
    <Cartao>
      <h2 className="mb-1 text-sm font-semibold text-slate-800 dark:text-slate-100">Plano de Contas</h2>
      <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">
        Estrutura contábil de referência usada nos lançamentos do Diário.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500 dark:border-slate-700 dark:text-slate-400">
              <th className="py-2 pr-2">Código</th>
              <th className="py-2 pr-2">Conta</th>
              <th className="py-2 pr-2">Tipo</th>
              <th className="py-2 pr-2">Grupo</th>
              <th className="py-2">Natureza</th>
            </tr>
          </thead>
          <tbody>
            {PLANO_CONTAS.map((c) => {
              const sintetica = c.codigo.endsWith('.0')
              return (
                <tr key={c.codigo} className={`border-t border-slate-100 dark:border-slate-800 ${sintetica ? 'bg-slate-50 font-semibold dark:bg-slate-800/40' : ''}`}>
                  <td className="py-1.5 pr-2 font-mono text-xs text-slate-500 dark:text-slate-400">{c.codigo}</td>
                  <td className="py-1.5 pr-2 text-slate-800 dark:text-slate-100">{c.nome}</td>
                  <td className="py-1.5 pr-2"><Selo tom={TOM_TIPO[c.tipo]}>{c.tipo}</Selo></td>
                  <td className="py-1.5 pr-2 text-xs text-slate-500 dark:text-slate-400">{c.grupo}</td>
                  <td className="py-1.5 text-xs text-slate-500 dark:text-slate-400">{c.natureza}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </Cartao>
  )
}
