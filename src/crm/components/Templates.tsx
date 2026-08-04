import { useState } from 'react'
import type { Template } from '../tipos'
import { BotaoPrimario, BotaoSecundario, Cartao } from '../../components/ui'
import { CampoForm, TextArea, TextInput } from './ui'

const VARIAVEIS = ['{primeiroNome}', '{nome}', '{empresa}', '{cidade}', '{produto}', '{responsavel}']

export function Templates({
  templates,
  onSalvar,
  onExcluir,
}: {
  templates: Template[]
  onSalvar: (t: Template) => void
  onExcluir: (id: string) => void
}) {
  const [editando, setEditando] = useState<Template | null>(null)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Modelos de mensagem do WhatsApp</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Use variáveis que são preenchidas automaticamente ao enviar: {VARIAVEIS.join(' ')}
          </p>
        </div>
        <BotaoPrimario onClick={() => setEditando({ id: '', titulo: '', texto: '' })}>+ Novo modelo</BotaoPrimario>
      </div>

      {editando && (
        <EditorTemplate
          template={editando}
          onSalvar={(t) => {
            onSalvar(t)
            setEditando(null)
          }}
          onCancelar={() => setEditando(null)}
        />
      )}

      {templates.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 py-10 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
          Nenhum modelo cadastrado.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {templates.map((t) => (
            <Cartao key={t.id}>
              <div className="mb-2 flex items-start justify-between gap-2">
                <h3 className="font-medium text-slate-800 dark:text-slate-100">{t.titulo}</h3>
                <div className="flex gap-1">
                  <button
                    onClick={() => setEditando(t)}
                    className="rounded p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
                    title="Editar"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Excluir o modelo "${t.titulo}"?`)) onExcluir(t.id)
                    }}
                    className="rounded p-1 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-900/30"
                    title="Excluir"
                  >
                    🗑️
                  </button>
                </div>
              </div>
              <p className="whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-300">{t.texto}</p>
            </Cartao>
          ))}
        </div>
      )}
    </div>
  )
}

function EditorTemplate({
  template,
  onSalvar,
  onCancelar,
}: {
  template: Template
  onSalvar: (t: Template) => void
  onCancelar: () => void
}) {
  const [titulo, setTitulo] = useState(template.titulo)
  const [texto, setTexto] = useState(template.texto)

  return (
    <Cartao className="border-teal-300 dark:border-teal-700">
      <div className="space-y-3">
        <CampoForm label="Título do modelo">
          <TextInput value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex.: Primeiro contato" />
        </CampoForm>
        <CampoForm label="Mensagem" ajuda={`Variáveis disponíveis: ${VARIAVEIS.join(' ')}`}>
          <TextArea value={texto} onChange={(e) => setTexto(e.target.value)} className="min-h-[120px]" />
        </CampoForm>
        <div className="flex justify-end gap-2">
          <BotaoSecundario onClick={onCancelar}>Cancelar</BotaoSecundario>
          <BotaoPrimario
            disabled={!titulo.trim() || !texto.trim()}
            onClick={() => onSalvar({ id: template.id, titulo: titulo.trim(), texto })}
          >
            Salvar modelo
          </BotaoPrimario>
        </div>
      </div>
    </Cartao>
  )
}
