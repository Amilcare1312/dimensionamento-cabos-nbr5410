import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supa } from './supabase'

interface AuthCtx {
  carregando: boolean
  session: Session | null
  user: User | null
  entrar: (email: string, senha: string) => Promise<{ erro?: string }>
  cadastrar: (email: string, senha: string) => Promise<{ erro?: string; confirmar?: boolean }>
  sair: () => Promise<void>
}

const Ctx = createContext<AuthCtx | null>(null)

export function ProvedorAuth({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    const cliente = supa()
    if (!cliente) {
      setCarregando(false)
      return
    }
    cliente.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setCarregando(false)
    })
    const { data: sub } = cliente.auth.onAuthStateChange((_evento, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  const valor: AuthCtx = {
    carregando,
    session,
    user: session?.user ?? null,
    async entrar(email, senha) {
      const cliente = supa()
      if (!cliente) return { erro: 'Nuvem não configurada.' }
      const { error } = await cliente.auth.signInWithPassword({ email, password: senha })
      return error ? { erro: traduzErro(error.message) } : {}
    },
    async cadastrar(email, senha) {
      const cliente = supa()
      if (!cliente) return { erro: 'Nuvem não configurada.' }
      const { data, error } = await cliente.auth.signUp({ email, password: senha })
      if (error) return { erro: traduzErro(error.message) }
      // Se o projeto exige confirmação de e-mail, não há sessão imediata.
      return { confirmar: !data.session }
    },
    async sair() {
      await supa()?.auth.signOut()
      setSession(null)
    },
  }

  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>
}

export function useAuth(): AuthCtx {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de ProvedorAuth')
  return ctx
}

function traduzErro(msg: string): string {
  const m = msg.toLowerCase()
  if (m.includes('invalid login')) return 'E-mail ou senha inválidos.'
  if (m.includes('already registered')) return 'Este e-mail já está cadastrado.'
  if (m.includes('password') && m.includes('6')) return 'A senha deve ter ao menos 6 caracteres.'
  if (m.includes('email')) return 'E-mail inválido.'
  return msg
}
