import { useEffect, useRef, useState } from 'react'
import type { EstadoFinanceiro, Lancamento } from './tipos'
import { carregarEstado, exportarJSON, importarJSON, salvarEstado } from './armazenamento'
import { estadoInicial, estadoVazio } from './dadosIniciais'
import { useTema } from '../hooks/useTema'
import { BotaoSecundario } from '../components/ui'
import { Dashboard } from './components/Dashboard'
import { Diario } from './components/Diario'
import { ContasPagar } from './components/ContasPagar'
import { ContasReceber } from './components/ContasReceber'
import { FluxoCaixa } from './components/FluxoCaixa'
import { PlanoContas } from './components/PlanoContas'

type Aba = 'dashboard' | 'diario' | 'pagar' | 'receber' | 'fluxo' | 'plano'

interface Desfazer {
  anterior: EstadoFinanceiro
  msg: string
}

export default function AppFinanceiro() {
  const { tema, alternarTema } = useTema()
  const [aba, setAba] = useState<Aba>('dashboard')
  const [estado, setEstado] = useState<EstadoFinanceiro>(() => carregarEstado())
  const [desfazer, setDesfazer] = useState<Desfazer | null>(null)
  const inputArquivo = useRef<HTMLInputElement>(null)

  useEffect(() => {
    salvarEstado(estado)
  }, [estado])

  // Some com o aviso de "desfazer" automaticamente após alguns segundos.
  useEffect(() => {
    if (!desfazer) return
    const t = setTimeout(() => setDesfazer(null), 8000)
    return () => clearTimeout(t)
  }, [desfazer])

  function adicionarLancamento(l: Lancamento) {
    setEstado((e) => ({ ...e, lancamentos: [...e.lancamentos, l] }))
  }

  // Aplica uma alteração destrutiva guardando o estado anterior para desfazer.
  function comUndo(proximo: EstadoFinanceiro, msg: string) {
    setDesfazer({ anterior: estado, msg })
    setEstado(proximo)
  }

  function removerLancamento(id: string) {
    comUndo({ ...estado, lancamentos: estado.lancamentos.filter((l) => l.id !== id) }, '1 lançamento removido.')
  }

  function removerVarios(ids: string[]) {
    const set = new Set(ids)
    comUndo(
      { ...estado, lancamentos: estado.lancamentos.filter((l) => !set.has(l.id)) },
      `${ids.length} lançamento(s) removido(s).`,
    )
  }

  function executarDesfazer() {
    if (!desfazer) return
    setEstado(desfazer.anterior)
    setDesfazer(null)
  }

  function definirSaldoInicial(v: number) {
    setEstado((e) => ({ ...e, saldoInicial: v }))
  }

  function importarArquivo(arquivo: File) {
    const leitor = new FileReader()
    leitor.onload = () => {
      const novo = importarJSON(String(leitor.result))
      if (novo) setEstado(novo)
      else alert('Arquivo inválido. Selecione um JSON exportado por este aplicativo.')
    }
    leitor.readAsText(arquivo)
  }

  const abas: { id: Aba; rotulo: string }[] = [
    { id: 'dashboard', rotulo: 'Dashboard' },
    { id: 'diario', rotulo: `Diário (${estado.lancamentos.length})` },
    { id: 'pagar', rotulo: 'Contas a Pagar' },
    { id: 'receber', rotulo: 'Contas a Receber' },
    { id: 'fluxo', rotulo: 'Fluxo de Caixa' },
    { id: 'plano', rotulo: 'Plano de Contas' },
  ]

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="border-b border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold sm:text-xl">Controle Financeiro</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Diário de lançamentos, contas a pagar/receber, fluxo de caixa e dashboard
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <BotaoSecundario onClick={() => exportarJSON(estado)}>⬇ Exportar</BotaoSecundario>
            <BotaoSecundario onClick={() => inputArquivo.current?.click()}>⬆ Importar</BotaoSecundario>
            <input
              ref={inputArquivo}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) importarArquivo(f)
                e.target.value = ''
              }}
            />
            <BotaoSecundario
              onClick={() => {
                if (confirm('Carregar dados de exemplo? Isso substitui os lançamentos atuais.'))
                  comUndo(estadoInicial(), 'Dados de exemplo carregados.')
              }}
            >
              Exemplo
            </BotaoSecundario>
            <BotaoSecundario
              onClick={() => {
                if (estado.lancamentos.length === 0) return
                if (confirm('Limpar todos os lançamentos?'))
                  comUndo(estadoVazio(estado.ano), 'Todos os lançamentos foram removidos.')
              }}
            >
              Limpar
            </BotaoSecundario>
            <BotaoSecundario onClick={alternarTema} aria-label="Alternar tema claro/escuro">
              {tema === 'claro' ? '🌙' : '☀️'}
            </BotaoSecundario>
          </div>
        </div>
      </header>

      <nav className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 pt-4">
        {abas.map((a) => (
          <button
            key={a.id}
            onClick={() => setAba(a.id)}
            className={`whitespace-nowrap rounded-t-lg px-4 py-2 text-sm font-medium transition ${
              aba === a.id
                ? 'border-b-2 border-teal-600 text-teal-700 dark:text-teal-400'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            {a.rotulo}
          </button>
        ))}
      </nav>

      <main className="mx-auto max-w-7xl px-4 pb-16 pt-4">
        {aba === 'dashboard' && <Dashboard estado={estado} onSaldoInicial={definirSaldoInicial} />}
        {aba === 'diario' && (
          <Diario
            lancamentos={estado.lancamentos}
            onAdicionar={adicionarLancamento}
            onRemover={removerLancamento}
            onRemoverVarios={removerVarios}
          />
        )}
        {aba === 'pagar' && <ContasPagar lancamentos={estado.lancamentos} />}
        {aba === 'receber' && <ContasReceber lancamentos={estado.lancamentos} />}
        {aba === 'fluxo' && <FluxoCaixa estado={estado} onSaldoInicial={definirSaldoInicial} />}
        {aba === 'plano' && <PlanoContas />}
      </main>

      <footer className="border-t border-slate-200 px-4 py-6 text-center text-xs text-slate-400 dark:border-slate-800">
        <p>Aplicativo financeiro com partidas dobradas — os dados ficam salvos apenas neste navegador.</p>
        <p className="mt-1">© 2026 Amilcare. Todos os direitos reservados.</p>
      </footer>

      {desfazer && (
        <div className="fixed inset-x-0 bottom-4 z-50 flex justify-center px-4">
          <div className="flex items-center gap-4 rounded-lg bg-slate-900 px-4 py-2.5 text-sm text-white shadow-lg dark:bg-slate-700">
            <span>{desfazer.msg}</span>
            <button
              onClick={executarDesfazer}
              className="rounded-md px-2 py-1 text-sm font-semibold text-teal-300 transition hover:bg-white/10 hover:text-teal-200"
            >
              Desfazer
            </button>
            <button
              onClick={() => setDesfazer(null)}
              className="text-slate-400 transition hover:text-white"
              aria-label="Fechar aviso"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
