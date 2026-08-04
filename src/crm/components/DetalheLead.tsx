import { useMemo, useState } from 'react'
import type { Interacao, Lead, Template, TipoInteracao } from '../tipos'
import { ETAPAS, TEMPERATURAS, TIPOS_INTERACAO, metaEtapa } from '../tipos'
import { abrirWhatsApp, preencherTemplate, telefoneValido } from '../whatsapp'
import { dataHoraBR, iniciais, moeda, relativoDias, telefoneBR } from '../formatar'
import { BotaoPrimario, BotaoSecundario, Selo } from '../../components/ui'
import { Avatar, CampoForm, SelectCrm, TextArea } from './ui'

const EMOJI_INTER: Record<TipoInteracao, string> = Object.fromEntries(
  TIPOS_INTERACAO.map((t) => [t.id, t.emoji]),
) as Record<TipoInteracao, string>

export function DetalheLead({
  lead,
  templates,
  onEditar,
  onExcluir,
  onMudarEtapa,
  onAdicionarInteracao,
}: {
  lead: Lead
  templates: Template[]
  onEditar: () => void
  onExcluir: () => void
  onMudarEtapa: (etapa: Lead['etapa']) => void
  onAdicionarInteracao: (i: Omit<Interacao, 'id'>) => void
}) {
  const meta = metaEtapa(lead.etapa)
  const temp = TEMPERATURAS.find((t) => t.id === lead.temperatura)
  const podeWhats = telefoneValido(lead.telefone)

  const [tplId, setTplId] = useState('')
  const [mensagem, setMensagem] = useState('')

  const templateSelecionado = templates.find((t) => t.id === tplId)
  const mensagemPreenchida = useMemo(() => {
    const base = mensagem || (templateSelecionado ? templateSelecionado.texto : '')
    return preencherTemplate(base, lead)
  }, [mensagem, templateSelecionado, lead])

  function aplicarTemplate(id: string) {
    setTplId(id)
    const t = templates.find((x) => x.id === id)
    if (t) setMensagem(preencherTemplate(t.texto, lead))
  }

  function enviarWhats() {
    abrirWhatsApp(lead.telefone, mensagemPreenchida)
    onAdicionarInteracao({
      data: new Date().toISOString(),
      tipo: 'mensagem',
      descricao: mensagemPreenchida
        ? `Mensagem enviada: "${resumir(mensagemPreenchida)}"`
        : 'Conversa aberta no WhatsApp.',
    })
  }

  return (
    <div className="space-y-5">
      {/* Cabeçalho */}
      <div className="flex items-start gap-3">
        <Avatar nome={lead.nome} texto={iniciais(lead.nome)} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-lg font-semibold text-slate-900 dark:text-slate-100">{lead.nome}</h3>
            <Selo tom={meta.tom}>{meta.rotulo}</Selo>
            {temp && <Selo tom={temp.tom}>{temp.emoji} {temp.rotulo}</Selo>}
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {[lead.empresa, lead.cidade].filter(Boolean).join(' · ') || 'Sem empresa/cidade'}
          </p>
        </div>
      </div>

      {/* Dados rápidos */}
      <div className="grid grid-cols-2 gap-3 rounded-lg bg-slate-50 p-3 text-sm dark:bg-slate-800/50 sm:grid-cols-4">
        <Dado rotulo="Telefone" valor={telefoneBR(lead.telefone)} />
        <Dado rotulo="Produto" valor={lead.produto} />
        <Dado rotulo="Origem" valor={lead.origem} />
        <Dado rotulo="Valor estimado" valor={moeda(lead.valorEstimado)} />
        <Dado rotulo="Próximo contato" valor={lead.proximoContato ? relativoDias(lead.proximoContato) : '—'} />
        <Dado rotulo="Responsável" valor={lead.responsavel || '—'} />
        <Dado rotulo="Criado" valor={relativoDias(lead.criadoEm.slice(0, 10))} />
        <Dado rotulo="Interações" valor={String(lead.interacoes.length)} />
      </div>

      {lead.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {lead.tags.map((t) => (
            <span key={t} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              #{t}
            </span>
          ))}
        </div>
      )}

      {lead.observacoes && (
        <p className="whitespace-pre-wrap rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
          {lead.observacoes}
        </p>
      )}

      {lead.etapa === 'perdido' && lead.motivoPerda && (
        <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-900/30 dark:text-rose-300">
          <strong>Motivo da perda:</strong> {lead.motivoPerda}
        </p>
      )}

      {/* WhatsApp */}
      <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 dark:border-emerald-900 dark:bg-emerald-900/20">
        <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-emerald-800 dark:text-emerald-300">
          <span>💬 Enviar WhatsApp</span>
        </div>
        {!podeWhats && (
          <p className="mb-2 text-xs text-amber-700 dark:text-amber-400">
            Telefone ausente ou inválido — edite o lead para habilitar o envio.
          </p>
        )}
        <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
          <SelectCrm value={tplId} onChange={(e) => aplicarTemplate(e.target.value)}>
            <option value="">Escolher modelo de mensagem…</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.titulo}
              </option>
            ))}
          </SelectCrm>
        </div>
        <TextArea
          className="mt-2"
          value={mensagemPreenchida}
          onChange={(e) => {
            setMensagem(e.target.value)
            setTplId('')
          }}
          placeholder="Escreva a mensagem ou selecione um modelo acima…"
        />
        <div className="mt-2 flex justify-end">
          <BotaoPrimario onClick={enviarWhats} disabled={!podeWhats} className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400">
            Abrir no WhatsApp ↗
          </BotaoPrimario>
        </div>
      </div>

      {/* Mudança de etapa */}
      <div>
        <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Mover no funil</p>
        <div className="flex flex-wrap gap-1.5">
          {ETAPAS.map((et) => (
            <button
              key={et.id}
              onClick={() => onMudarEtapa(et.id)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                et.id === lead.etapa
                  ? `${et.cor} text-white`
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
              }`}
            >
              {et.rotulo}
            </button>
          ))}
        </div>
      </div>

      {/* Registrar interação */}
      <RegistrarInteracao onAdicionar={onAdicionarInteracao} />

      {/* Timeline */}
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Histórico ({lead.interacoes.length})
        </p>
        {lead.interacoes.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">Nenhuma interação registrada ainda.</p>
        ) : (
          <ol className="space-y-3 border-l-2 border-slate-200 pl-4 dark:border-slate-700">
            {[...lead.interacoes]
              .sort((a, b) => b.data.localeCompare(a.data))
              .map((i) => (
                <li key={i.id} className="relative">
                  <span className="absolute -left-[1.4rem] top-0.5 text-sm">{EMOJI_INTER[i.tipo] ?? '•'}</span>
                  <p className="text-sm text-slate-700 dark:text-slate-200">{i.descricao}</p>
                  <p className="text-xs text-slate-400">{dataHoraBR(i.data)}</p>
                </li>
              ))}
          </ol>
        )}
      </div>

      <div className="flex justify-between gap-2 border-t border-slate-200 pt-3 dark:border-slate-800">
        <button onClick={onExcluir} className="text-sm text-rose-600 hover:underline dark:text-rose-400">
          Excluir lead
        </button>
        <BotaoSecundario onClick={onEditar}>✏️ Editar dados</BotaoSecundario>
      </div>
    </div>
  )
}

function Dado({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div>
      <p className="text-xs text-slate-400">{rotulo}</p>
      <p className="font-medium text-slate-800 dark:text-slate-200">{valor}</p>
    </div>
  )
}

function RegistrarInteracao({ onAdicionar }: { onAdicionar: (i: Omit<Interacao, 'id'>) => void }) {
  const [tipo, setTipo] = useState<TipoInteracao>('nota')
  const [descricao, setDescricao] = useState('')

  function registrar() {
    if (!descricao.trim()) return
    onAdicionar({ data: new Date().toISOString(), tipo, descricao: descricao.trim() })
    setDescricao('')
  }

  return (
    <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
      <CampoForm label="Registrar interação">
        <div className="grid gap-2 sm:grid-cols-[160px_1fr]">
          <SelectCrm value={tipo} onChange={(e) => setTipo(e.target.value as TipoInteracao)}>
            {TIPOS_INTERACAO.map((t) => (
              <option key={t.id} value={t.id}>
                {t.emoji} {t.rotulo}
              </option>
            ))}
          </SelectCrm>
          <input
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && registrar()}
            placeholder="O que aconteceu?"
          />
        </div>
      </CampoForm>
      <div className="mt-2 flex justify-end">
        <BotaoSecundario onClick={registrar}>+ Adicionar ao histórico</BotaoSecundario>
      </div>
    </div>
  )
}

function resumir(texto: string, max = 60): string {
  const limpo = texto.replace(/\s+/g, ' ').trim()
  return limpo.length > max ? `${limpo.slice(0, max)}…` : limpo
}
