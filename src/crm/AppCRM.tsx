import { useEffect, useMemo, useRef, useState } from 'react'
import type { EstadoCRM, Etapa, Interacao, Lead, Template } from './tipos'
import {
  carregarEstado,
  exportarCSV,
  exportarJSON,
  gerarId,
  importarJSON,
  salvarEstado,
} from './armazenamento'
import { estadoInicial, estadoVazio } from './dadosIniciais'
import { calcularDashboard } from './calculos'
import { useTema } from '../hooks/useTema'
import { BotaoPrimario, BotaoSecundario } from '../components/ui'
import { Modal } from './components/ui'
import { Dashboard } from './components/Dashboard'
import { Pipeline } from './components/Pipeline'
import { ListaLeads } from './components/ListaLeads'
import { FormularioLead } from './components/FormularioLead'
import { DetalheLead } from './components/DetalheLead'
import { Templates } from './components/Templates'

type Aba = 'dashboard' | 'pipeline' | 'lista' | 'templates'

export default function AppCRM() {
  const { tema, alternarTema } = useTema()
  const [aba, setAba] = useState<Aba>('dashboard')
  const [estado, setEstado] = useState<EstadoCRM>(() => carregarEstado())
  const [formAberto, setFormAberto] = useState(false)
  const [editandoLead, setEditandoLead] = useState<Lead | null>(null)
  const [detalheId, setDetalheId] = useState<string | null>(null)
  const inputArquivo = useRef<HTMLInputElement>(null)

  useEffect(() => {
    salvarEstado(estado)
  }, [estado])

  const leadDetalhe = useMemo(
    () => estado.leads.find((l) => l.id === detalheId) ?? null,
    [estado.leads, detalheId],
  )

  const d = useMemo(() => calcularDashboard(estado), [estado])

  // --- Operações sobre leads ---------------------------------------------
  function salvarLead(dados: Omit<Lead, 'id' | 'interacoes' | 'criadoEm' | 'atualizadoEm'> & { id?: string }) {
    const agora = new Date().toISOString()
    setEstado((e) => {
      if (dados.id) {
        return {
          ...e,
          leads: e.leads.map((l) =>
            l.id === dados.id ? { ...l, ...dados, id: l.id, atualizadoEm: agora } : l,
          ),
        }
      }
      const novo: Lead = {
        ...dados,
        id: gerarId('lead'),
        interacoes: [],
        criadoEm: agora,
        atualizadoEm: agora,
      }
      return { ...e, leads: [novo, ...e.leads] }
    })
    setFormAberto(false)
    setEditandoLead(null)
  }

  function excluirLead(id: string) {
    if (!confirm('Excluir este lead e todo o histórico? Esta ação não pode ser desfeita.')) return
    setEstado((e) => ({ ...e, leads: e.leads.filter((l) => l.id !== id) }))
    setDetalheId(null)
  }

  function mudarEtapa(id: string, etapa: Etapa) {
    const agora = new Date().toISOString()
    setEstado((e) => ({
      ...e,
      leads: e.leads.map((l) => {
        if (l.id !== id || l.etapa === etapa) return l
        const registro: Interacao = {
          id: gerarId('int'),
          data: agora,
          tipo: etapa === 'ganho' ? 'nota' : etapa === 'perdido' ? 'nota' : 'followup',
          descricao: `Movido para "${rotuloEtapa(etapa)}".`,
        }
        return { ...l, etapa, atualizadoEm: agora, interacoes: [...l.interacoes, registro] }
      }),
    }))
  }

  function adicionarInteracao(id: string, i: Omit<Interacao, 'id'>) {
    setEstado((e) => ({
      ...e,
      leads: e.leads.map((l) =>
        l.id === id
          ? { ...l, atualizadoEm: new Date().toISOString(), interacoes: [...l.interacoes, { ...i, id: gerarId('int') }] }
          : l,
      ),
    }))
  }

  // --- Templates ----------------------------------------------------------
  function salvarTemplate(t: Template) {
    setEstado((e) => {
      if (t.id) return { ...e, templates: e.templates.map((x) => (x.id === t.id ? t : x)) }
      return { ...e, templates: [...e.templates, { ...t, id: gerarId('tpl') }] }
    })
  }

  function excluirTemplate(id: string) {
    setEstado((e) => ({ ...e, templates: e.templates.filter((t) => t.id !== id) }))
  }

  // --- Import/export ------------------------------------------------------
  function importarArquivo(arquivo: File) {
    const leitor = new FileReader()
    leitor.onload = () => {
      const novo = importarJSON(String(leitor.result))
      if (novo) setEstado(novo)
      else alert('Arquivo inválido. Selecione um JSON exportado por este CRM.')
    }
    leitor.readAsText(arquivo)
  }

  const abas: { id: Aba; rotulo: string }[] = [
    { id: 'dashboard', rotulo: 'Dashboard' },
    { id: 'pipeline', rotulo: 'Pipeline' },
    { id: 'lista', rotulo: `Leads (${estado.leads.length})` },
    { id: 'templates', rotulo: `Modelos (${estado.templates.length})` },
  ]

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="border-b border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">💬</span>
            <div>
              <h1 className="text-lg font-bold sm:text-xl">CRM de Leads · WhatsApp</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Funil, follow-ups e histórico dos leads qualificados — dados salvos neste navegador
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <BotaoPrimario
              onClick={() => {
                setEditandoLead(null)
                setFormAberto(true)
              }}
            >
              + Novo lead
            </BotaoPrimario>
            <BotaoSecundario onClick={() => exportarCSV(estado.leads)} title="Exportar leads em CSV (Excel)">
              CSV
            </BotaoSecundario>
            <BotaoSecundario onClick={() => exportarJSON(estado)}>⬇ Backup</BotaoSecundario>
            <BotaoSecundario onClick={() => inputArquivo.current?.click()}>⬆ Restaurar</BotaoSecundario>
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
                if (confirm('Carregar dados de exemplo? Isso substitui os leads atuais.')) setEstado(estadoInicial())
              }}
            >
              Exemplo
            </BotaoSecundario>
            <BotaoSecundario
              onClick={() => {
                if (confirm('Limpar todos os leads? Esta ação não pode ser desfeita.')) setEstado(estadoVazio())
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
            className={`relative whitespace-nowrap rounded-t-lg px-4 py-2 text-sm font-medium transition ${
              aba === a.id
                ? 'border-b-2 border-teal-600 text-teal-700 dark:text-teal-400'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            {a.rotulo}
            {a.id === 'pipeline' && d.followupsAtrasados > 0 && (
              <span className="ml-1 rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white">
                {d.followupsAtrasados}
              </span>
            )}
          </button>
        ))}
      </nav>

      <main className="mx-auto max-w-7xl px-4 pb-16 pt-4">
        {estado.leads.length === 0 && aba !== 'templates' ? (
          <EstadoInicialVazio onNovo={() => setFormAberto(true)} onExemplo={() => setEstado(estadoInicial())} />
        ) : (
          <>
            {aba === 'dashboard' && <Dashboard estado={estado} onAbrir={setDetalheId} />}
            {aba === 'pipeline' && <Pipeline leads={estado.leads} onAbrir={setDetalheId} onMudarEtapa={mudarEtapa} />}
            {aba === 'lista' && <ListaLeads leads={estado.leads} onAbrir={setDetalheId} />}
          </>
        )}
        {aba === 'templates' && (
          <Templates templates={estado.templates} onSalvar={salvarTemplate} onExcluir={excluirTemplate} />
        )}
      </main>

      <footer className="border-t border-slate-200 px-4 py-6 text-center text-xs text-slate-400 dark:border-slate-800">
        <p>CRM de leads de WhatsApp — 100% no navegador, sem servidor. Faça backup pelo botão ⬇ regularmente.</p>
        <p className="mt-1">© 2026 Amilcare. Todos os direitos reservados.</p>
      </footer>

      {/* Modal de formulário (novo/editar) */}
      <Modal
        aberto={formAberto}
        titulo={editandoLead ? 'Editar lead' : 'Novo lead'}
        onFechar={() => {
          setFormAberto(false)
          setEditandoLead(null)
        }}
      >
        <FormularioLead
          leadInicial={editandoLead ?? undefined}
          onSalvar={salvarLead}
          onCancelar={() => {
            setFormAberto(false)
            setEditandoLead(null)
          }}
        />
      </Modal>

      {/* Modal de detalhe do lead */}
      <Modal
        aberto={!!leadDetalhe}
        titulo="Detalhes do lead"
        onFechar={() => setDetalheId(null)}
        larguraMax="max-w-3xl"
      >
        {leadDetalhe && (
          <DetalheLead
            lead={leadDetalhe}
            templates={estado.templates}
            onEditar={() => {
              setEditandoLead(leadDetalhe)
              setDetalheId(null)
              setFormAberto(true)
            }}
            onExcluir={() => excluirLead(leadDetalhe.id)}
            onMudarEtapa={(etapa) => mudarEtapa(leadDetalhe.id, etapa)}
            onAdicionarInteracao={(i) => adicionarInteracao(leadDetalhe.id, i)}
          />
        )}
      </Modal>
    </div>
  )
}

function EstadoInicialVazio({ onNovo, onExemplo }: { onNovo: () => void; onExemplo: () => void }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white/50 py-16 text-center dark:border-slate-700 dark:bg-slate-900/40">
      <p className="text-4xl">💬</p>
      <h2 className="mt-3 text-lg font-semibold text-slate-800 dark:text-slate-100">Nenhum lead ainda</h2>
      <p className="mx-auto mt-1 max-w-md text-sm text-slate-500 dark:text-slate-400">
        Cadastre o primeiro lead que chegou pelo WhatsApp ou carregue dados de exemplo para explorar o CRM.
      </p>
      <div className="mt-5 flex justify-center gap-2">
        <BotaoPrimario onClick={onNovo}>+ Cadastrar lead</BotaoPrimario>
        <BotaoSecundario onClick={onExemplo}>Ver com dados de exemplo</BotaoSecundario>
      </div>
    </div>
  )
}

function rotuloEtapa(etapa: Etapa): string {
  const mapa: Record<Etapa, string> = {
    novo: 'Novo',
    qualificado: 'Qualificado',
    proposta: 'Proposta enviada',
    negociacao: 'Negociação',
    ganho: 'Ganho',
    perdido: 'Perdido',
  }
  return mapa[etapa]
}
