import { useState } from 'react'
import type { Lead } from '../tipos'
import { ETAPAS, ORIGENS, PRODUTOS, TEMPERATURAS } from '../tipos'
import { normalizarTelefone } from '../whatsapp'
import { BotaoPrimario, BotaoSecundario } from '../../components/ui'
import { CampoForm, SelectCrm, TextArea, TextInput } from './ui'

type Rascunho = Omit<Lead, 'interacoes' | 'criadoEm' | 'atualizadoEm'> & {
  tagsTexto: string
}

function paraRascunho(lead?: Lead): Rascunho {
  return {
    id: lead?.id ?? '',
    nome: lead?.nome ?? '',
    telefone: lead?.telefone ?? '',
    empresa: lead?.empresa ?? '',
    cidade: lead?.cidade ?? '',
    produto: lead?.produto ?? 'FV',
    origem: lead?.origem ?? 'WhatsApp',
    etapa: lead?.etapa ?? 'novo',
    temperatura: lead?.temperatura ?? 'morno',
    valorEstimado: lead?.valorEstimado ?? 0,
    responsavel: lead?.responsavel ?? '',
    observacoes: lead?.observacoes ?? '',
    proximoContato: lead?.proximoContato ?? '',
    motivoPerda: lead?.motivoPerda ?? '',
    tags: lead?.tags ?? [],
    tagsTexto: (lead?.tags ?? []).join(', '),
  }
}

export function FormularioLead({
  leadInicial,
  onSalvar,
  onCancelar,
}: {
  leadInicial?: Lead
  onSalvar: (dados: Omit<Lead, 'id' | 'interacoes' | 'criadoEm' | 'atualizadoEm'> & { id?: string }) => void
  onCancelar: () => void
}) {
  const [r, setR] = useState<Rascunho>(() => paraRascunho(leadInicial))
  const [erro, setErro] = useState('')

  function set<K extends keyof Rascunho>(chave: K, valor: Rascunho[K]) {
    setR((atual) => ({ ...atual, [chave]: valor }))
  }

  function salvar() {
    if (!r.nome.trim()) {
      setErro('Informe ao menos o nome do lead.')
      return
    }
    const tags = r.tagsTexto
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
    onSalvar({
      id: r.id || undefined,
      nome: r.nome.trim(),
      telefone: normalizarTelefone(r.telefone),
      empresa: r.empresa?.trim() || undefined,
      cidade: r.cidade?.trim() || undefined,
      produto: r.produto,
      origem: r.origem,
      etapa: r.etapa,
      temperatura: r.temperatura,
      valorEstimado: Number(r.valorEstimado) || 0,
      responsavel: r.responsavel?.trim() || undefined,
      observacoes: r.observacoes?.trim() || undefined,
      proximoContato: r.proximoContato || undefined,
      motivoPerda: r.etapa === 'perdido' ? r.motivoPerda?.trim() || undefined : undefined,
      tags,
    })
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <CampoForm label="Nome *" className="sm:col-span-2">
          <TextInput value={r.nome} onChange={(e) => set('nome', e.target.value)} placeholder="Ex.: Carlos Menezes" autoFocus />
        </CampoForm>
        <CampoForm label="WhatsApp / Telefone" ajuda="Pode colar em qualquer formato; assume +55 se faltar.">
          <TextInput
            value={r.telefone}
            onChange={(e) => set('telefone', e.target.value)}
            placeholder="(48) 99999-8888"
            inputMode="tel"
          />
        </CampoForm>
        <CampoForm label="Empresa">
          <TextInput value={r.empresa ?? ''} onChange={(e) => set('empresa', e.target.value)} placeholder="Opcional" />
        </CampoForm>
        <CampoForm label="Cidade">
          <TextInput value={r.cidade ?? ''} onChange={(e) => set('cidade', e.target.value)} placeholder="Ex.: Florianópolis" />
        </CampoForm>
        <CampoForm label="Valor estimado (R$)">
          <TextInput
            value={String(r.valorEstimado || '')}
            onChange={(e) => set('valorEstimado', Number(e.target.value.replace(/\D/g, '')))}
            inputMode="numeric"
            placeholder="0"
          />
        </CampoForm>
        <CampoForm label="Produto de interesse">
          <SelectCrm value={r.produto} onChange={(e) => set('produto', e.target.value as Rascunho['produto'])}>
            {PRODUTOS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.rotulo}
              </option>
            ))}
          </SelectCrm>
        </CampoForm>
        <CampoForm label="Origem">
          <SelectCrm value={r.origem} onChange={(e) => set('origem', e.target.value as Rascunho['origem'])}>
            {ORIGENS.map((o) => (
              <option key={o.id} value={o.id}>
                {o.rotulo}
              </option>
            ))}
          </SelectCrm>
        </CampoForm>
        <CampoForm label="Etapa do funil">
          <SelectCrm value={r.etapa} onChange={(e) => set('etapa', e.target.value as Rascunho['etapa'])}>
            {ETAPAS.map((et) => (
              <option key={et.id} value={et.id}>
                {et.rotulo}
              </option>
            ))}
          </SelectCrm>
        </CampoForm>
        <CampoForm label="Temperatura">
          <SelectCrm value={r.temperatura} onChange={(e) => set('temperatura', e.target.value as Rascunho['temperatura'])}>
            {TEMPERATURAS.map((t) => (
              <option key={t.id} value={t.id}>
                {t.emoji} {t.rotulo}
              </option>
            ))}
          </SelectCrm>
        </CampoForm>
        <CampoForm label="Próximo follow-up">
          <TextInput type="date" value={r.proximoContato ?? ''} onChange={(e) => set('proximoContato', e.target.value)} />
        </CampoForm>
        <CampoForm label="Responsável">
          <TextInput value={r.responsavel ?? ''} onChange={(e) => set('responsavel', e.target.value)} placeholder="Quem atende" />
        </CampoForm>
        {r.etapa === 'perdido' && (
          <CampoForm label="Motivo da perda" className="sm:col-span-2">
            <TextInput
              value={r.motivoPerda ?? ''}
              onChange={(e) => set('motivoPerda', e.target.value)}
              placeholder="Ex.: preço, prazo, fechou com concorrente..."
            />
          </CampoForm>
        )}
        <CampoForm label="Tags" ajuda="Separe por vírgula (ex.: industrial, media-tensao)." className="sm:col-span-2">
          <TextInput value={r.tagsTexto} onChange={(e) => set('tagsTexto', e.target.value)} placeholder="industrial, urgente" />
        </CampoForm>
        <CampoForm label="Observações" className="sm:col-span-2">
          <TextArea value={r.observacoes ?? ''} onChange={(e) => set('observacoes', e.target.value)} placeholder="Anotações sobre o lead, consumo, dores, decisor..." />
        </CampoForm>
      </div>

      {erro && <p className="text-sm text-rose-600 dark:text-rose-400">{erro}</p>}

      <div className="flex justify-end gap-2 border-t border-slate-200 pt-3 dark:border-slate-800">
        <BotaoSecundario onClick={onCancelar}>Cancelar</BotaoSecundario>
        <BotaoPrimario onClick={salvar}>{leadInicial ? 'Salvar alterações' : 'Adicionar lead'}</BotaoPrimario>
      </div>
    </div>
  )
}
