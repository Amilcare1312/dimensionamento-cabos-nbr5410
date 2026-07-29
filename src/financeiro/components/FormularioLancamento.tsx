import { useMemo, useState } from 'react'
import type { Lancamento, Linha } from '../tipos'
import { CONTAS_DESPESA, CONTAS_RECEITA, PLANO_CONTAS, nomeConta } from '../planoContas'
import { CATEGORIAS_ENTRADA, CATEGORIAS_SAIDA } from '../categorias'
import {
  MODELOS,
  categoriaSugerida,
  montarLancamento,
  type DadosFormulario,
  type TipoTransacao,
} from '../modelos'
import { lancamentoValido, totaisLancamento } from '../calculos'
import { moeda } from '../formatar'
import { BotaoPrimario, BotaoSecundario, Campo, NumberInput, Select } from '../../components/ui'

const inputBase =
  'rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100'

function hojeISO() {
  return new Date().toISOString().slice(0, 10)
}

function linhaVazia(): Linha {
  return { codConta: '1.1.2', debito: 0, credito: 0 }
}

export function FormularioLancamento({ onAdicionar }: { onAdicionar: (l: Lancamento) => void }) {
  const [tipo, setTipo] = useState<TipoTransacao>('despesa_prazo')
  const [data, setData] = useState(hojeISO)
  const [noDoc, setNoDoc] = useState('')
  const [historico, setHistorico] = useState('')
  const [valor, setValor] = useState<number | undefined>(undefined)
  const [parte, setParte] = useState('')
  const [vencimento, setVencimento] = useState('')
  const [contaResultado, setContaResultado] = useState('4.2.4')
  const [categFC, setCategFC] = useState('')
  const [linhasManuais, setLinhasManuais] = useState<Linha[]>([linhaVazia(), linhaVazia()])

  const usaConta = tipo === 'despesa_prazo' || tipo === 'despesa_vista' || tipo === 'receita_prazo' || tipo === 'receita_vista'
  const contasResultado = tipo === 'receita_prazo' || tipo === 'receita_vista' ? CONTAS_RECEITA : CONTAS_DESPESA
  const usaParte = tipo !== 'manual'
  const usaVencimento = tipo === 'despesa_prazo' || tipo === 'receita_prazo' || tipo === 'folha'
  const usaCategFC = tipo === 'pagamento' || tipo === 'recebimento' || tipo === 'despesa_vista' || tipo === 'receita_vista'
  const categoriasFC = tipo === 'recebimento' || tipo === 'receita_vista' ? CATEGORIAS_ENTRADA : CATEGORIAS_SAIDA

  const previa: Lancamento = useMemo(() => {
    const dados: DadosFormulario = {
      tipo,
      data,
      noDoc: noDoc || 'S/N',
      historico,
      valor: valor ?? 0,
      parte,
      vencimento,
      contaResultado,
      categFC: categFC || categoriaSugerida(tipo, contaResultado),
      linhasManuais,
    }
    return montarLancamento(dados)
  }, [tipo, data, noDoc, historico, valor, parte, vencimento, contaResultado, categFC, linhasManuais])

  const totais = totaisLancamento(previa)
  const valido = lancamentoValido(previa) && (tipo === 'manual' || (valor ?? 0) > 0)

  function trocarTipo(novo: TipoTransacao) {
    setTipo(novo)
    setCategFC('')
    if (novo === 'receita_prazo' || novo === 'receita_vista') setContaResultado('3.1.2')
    else setContaResultado('4.2.4')
  }

  function salvar() {
    if (!valido) return
    onAdicionar(previa)
    // limpa campos de valor/documento, mantém tipo e data
    setNoDoc('')
    setHistorico('')
    setValor(undefined)
    setParte('')
    setVencimento('')
    setCategFC('')
    setLinhasManuais([linhaVazia(), linhaVazia()])
  }

  function atualizarLinhaManual(i: number, patch: Partial<Linha>) {
    setLinhasManuais((ls) => ls.map((l, idx) => (idx === i ? { ...l, ...patch } : l)))
  }

  return (
    <div className="space-y-4">
      <Campo label="Tipo de transação" ajuda={MODELOS.find((m) => m.tipo === tipo)?.descricao}>
        <Select value={tipo} onChange={(e) => trocarTipo(e.target.value as TipoTransacao)}>
          {MODELOS.map((m) => (
            <option key={m.tipo} value={m.tipo}>
              {m.rotulo}
            </option>
          ))}
        </Select>
      </Campo>

      <div className="grid grid-cols-2 gap-3">
        <Campo label="Data">
          <input type="date" className={inputBase} value={data} onChange={(e) => setData(e.target.value)} />
        </Campo>
        <Campo label="Nº do documento">
          <input className={inputBase} value={noDoc} placeholder="NF-001" onChange={(e) => setNoDoc(e.target.value)} />
        </Campo>
      </div>

      <Campo label="Histórico / descrição">
        <input className={inputBase} value={historico} placeholder="Aluguel maio/2026" onChange={(e) => setHistorico(e.target.value)} />
      </Campo>

      {tipo !== 'manual' && (
        <div className="grid grid-cols-2 gap-3">
          <Campo label="Valor (R$)">
            <NumberInput value={valor} min={0} step="0.01" placeholder="0,00" onChange={(e) => setValor(e.target.value === '' ? undefined : Number(e.target.value))} />
          </Campo>
          {usaVencimento && (
            <Campo label="Vencimento">
              <input type="date" className={inputBase} value={vencimento} onChange={(e) => setVencimento(e.target.value)} />
            </Campo>
          )}
        </div>
      )}

      {usaConta && (
        <Campo label={tipo.startsWith('receita') ? 'Conta de receita' : 'Conta de despesa'}>
          <Select value={contaResultado} onChange={(e) => setContaResultado(e.target.value)}>
            {contasResultado.map((c) => (
              <option key={c.codigo} value={c.codigo}>
                {c.codigo} — {c.nome}
              </option>
            ))}
          </Select>
        </Campo>
      )}

      {usaParte && (
        <Campo label={tipo.startsWith('receita') || tipo === 'recebimento' ? 'Cliente' : 'Fornecedor / parte'} ajuda="Use exatamente o mesmo nome para agrupar em Contas a Pagar/Receber.">
          <input className={inputBase} value={parte} placeholder="Nome do fornecedor/cliente" onChange={(e) => setParte(e.target.value)} />
        </Campo>
      )}

      {usaCategFC && (
        <Campo label="Categoria do Fluxo de Caixa">
          <Select value={categFC || categoriaSugerida(tipo, contaResultado)} onChange={(e) => setCategFC(e.target.value)}>
            {categoriasFC.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </Campo>
      )}

      {tipo === 'manual' && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-600 dark:text-slate-300">Partidas (débito = crédito)</p>
          {linhasManuais.map((l, i) => (
            <div key={i} className="grid grid-cols-12 items-end gap-2">
              <div className="col-span-5">
                <Select value={l.codConta} onChange={(e) => atualizarLinhaManual(i, { codConta: e.target.value })}>
                  {PLANO_CONTAS.filter((c) => !c.codigo.endsWith('.0')).map((c) => (
                    <option key={c.codigo} value={c.codigo}>
                      {c.codigo} — {c.nome}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="col-span-3">
                <NumberInput value={l.debito || undefined} placeholder="Débito" min={0} step="0.01" onChange={(e) => atualizarLinhaManual(i, { debito: Number(e.target.value) || 0 })} />
              </div>
              <div className="col-span-3">
                <NumberInput value={l.credito || undefined} placeholder="Crédito" min={0} step="0.01" onChange={(e) => atualizarLinhaManual(i, { credito: Number(e.target.value) || 0 })} />
              </div>
              <button
                type="button"
                className="col-span-1 h-9 rounded-md text-slate-400 hover:text-rose-500"
                aria-label="Remover linha"
                onClick={() => setLinhasManuais((ls) => (ls.length > 2 ? ls.filter((_, idx) => idx !== i) : ls))}
              >
                ✕
              </button>
            </div>
          ))}
          <BotaoSecundario type="button" onClick={() => setLinhasManuais((ls) => [...ls, linhaVazia()])}>
            + Linha
          </BotaoSecundario>
        </div>
      )}

      {/* Prévia das partidas */}
      <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-3 text-xs dark:border-slate-700 dark:bg-slate-800/50">
        <p className="mb-1 font-medium text-slate-600 dark:text-slate-300">Prévia das partidas</p>
        <table className="w-full">
          <tbody>
            {previa.linhas.map((l, i) => (
              <tr key={i} className="text-slate-600 dark:text-slate-300">
                <td className="py-0.5">{l.codConta} — {nomeConta(l.codConta)}</td>
                <td className="py-0.5 text-right tabular-nums text-emerald-600 dark:text-emerald-400">{l.debito ? moeda(l.debito) : ''}</td>
                <td className="py-0.5 text-right tabular-nums text-rose-600 dark:text-rose-400">{l.credito ? moeda(l.credito) : ''}</td>
              </tr>
            ))}
            <tr className="border-t border-slate-200 font-medium dark:border-slate-700">
              <td className="py-0.5 text-slate-500">Totais / diferença</td>
              <td className="py-0.5 text-right tabular-nums">{moeda(totais.debito)}</td>
              <td className="py-0.5 text-right tabular-nums">{moeda(totais.credito)}</td>
            </tr>
          </tbody>
        </table>
        {!valido && <p className="mt-1 text-rose-500">Débito e crédito devem ser iguais e maiores que zero.</p>}
      </div>

      <BotaoPrimario type="button" onClick={salvar} disabled={!valido} className="w-full">
        Adicionar lançamento
      </BotaoPrimario>
    </div>
  )
}
