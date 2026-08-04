import { useState } from 'react'
import type { Etapa, Lead } from '../tipos'
import { ETAPAS, TEMPERATURAS } from '../tipos'
import { diasAte, iniciais, moedaCompacta, relativoDias, telefoneBR } from '../formatar'
import { abrirWhatsApp, telefoneValido } from '../whatsapp'
import { Avatar } from './ui'

export function Pipeline({
  leads,
  onAbrir,
  onMudarEtapa,
}: {
  leads: Lead[]
  onAbrir: (id: string) => void
  onMudarEtapa: (id: string, etapa: Etapa) => void
}) {
  const [arrastando, setArrastando] = useState<string | null>(null)
  const [alvo, setAlvo] = useState<Etapa | null>(null)

  return (
    <div className="flex gap-3 overflow-x-auto pb-4">
      {ETAPAS.map((meta) => {
        const doGrupo = leads.filter((l) => l.etapa === meta.id)
        const total = doGrupo.reduce((a, l) => a + (l.valorEstimado || 0), 0)
        return (
          <div
            key={meta.id}
            onDragOver={(e) => {
              e.preventDefault()
              setAlvo(meta.id)
            }}
            onDragLeave={() => setAlvo((a) => (a === meta.id ? null : a))}
            onDrop={() => {
              if (arrastando) onMudarEtapa(arrastando, meta.id)
              setArrastando(null)
              setAlvo(null)
            }}
            className={`flex w-72 shrink-0 flex-col rounded-xl border bg-slate-50/60 dark:bg-slate-900/40 ${
              alvo === meta.id
                ? 'border-teal-400 ring-2 ring-teal-300 dark:border-teal-500'
                : 'border-slate-200 dark:border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between gap-2 border-b border-slate-200 px-3 py-2 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${meta.cor}`} />
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{meta.rotulo}</span>
                <span className="rounded-full bg-slate-200 px-1.5 text-xs text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                  {doGrupo.length}
                </span>
              </div>
              <span className="text-xs tabular-nums text-slate-400">{moedaCompacta(total)}</span>
            </div>

            <div className="flex flex-1 flex-col gap-2 p-2">
              {doGrupo.length === 0 && (
                <p className="py-6 text-center text-xs text-slate-400">Arraste um lead para cá</p>
              )}
              {doGrupo.map((l) => (
                <CartaoLead
                  key={l.id}
                  lead={l}
                  onAbrir={() => onAbrir(l.id)}
                  onDragStart={() => setArrastando(l.id)}
                  onDragEnd={() => {
                    setArrastando(null)
                    setAlvo(null)
                  }}
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function CartaoLead({
  lead,
  onAbrir,
  onDragStart,
  onDragEnd,
}: {
  lead: Lead
  onAbrir: () => void
  onDragStart: () => void
  onDragEnd: () => void
}) {
  const temp = TEMPERATURAS.find((t) => t.id === lead.temperatura)
  const dias = diasAte(lead.proximoContato)
  const atrasado = dias !== null && dias < 0
  const hoje = dias === 0

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onAbrir}
      className="group cursor-pointer rounded-lg border border-slate-200 bg-white p-2.5 shadow-sm transition hover:border-teal-300 hover:shadow dark:border-slate-700 dark:bg-slate-800 dark:hover:border-teal-600"
    >
      <div className="flex items-start gap-2">
        <Avatar nome={lead.nome} texto={iniciais(lead.nome)} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">{lead.nome}</p>
          <p className="truncate text-xs text-slate-500 dark:text-slate-400">
            {lead.empresa || telefoneBR(lead.telefone)}
          </p>
        </div>
        {temp && <span title={temp.rotulo}>{temp.emoji}</span>}
      </div>

      <div className="mt-2 flex items-center justify-between">
        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-300">
          {lead.produto}
        </span>
        <span className="text-xs font-semibold tabular-nums text-slate-700 dark:text-slate-200">
          {moedaCompacta(lead.valorEstimado)}
        </span>
      </div>

      <div className="mt-2 flex items-center justify-between">
        {lead.proximoContato ? (
          <span
            className={`text-[11px] ${
              atrasado
                ? 'font-semibold text-rose-600 dark:text-rose-400'
                : hoje
                  ? 'font-semibold text-amber-600 dark:text-amber-400'
                  : 'text-slate-400'
            }`}
          >
            {atrasado ? '⚠ ' : hoje ? '⏰ ' : '📅 '}
            {relativoDias(lead.proximoContato)}
          </span>
        ) : (
          <span className="text-[11px] text-slate-300 dark:text-slate-600">sem follow-up</span>
        )}
        {telefoneValido(lead.telefone) && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              abrirWhatsApp(lead.telefone)
            }}
            title="Abrir WhatsApp"
            className="rounded p-1 text-emerald-600 opacity-0 transition hover:bg-emerald-50 group-hover:opacity-100 dark:text-emerald-400 dark:hover:bg-emerald-900/30"
          >
            💬
          </button>
        )}
      </div>
    </div>
  )
}
