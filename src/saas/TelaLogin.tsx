import { useState } from 'react'
import { useAuth } from './auth'
import { BotaoPrimario, Campo } from '../components/ui'

const inputBase =
  'rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100'

export function TelaLogin() {
  const { entrar, cadastrar } = useAuth()
  const [modo, setModo] = useState<'entrar' | 'cadastrar'>('entrar')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [msg, setMsg] = useState('')
  const [carregando, setCarregando] = useState(false)

  async function enviar(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    setMsg('')
    setCarregando(true)
    const r = modo === 'entrar' ? await entrar(email, senha) : await cadastrar(email, senha)
    setCarregando(false)
    if (r.erro) {
      setErro(r.erro)
      return
    }
    if (modo === 'cadastrar' && 'confirmar' in r && r.confirmar) {
      setMsg('Cadastro criado! Verifique seu e-mail para confirmar a conta e depois entre.')
      setModo('entrar')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Controle Financeiro</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {modo === 'entrar' ? 'Entre na sua conta' : 'Crie sua conta gratuitamente'}
          </p>
        </div>

        <form onSubmit={enviar} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <Campo label="E-mail">
            <input type="email" autoComplete="email" required className={inputBase} value={email} onChange={(e) => setEmail(e.target.value)} />
          </Campo>
          <Campo label="Senha" ajuda={modo === 'cadastrar' ? 'Mínimo de 6 caracteres.' : undefined}>
            <input type="password" autoComplete={modo === 'entrar' ? 'current-password' : 'new-password'} required minLength={6} className={inputBase} value={senha} onChange={(e) => setSenha(e.target.value)} />
          </Campo>

          {erro && <p className="rounded-md bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:bg-rose-900/30 dark:text-rose-300">{erro}</p>}
          {msg && <p className="rounded-md bg-emerald-50 px-3 py-2 text-xs text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">{msg}</p>}

          <BotaoPrimario type="submit" disabled={carregando} className="w-full">
            {carregando ? 'Aguarde…' : modo === 'entrar' ? 'Entrar' : 'Criar conta'}
          </BotaoPrimario>

          <p className="text-center text-xs text-slate-500 dark:text-slate-400">
            {modo === 'entrar' ? 'Ainda não tem conta?' : 'Já tem conta?'}{' '}
            <button
              type="button"
              onClick={() => {
                setModo(modo === 'entrar' ? 'cadastrar' : 'entrar')
                setErro('')
                setMsg('')
              }}
              className="font-semibold text-teal-600 hover:underline dark:text-teal-400"
            >
              {modo === 'entrar' ? 'Cadastre-se' : 'Entrar'}
            </button>
          </p>
        </form>
      </div>
    </div>
  )
}
