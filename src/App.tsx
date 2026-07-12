import { useMemo, useState } from 'react'
import { CircuitForm } from './components/CircuitForm'
import { ResultsPanel } from './components/ResultsPanel'
import { BibliotecaCircuitos } from './components/BibliotecaCircuitos'
import { ComparacaoMetodos } from './components/ComparacaoMetodos'
import { Disclaimer } from './components/Disclaimer'
import { BotaoSecundario } from './components/ui'
import { compararCobreAluminio, dimensionarCabo } from './lib/calculos'
import { novaEntradaPadrao } from './lib/defaults'
import { carregarCircuitos, gerarIdCircuito, salvarCircuitos, type CircuitoSalvo } from './lib/biblioteca'
import { useTema } from './hooks/useTema'

type Aba = 'dimensionar' | 'comparar' | 'biblioteca'

export default function App() {
  const { tema, alternarTema } = useTema()
  const [aba, setAba] = useState<Aba>('dimensionar')
  const [entrada, setEntrada] = useState(novaEntradaPadrao)
  const [circuitos, setCircuitos] = useState<CircuitoSalvo[]>(() => carregarCircuitos())

  const resultado = useMemo(() => dimensionarCabo(entrada), [entrada])
  const comparativo = useMemo(() => compararCobreAluminio(entrada), [entrada])

  function adicionarBiblioteca() {
    const novo: CircuitoSalvo = { id: gerarIdCircuito(), salvoEm: new Date().toISOString(), entrada }
    const atualizados = [...circuitos, novo]
    setCircuitos(atualizados)
    salvarCircuitos(atualizados)
  }

  function removerBiblioteca(id: string) {
    const atualizados = circuitos.filter((c) => c.id !== id)
    setCircuitos(atualizados)
    salvarCircuitos(atualizados)
  }

  function carregarDaBiblioteca(circuito: CircuitoSalvo) {
    setEntrada(circuito.entrada)
    setAba('dimensionar')
  }

  const abas: { id: Aba; rotulo: string }[] = [
    { id: 'dimensionar', rotulo: 'Dimensionar' },
    { id: 'comparar', rotulo: 'Comparar métodos' },
    { id: 'biblioteca', rotulo: `Biblioteca (${circuitos.length})` },
  ]

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <Disclaimer />
      <header className="border-b border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div>
            <h1 className="text-lg font-bold sm:text-xl">Dimensionamento de Cabos — NBR 5410</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Capacidade de condução de corrente e queda de tensão para instalações de baixa tensão
            </p>
          </div>
          <BotaoSecundario onClick={alternarTema} aria-label="Alternar tema claro/escuro">
            {tema === 'claro' ? '🌙 Escuro' : '☀️ Claro'}
          </BotaoSecundario>
        </div>
      </header>

      <nav className="mx-auto flex max-w-6xl gap-1 px-4 pt-4 no-print">
        {abas.map((a) => (
          <button
            key={a.id}
            onClick={() => setAba(a.id)}
            className={`rounded-t-lg px-4 py-2 text-sm font-medium transition ${
              aba === a.id
                ? 'border-b-2 border-teal-600 text-teal-700 dark:text-teal-400'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            {a.rotulo}
          </button>
        ))}
      </nav>

      <main className="mx-auto max-w-6xl px-4 pb-16 pt-4">
        {aba === 'dimensionar' && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <CircuitForm valor={entrada} onChange={setEntrada} />
            <ResultsPanel
              entrada={entrada}
              resultado={resultado}
              comparativo={comparativo}
              onAdicionarBiblioteca={adicionarBiblioteca}
            />
          </div>
        )}

        {aba === 'comparar' && (
          <div className="flex flex-col gap-4">
            <ComparacaoMetodos entrada={entrada} />
          </div>
        )}

        {aba === 'biblioteca' && (
          <BibliotecaCircuitos
            circuitos={circuitos}
            onRemover={removerBiblioteca}
            onCarregar={carregarDaBiblioteca}
          />
        )}
      </main>

      <footer className="border-t border-slate-200 px-4 py-6 text-center text-xs text-slate-400 dark:border-slate-800">
        <p>
          Ferramenta de apoio ao dimensionamento — ABNT NBR 5410:2004. Não substitui a responsabilidade
          técnica de um profissional habilitado.
        </p>
        <p className="mt-1">© 2026 Amilcare. Todos os direitos reservados.</p>
      </footer>
    </div>
  )
}
