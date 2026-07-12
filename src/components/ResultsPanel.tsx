import type { ComparativoMaterial, EntradaCircuito, ResultadoDimensionamento } from '../lib/calculos'
import { exportarMemorialPDF } from '../lib/pdf'
import { ROTULO_CRITERIO } from '../lib/rotulos'
import { BotaoPrimario, BotaoSecundario, Cartao, Selo } from './ui'
import { MemorialCalculo } from './MemorialCalculo'

function Metrica({ rotulo, valor, destaque }: { rotulo: string; valor: string; destaque?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-slate-500 dark:text-slate-400">{rotulo}</span>
      <span className={destaque ? 'text-2xl font-bold text-teal-700 dark:text-teal-400' : 'text-lg font-semibold text-slate-800 dark:text-slate-100'}>
        {valor}
      </span>
    </div>
  )
}

export function ResultsPanel({
  entrada,
  resultado,
  comparativo,
  onAdicionarBiblioteca,
}: {
  entrada: EntradaCircuito
  resultado: ResultadoDimensionamento
  comparativo: ComparativoMaterial
  onAdicionarBiblioteca: () => void
}) {
  return (
    <div className="flex flex-col gap-4">
      <Cartao>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">Resultado</h2>
          <div className="flex flex-wrap gap-2">
            <BotaoSecundario onClick={onAdicionarBiblioteca}>Salvar na biblioteca</BotaoSecundario>
            <BotaoPrimario onClick={() => exportarMemorialPDF(entrada, resultado)}>
              Exportar PDF
            </BotaoPrimario>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Metrica rotulo="Seção recomendada" valor={`${resultado.secaoEscolhida} mm²`} destaque />
          <Metrica rotulo="Corrente de projeto (Ib)" valor={`${resultado.correnteProjeto.toFixed(2)} A`} />
          <Metrica rotulo="Capacidade corrigida (Iz)" valor={`${resultado.ampacidadeCorrigida.toFixed(1)} A`} />
          <Metrica rotulo="Margem de folga" valor={`${resultado.margemFolgaPercent.toFixed(1)}%`} />
          <Metrica
            rotulo="Queda de tensão"
            valor={`${resultado.quedaTensaoV.toFixed(2)} V (${resultado.quedaTensaoPercent.toFixed(2)}%)`}
          />
          <Metrica rotulo="Disjuntor sugerido" valor={resultado.disjuntorSugeridoA ? `${resultado.disjuntorSugeridoA} A` : '—'} />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Selo tom={resultado.quedaTensaoOk ? 'verde' : 'vermelho'}>
            {resultado.quedaTensaoOk ? 'Queda de tensão dentro do limite' : 'Queda de tensão fora do limite'}
          </Selo>
          <Selo tom="neutro">Critério determinante: {ROTULO_CRITERIO[resultado.criterioDeterminante]}</Selo>
          {resultado.margemFolgaPercent < 10 && <Selo tom="amarelo">Folga de corrente &lt; 10%</Selo>}
        </div>
      </Cartao>

      {resultado.alertas.length > 0 && (
        <Cartao>
          <h2 className="mb-2 text-base font-semibold text-slate-800 dark:text-slate-100">Alertas</h2>
          <ul className="flex flex-col gap-2">
            {resultado.alertas.map((a, i) => (
              <li key={i}>
                <Selo tom={a.nivel === 'erro' ? 'vermelho' : a.nivel === 'aviso' ? 'amarelo' : 'neutro'}>
                  {a.mensagem}
                </Selo>
              </li>
            ))}
          </ul>
        </Cartao>
      )}

      <Cartao>
        <h2 className="mb-2 text-base font-semibold text-slate-800 dark:text-slate-100">
          Fatores de correção aplicados
        </h2>
        <div className="grid grid-cols-3 gap-3 text-sm">
          <Metrica rotulo="Temperatura" valor={resultado.fatorTemperatura.toFixed(2)} />
          <Metrica rotulo="Agrupamento" valor={resultado.fatorAgrupamento.toFixed(2)} />
          <Metrica rotulo="Total" valor={resultado.fatorCorrecaoTotal.toFixed(3)} />
        </div>
      </Cartao>

      <Cartao>
        <h2 className="mb-2 text-base font-semibold text-slate-800 dark:text-slate-100">
          Comparativo cobre × alumínio
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-500 dark:text-slate-400">
                <th className="py-1 pr-4">Material</th>
                <th className="py-1 pr-4">Seção</th>
                <th className="py-1 pr-4">Iz corrigida</th>
                <th className="py-1 pr-4">Custo estimado do trecho*</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-slate-100 dark:border-slate-800">
                <td className="py-1.5 pr-4">Cobre</td>
                <td className="py-1.5 pr-4">{comparativo.cobre.secaoEscolhida} mm²</td>
                <td className="py-1.5 pr-4">{comparativo.cobre.ampacidadeCorrigida.toFixed(1)} A</td>
                <td className="py-1.5 pr-4">R$ {comparativo.custoCobre.toFixed(2)}</td>
              </tr>
              <tr className="border-t border-slate-100 dark:border-slate-800">
                <td className="py-1.5 pr-4">Alumínio</td>
                <td className="py-1.5 pr-4">{comparativo.aluminio.secaoEscolhida} mm²</td>
                <td className="py-1.5 pr-4">{comparativo.aluminio.ampacidadeCorrigida.toFixed(1)} A</td>
                <td className="py-1.5 pr-4">R$ {comparativo.custoAluminio.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          * Custo estimado por preço de referência editável (R$/mm²·m), apenas para comparação relativa —
          não representa cotação real de fabricante.
        </p>
      </Cartao>

      <MemorialCalculo passos={resultado.memorial} />
    </div>
  )
}
