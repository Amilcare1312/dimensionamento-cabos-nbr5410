import type { EntradaCircuito, Finalidade, ModoEntradaCorrente, ModoPotencia } from '../lib/calculos'
import {
  METODOS_INSTALACAO,
  ISOLACOES,
  QUEDA_TENSAO_PADRAO,
  type Isolacao,
  type Material,
  type MetodoInstalacao,
  type NumCondutoresCarregados,
  type TipoCircuito,
} from '../lib/tabelas'
import { MetodoInstalacaoPicker } from './MetodoInstalacaoPicker'
import { Campo, Cartao, NumberInput, Select } from './ui'

const TEMPERATURAS_PADRAO = { ar: 30, solo: 20 }

export function CircuitForm({
  valor,
  onChange,
}: {
  valor: EntradaCircuito
  onChange: (novo: EntradaCircuito) => void
}) {
  function set<K extends keyof EntradaCircuito>(chave: K, v: EntradaCircuito[K]) {
    onChange({ ...valor, [chave]: v })
  }

  function selecionarMetodo(metodo: MetodoInstalacao) {
    const referenciaAtual = METODOS_INSTALACAO.find((m) => m.codigo === valor.metodoInstalacao)!.referenciaTemperatura
    const novaReferencia = METODOS_INSTALACAO.find((m) => m.codigo === metodo)!.referenciaTemperatura
    // se a temperatura ainda está no valor-padrão da referência anterior, acompanha a troca de referência (ar ⇄ solo)
    const temperaturaEhPadrao = valor.temperaturaAmbienteC === TEMPERATURAS_PADRAO[referenciaAtual]
    const novaTemperatura =
      novaReferencia !== referenciaAtual && temperaturaEhPadrao
        ? TEMPERATURAS_PADRAO[novaReferencia]
        : valor.temperaturaAmbienteC
    onChange({ ...valor, metodoInstalacao: metodo, temperaturaAmbienteC: novaTemperatura })
  }

  return (
    <div className="flex flex-col gap-4">
      <Cartao>
        <h2 className="mb-3 text-base font-semibold text-slate-800 dark:text-slate-100">
          Identificação
        </h2>
        <Campo label="Nome do circuito">
          <input
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            value={valor.nome}
            onChange={(e) => set('nome', e.target.value)}
            placeholder="Ex.: Circuito de tomadas — Sala"
          />
        </Campo>
      </Cartao>

      <Cartao>
        <h2 className="mb-3 text-base font-semibold text-slate-800 dark:text-slate-100">
          Corrente de projeto
        </h2>
        <div className="mb-3 flex gap-2 text-sm">
          <button
            type="button"
            onClick={() => set('modoEntradaCorrente', 'corrente' as ModoEntradaCorrente)}
            className={`flex-1 rounded-md border px-3 py-1.5 ${valor.modoEntradaCorrente === 'corrente' ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/30' : 'border-slate-300 dark:border-slate-600'}`}
          >
            Informar corrente (A)
          </button>
          <button
            type="button"
            onClick={() => set('modoEntradaCorrente', 'potencia' as ModoEntradaCorrente)}
            className={`flex-1 rounded-md border px-3 py-1.5 ${valor.modoEntradaCorrente === 'potencia' ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/30' : 'border-slate-300 dark:border-slate-600'}`}
          >
            Calcular a partir da potência
          </button>
        </div>

        {valor.modoEntradaCorrente === 'corrente' ? (
          <Campo label="Corrente de projeto (A)">
            <NumberInput
              value={valor.correnteProjetoA}
              min={0}
              step={0.1}
              onChange={(e) => set('correnteProjetoA', Number(e.target.value))}
            />
          </Campo>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <Campo label="Grandeza informada">
              <Select
                value={valor.modoPotencia}
                onChange={(e) => set('modoPotencia', e.target.value as ModoPotencia)}
              >
                <option value="ativa">Potência ativa (W)</option>
                <option value="aparente">Potência aparente (VA)</option>
              </Select>
            </Campo>
            <Campo label={valor.modoPotencia === 'aparente' ? 'Potência (VA)' : 'Potência (W)'}>
              <NumberInput
                value={valor.potencia}
                min={0}
                onChange={(e) => set('potencia', Number(e.target.value))}
              />
            </Campo>
          </div>
        )}
      </Cartao>

      <Cartao>
        <h2 className="mb-3 text-base font-semibold text-slate-800 dark:text-slate-100">
          Circuito elétrico
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Campo label="Tipo de circuito">
            <Select
              value={valor.tipoCircuito}
              onChange={(e) => set('tipoCircuito', e.target.value as TipoCircuito)}
            >
              <option value="monofasico">Monofásico</option>
              <option value="bifasico">Bifásico</option>
              <option value="trifasico">Trifásico</option>
            </Select>
          </Campo>
          <Campo label="Tensão nominal (V)">
            <NumberInput
              value={valor.tensaoV}
              min={0}
              onChange={(e) => set('tensaoV', Number(e.target.value))}
            />
          </Campo>
          <Campo label="Fator de potência">
            <NumberInput
              value={valor.fatorPotencia}
              min={0}
              max={1}
              step={0.01}
              disabled={valor.modoEntradaCorrente === 'potencia' && valor.modoPotencia === 'aparente'}
              onChange={(e) => set('fatorPotencia', Number(e.target.value))}
            />
          </Campo>
          <Campo label="Distância — ida (m)">
            <NumberInput
              value={valor.distanciaM}
              min={0}
              onChange={(e) => set('distanciaM', Number(e.target.value))}
            />
          </Campo>
        </div>
      </Cartao>

      <Cartao>
        <h2 className="mb-3 text-base font-semibold text-slate-800 dark:text-slate-100">
          Método de instalação (Tabela 33)
        </h2>
        <MetodoInstalacaoPicker valor={valor.metodoInstalacao} onChange={selecionarMetodo} />
      </Cartao>

      <Cartao>
        <h2 className="mb-3 text-base font-semibold text-slate-800 dark:text-slate-100">
          Condutor
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Campo label="Isolação">
            <Select value={valor.isolacao} onChange={(e) => set('isolacao', e.target.value as Isolacao)}>
              {ISOLACOES.map((i) => (
                <option key={i.codigo} value={i.codigo}>
                  {i.nome}
                </option>
              ))}
            </Select>
          </Campo>
          <Campo label="Material">
            <Select value={valor.material} onChange={(e) => set('material', e.target.value as Material)}>
              <option value="cobre">Cobre</option>
              <option value="aluminio">Alumínio</option>
            </Select>
          </Campo>
          <Campo label="Condutores carregados">
            <Select
              value={valor.numCondutoresCarregados}
              onChange={(e) => set('numCondutoresCarregados', Number(e.target.value) as NumCondutoresCarregados)}
            >
              <option value={2}>2 (F+N ou F+F)</option>
              <option value={3}>3 (trifásico)</option>
            </Select>
          </Campo>
          <Campo label="Finalidade do circuito">
            <Select value={valor.finalidade} onChange={(e) => set('finalidade', e.target.value as Finalidade)}>
              <option value="outro">Outro / geral</option>
              <option value="iluminacao">Iluminação (mín. 1,5 mm²)</option>
              <option value="tomadas">Tomadas de uso geral (mín. 2,5 mm²)</option>
            </Select>
          </Campo>
        </div>
      </Cartao>

      <Cartao>
        <h2 className="mb-3 text-base font-semibold text-slate-800 dark:text-slate-100">
          Ambiente e agrupamento
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Campo
            label="Temperatura ambiente (°C)"
            ajuda={valor.metodoInstalacao === 'D' ? 'Padrão no solo: 20°C' : 'Padrão ao ar: 30°C'}
          >
            <NumberInput
              value={valor.temperaturaAmbienteC}
              onChange={(e) => set('temperaturaAmbienteC', Number(e.target.value))}
            />
          </Campo>
          <Campo label="Circuitos agrupados">
            <NumberInput
              value={valor.numCircuitosAgrupados}
              min={1}
              onChange={(e) => set('numCircuitosAgrupados', Number(e.target.value))}
            />
          </Campo>
          <Campo label="Queda de tensão máx. admissível">
            <Select
              value={valor.quedaTensaoMaximaPercent}
              onChange={(e) => set('quedaTensaoMaximaPercent', Number(e.target.value))}
            >
              {QUEDA_TENSAO_PADRAO.map((q) => (
                <option key={q.valor} value={q.valor}>
                  {q.nome}
                </option>
              ))}
            </Select>
          </Campo>
        </div>
      </Cartao>

      <Cartao>
        <h2 className="mb-1 text-base font-semibold text-slate-800 dark:text-slate-100">
          Verificação de curto-circuito (opcional)
        </h2>
        <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
          Informe a corrente de curto-circuito presumida e o tempo de atuação da proteção para
          verificar a suportabilidade térmica do condutor.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <Campo label="Corrente de curto-circuito (kA)">
            <NumberInput
              value={valor.correnteCurtoCircuitoKA}
              min={0}
              step={0.1}
              onChange={(e) =>
                set('correnteCurtoCircuitoKA', e.target.value === '' ? undefined : Number(e.target.value))
              }
            />
          </Campo>
          <Campo label="Tempo de atuação (s)">
            <NumberInput
              value={valor.tempoAtuacaoS}
              min={0}
              step={0.01}
              onChange={(e) =>
                set('tempoAtuacaoS', e.target.value === '' ? undefined : Number(e.target.value))
              }
            />
          </Campo>
        </div>
      </Cartao>
    </div>
  )
}
