import { useState } from 'react'
import { useAuth } from './auth'
import { iniciarCheckout } from './assinatura'
import { BotaoPrimario, BotaoSecundario } from '../components/ui'

const RECURSOS = [
  'Diário de lançamentos ilimitado',
  'Contas a pagar e a receber automáticas',
  'Fluxo de caixa mensal e dashboard',
  'Dados salvos na nuvem, acesso de qualquer lugar',
  'Exportação de dados em JSON',
]

export function Paywall() {
  const { user, sair } = useAuth()
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')

  async function assinar() {
    setErro('')
    setCarregando(true)
    const r = await iniciarCheckout()
    setCarregando(false)
    if (r.erro) setErro(r.erro)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="text-center">
          <span className="inline-flex rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-teal-700 dark:bg-teal-900/30 dark:text-teal-300">
            Plano Pro
          </span>
          <h1 className="mt-3 text-2xl font-bold text-slate-900 dark:text-slate-50">Ative sua assinatura</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Para usar o Controle Financeiro é necessária uma assinatura ativa.
          </p>
        </div>

        <ul className="mt-6 space-y-2">
          {RECURSOS.map((r) => (
            <li key={r} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-200">
              <span className="mt-0.5 text-emerald-500">✓</span>
              {r}
            </li>
          ))}
        </ul>

        {erro && <p className="mt-4 rounded-md bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:bg-rose-900/30 dark:text-rose-300">{erro}</p>}

        <BotaoPrimario onClick={assinar} disabled={carregando} className="mt-6 w-full">
          {carregando ? 'Redirecionando…' : 'Assinar agora'}
        </BotaoPrimario>

        <div className="mt-4 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span className="truncate">{user?.email}</span>
          <BotaoSecundario onClick={sair} className="px-3 py-1 text-xs">Sair</BotaoSecundario>
        </div>
      </div>
    </div>
  )
}
