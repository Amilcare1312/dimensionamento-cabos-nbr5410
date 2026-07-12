import { useState } from 'react'
import type { PassoMemorial } from '../lib/calculos'

export function MemorialCalculo({ passos }: { passos: PassoMemorial[] }) {
  const [aberto, setAberto] = useState(false)

  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-700">
      <button
        type="button"
        onClick={() => setAberto((a) => !a)}
        className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold text-slate-800 dark:text-slate-100"
      >
        Memorial de cálculo passo a passo
        <span className="text-slate-400">{aberto ? '−' : '+'}</span>
      </button>
      {aberto && (
        <ol className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 dark:border-slate-700">
          {passos.map((passo, i) => (
            <li key={i} className="text-sm">
              <p className="font-medium text-slate-800 dark:text-slate-100">{passo.titulo}</p>
              <p className="mt-0.5 text-slate-600 dark:text-slate-300">{passo.descricao}</p>
              {passo.referenciaNormativa && (
                <p className="mt-0.5 text-xs italic text-slate-400 dark:text-slate-500">
                  Referência: {passo.referenciaNormativa}
                </p>
              )}
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
