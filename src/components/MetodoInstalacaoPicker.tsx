import { METODOS_INSTALACAO, type MetodoInstalacao } from '../lib/tabelas'

export function MetodoInstalacaoPicker({
  valor,
  onChange,
}: {
  valor: MetodoInstalacao
  onChange: (metodo: MetodoInstalacao) => void
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {METODOS_INSTALACAO.map((metodo) => {
        const selecionado = metodo.codigo === valor
        return (
          <button
            key={metodo.codigo}
            type="button"
            onClick={() => onChange(metodo.codigo)}
            title={metodo.descricao}
            className={`flex flex-col items-center gap-1 rounded-lg border p-3 text-center transition ${
              selecionado
                ? 'border-teal-500 bg-teal-50 ring-1 ring-teal-500 dark:bg-teal-900/30'
                : 'border-slate-200 bg-white hover:border-teal-300 dark:border-slate-700 dark:bg-slate-800'
            }`}
          >
            <span className="text-2xl" aria-hidden>
              {metodo.icone}
            </span>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              Método {metodo.codigo}
            </span>
            <span className="text-xs leading-tight text-slate-700 dark:text-slate-300">
              {metodo.nome}
            </span>
          </button>
        )
      })}
    </div>
  )
}
