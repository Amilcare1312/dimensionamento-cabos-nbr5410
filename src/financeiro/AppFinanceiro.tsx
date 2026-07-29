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

export default function AppFinanceiro() {
  const { tema, alternarTema } = useTema()
  const [aba, setAba] = useState<Aba>('dashboard')
  const [estado, setEstado] = useState<EstadoFinanceiro>(() => carregarEstado())
  const inputArquivo = useRef<HTMLInputElement>(null)

  useEffect(() => {
    salvarEstado(estado)
  }, [estado])

  function adicionarLancamento(l: Lancamento) {
    setEstado((e) => ({ ...e, lancamentos: [...e.lancamentos, l] }))
  }

  function removerLancamento(id: string) {
    setEstado((e) => ({ ...e, lancamentos: e.lancamentos.filter((l) => l.id !== id) }))
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
                if (confirm('Carregar dados de exemplo? Isso substitui os lançamentos atuais.')) setEstado(estadoInicial())
              }}
            >
              Exemplo
            </BotaoSecundario>
            <BotaoSecundario
              onClick={() => {
                if (confirm('Limpar todos os lançamentos? Esta ação não pode ser desfeita.')) setEstado(estadoVazio(estado.ano))
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
        {aba === 'dashboard' && <Dashboard estado={estado} />}
        {aba === 'diario' && (
          <Diario lancamentos={estado.lancamentos} onAdicionar={adicionarLancamento} onRemover={removerLancamento} />
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
    </div>
  )
}
