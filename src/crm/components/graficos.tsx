import type { ContagemEtapa } from '../calculos'
import { metaEtapa } from '../tipos'
import { moedaCompacta } from '../formatar'

// Gráficos em SVG puro (sem bibliotecas externas), responsivos via viewBox.

/** Funil de vendas: barras horizontais proporcionais à quantidade por etapa aberta. */
export function Funil({ etapas }: { etapas: ContagemEtapa[] }) {
  const abertas = etapas.filter((e) => metaEtapa(e.etapa).aberta)
  const max = Math.max(1, ...abertas.map((e) => e.quantidade))

  if (abertas.every((e) => e.quantidade === 0)) {
    return <p className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">Sem leads em aberto no funil.</p>
  }

  return (
    <div className="space-y-2">
      {abertas.map((e) => {
        const meta = metaEtapa(e.etapa)
        const largura = (e.quantidade / max) * 100
        return (
          <div key={e.etapa} className="flex items-center gap-3">
            <span className="w-28 shrink-0 text-right text-xs text-slate-600 dark:text-slate-300">{e.rotulo}</span>
            <div className="relative h-7 flex-1 overflow-hidden rounded-md bg-slate-100 dark:bg-slate-800">
              <div
                className={`h-full ${meta.cor} transition-all`}
                style={{ width: `${Math.max(largura, e.quantidade > 0 ? 6 : 0)}%` }}
              />
              <span className="absolute inset-y-0 left-2 flex items-center text-xs font-semibold text-white mix-blend-plus-lighter">
                {e.quantidade}
              </span>
            </div>
            <span className="w-20 shrink-0 text-right text-xs tabular-nums text-slate-500 dark:text-slate-400">
              {moedaCompacta(e.valor)}
            </span>
          </div>
        )
      })}
    </div>
  )
}

export interface FatiaRosca {
  rotulo: string
  valor: number
  cor: string // classe fill-*
}

/** Gráfico de rosca (donut) para distribuição por origem/produto. */
export function Rosca({ fatias, titulo }: { fatias: FatiaRosca[]; titulo?: string }) {
  const dados = fatias.filter((f) => f.valor > 0)
  const total = dados.reduce((a, f) => a + f.valor, 0)
  const R = 52
  const r = 32
  const cx = 60
  const cy = 60
  let anguloAcc = -Math.PI / 2

  const arcos = dados.map((f, i) => {
    const frac = total > 0 ? f.valor / total : 0
    const ang = frac * Math.PI * 2
    const a0 = anguloAcc
    const a1 = anguloAcc + ang
    anguloAcc = a1
    const grande = ang > Math.PI ? 1 : 0
    // Um único item = círculo completo (evita arco degenerado).
    if (dados.length === 1) {
      return (
        <circle key={i} cx={cx} cy={cy} r={(R + r) / 2} fill="none" className={f.cor.replace('fill-', 'stroke-')} strokeWidth={R - r} />
      )
    }
    const x0 = cx + R * Math.cos(a0)
    const y0 = cy + R * Math.sin(a0)
    const x1 = cx + R * Math.cos(a1)
    const y1 = cy + R * Math.sin(a1)
    const xi1 = cx + r * Math.cos(a1)
    const yi1 = cy + r * Math.sin(a1)
    const xi0 = cx + r * Math.cos(a0)
    const yi0 = cy + r * Math.sin(a0)
    const d = `M ${x0} ${y0} A ${R} ${R} 0 ${grande} 1 ${x1} ${y1} L ${xi1} ${yi1} A ${r} ${r} 0 ${grande} 0 ${xi0} ${yi0} Z`
    return <path key={i} d={d} className={f.cor} />
  })

  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 120 120" className="h-28 w-28 shrink-0" role="img" aria-label={titulo ?? 'Distribuição'}>
        {total > 0 ? (
          arcos
        ) : (
          <circle cx={cx} cy={cy} r={(R + r) / 2} fill="none" className="stroke-slate-200 dark:stroke-slate-700" strokeWidth={R - r} />
        )}
        <text x={cx} y={cy - 2} textAnchor="middle" className="fill-slate-800 text-[15px] font-bold dark:fill-slate-100">
          {total}
        </text>
        <text x={cx} y={cy + 12} textAnchor="middle" className="fill-slate-400 text-[8px]">
          leads
        </text>
      </svg>
      <ul className="flex-1 space-y-1 text-xs">
        {fatias.map((f) => (
          <li key={f.rotulo} className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
              <span className={`inline-block h-2.5 w-2.5 rounded-sm ${f.cor.replace('fill-', 'bg-')}`} />
              {f.rotulo}
            </span>
            <span className="font-medium tabular-nums text-slate-800 dark:text-slate-100">{f.valor}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
