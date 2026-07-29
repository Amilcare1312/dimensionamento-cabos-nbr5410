import { useCallback, useEffect, useRef, useState } from 'react'
import AppFinanceiro from '../financeiro/AppFinanceiro'
import type { EstadoFinanceiro } from '../financeiro/tipos'
import { carregarEstado, salvarEstado } from '../financeiro/armazenamento'
import { NUVEM_CONFIGURADA } from './supabase'
import { ProvedorAuth, useAuth } from './auth'
import { TelaLogin } from './TelaLogin'
import { Paywall } from './Paywall'
import { buscarStatusAssinatura, type StatusAssinatura } from './assinatura'
import { carregarEstadoNuvem, salvarEstadoNuvem } from './nuvem'
import { BotaoSecundario } from '../components/ui'

// Ponto de entrada: escolhe entre modo local (sem nuvem) e modo SaaS.
export default function RaizApp() {
  if (!NUVEM_CONFIGURADA) return <AppLocal />
  return (
    <ProvedorAuth>
      <PortaEntrada />
    </ProvedorAuth>
  )
}

function Carregando({ texto }: { texto: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-slate-500 dark:bg-slate-950 dark:text-slate-400">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-teal-600" />
        {texto}
      </div>
    </div>
  )
}

// ─────────────── Modo local (dados só no navegador) ───────────────
function AppLocal() {
  const [inicial] = useState<EstadoFinanceiro>(() => carregarEstado())
  const persistir = useCallback((e: EstadoFinanceiro) => salvarEstado(e), [])
  return <AppFinanceiro estadoCarregado={inicial} onPersistir={persistir} />
}

// ─────────────── Modo SaaS: autenticação → assinatura → app ───────────────
function PortaEntrada() {
  const { carregando, session } = useAuth()
  if (carregando) return <Carregando texto="Carregando…" />
  if (!session) return <TelaLogin />
  return <PortaAssinatura />
}

function PortaAssinatura() {
  const { user } = useAuth()
  const [status, setStatus] = useState<StatusAssinatura | 'carregando'>('carregando')

  const voltouDoCheckout = new URLSearchParams(window.location.search).get('assinatura') === 'sucesso'

  useEffect(() => {
    if (!user) return
    let ativo = true
    let tentativas = 0

    async function verificar() {
      const s = await buscarStatusAssinatura(user!.id)
      if (!ativo) return
      // Após o checkout, o webhook pode demorar alguns segundos: tenta de novo.
      if (voltouDoCheckout && s !== 'ativa' && s !== 'periodo_teste' && tentativas < 5) {
        tentativas += 1
        setTimeout(verificar, 2000)
        return
      }
      setStatus(s)
    }
    verificar()
    return () => {
      ativo = false
    }
  }, [user, voltouDoCheckout])

  if (status === 'carregando') return <Carregando texto={voltouDoCheckout ? 'Confirmando assinatura…' : 'Verificando assinatura…'} />
  if (status !== 'ativa' && status !== 'periodo_teste') return <Paywall />
  return <AppNuvem />
}

function AppNuvem() {
  const { user, sair } = useAuth()
  const [inicial, setInicial] = useState<EstadoFinanceiro | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!user) return
    let ativo = true
    carregarEstadoNuvem(user.id).then((e) => {
      if (ativo) setInicial(e)
    })
    return () => {
      ativo = false
    }
  }, [user])

  // Salva na nuvem com debounce, para não gravar a cada tecla.
  const persistir = useCallback(
    (e: EstadoFinanceiro) => {
      if (!user) return
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(() => {
        void salvarEstadoNuvem(user.id, e)
      }, 800)
    },
    [user],
  )

  if (!inicial) return <Carregando texto="Carregando seus dados…" />

  return (
    <AppFinanceiro
      estadoCarregado={inicial}
      onPersistir={persistir}
      rodape="Aplicativo financeiro com partidas dobradas — seus dados ficam salvos com segurança na nuvem."
      acoesUsuario={
        <div className="flex items-center gap-2">
          <span className="hidden max-w-[160px] truncate text-xs text-slate-500 sm:inline dark:text-slate-400">{user?.email}</span>
          <BotaoSecundario onClick={sair}>Sair</BotaoSecundario>
        </div>
      }
    />
  )
}
