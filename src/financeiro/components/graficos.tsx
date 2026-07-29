import { moedaCompacta } from '../formatar'
import { MESES_CURTOS } from '../categorias'

// Gráficos em SVG puro (sem bibliotecas externas), com viewBox responsivo.

interface BarrasMensaisProps {
  entradas: number[]
  saidas: number[]
  saldo: number[]
}

/** Barras agrupadas (entradas x saídas) com linha de saldo acumulado. */
export function BarrasMensais({ entradas, saidas, saldo }: BarrasMensaisProps) {
  const W = 720
  const H = 260
  const padL = 44
  const padR = 12
  const padT = 16
  const padB = 28
  const innerW = W - padL - padR
  const innerH = H - padT - padB

  const maxVal = Math.max(1, ...entradas, ...saidas, ...saldo.map(Math.abs))
  const escalaY = (v: number) => padT + innerH - (v / maxVal) * innerH
  const larguraMes = innerW / 12
  const larguraBarra = larguraMes * 0.32

  const pontosSaldo = saldo
    .map((v, i) => `${padL + larguraMes * (i + 0.5)},${escalaY(v)}`)
    .join(' ')

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="min-w-[560px] w-full" role="img" aria-label="Fluxo de caixa mensal">
        {/* linhas de grade */}
        {[0, 0.25, 0.5, 0.75, 1].map((f) => {
          const y = padT + innerH * f
          return (
            <g key={f}>
              <line x1={padL} y1={y} x2={W - padR} y2={y} className="stroke-slate-200 dark:stroke-slate-700" strokeWidth={1} />
              <text x={padL - 6} y={y + 3} textAnchor="end" className="fill-slate-400 text-[9px]">
                {moedaCompacta(maxVal * (1 - f))}
              </text>
            </g>
          )
        })}
        {entradas.map((_, i) => {
          const x0 = padL + larguraMes * i
          const xEnt = x0 + larguraMes / 2 - larguraBarra - 1
          const xSai = x0 + larguraMes / 2 + 1
          const yEnt = escalaY(entradas[i])
          const ySai = escalaY(saidas[i])
          return (
            <g key={i}>
              <rect x={xEnt} y={yEnt} width={larguraBarra} height={padT + innerH - yEnt} rx={2} className="fill-emerald-500" />
              <rect x={xSai} y={ySai} width={larguraBarra} height={padT + innerH - ySai} rx={2} className="fill-rose-500" />
              <text x={x0 + larguraMes / 2} y={H - 8} textAnchor="middle" className="fill-slate-500 text-[9px]">
                {MESES_CURTOS[i]}
              </text>
            </g>
          )
        })}
        <polyline points={pontosSaldo} fill="none" className="stroke-teal-500" strokeWidth={2} />
        {saldo.map((v, i) => (
          <circle key={i} cx={padL + larguraMes * (i + 0.5)} cy={escalaY(v)} r={2.5} className="fill-teal-500" />
        ))}
      </svg>
      <div className="mt-1 flex flex-wrap justify-center gap-4 text-xs text-slate-500 dark:text-slate-400">
        <Legenda cor="bg-emerald-500" texto="Entradas" />
        <Legenda cor="bg-rose-500" texto="Saídas" />
        <Legenda cor="bg-teal-500" texto="Saldo acumulado" />
      </div>
    </div>
  )
}

function Legenda({ cor, texto }: { cor: string; texto: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`inline-block h-2.5 w-2.5 rounded-sm ${cor}`} />
      {texto}
    </span>
  )
}

export interface FatiaRosca {
  rotulo: string
  valor: number
  cor: string // classe fill-*
}

/** Gráfico de rosca (donut) para composição por status. */
export function Rosca({ fatias, titulo }: { fatias: FatiaRosca[]; titulo?: string }) {
  const total = fatias.reduce((a, f) => a + Math.max(0, f.valor), 0)
  const R = 52
  const r = 32
  const cx = 60
  const cy = 60
  let anguloAcc = -Math.PI / 2

  const arcos = fatias
    .filter((f) => f.valor > 0)
    .map((f, i) => {
      const frac = total > 0 ? f.valor / total : 0
      const ang = frac * Math.PI * 2
      const a0 = anguloAcc
      const a1 = anguloAcc + ang
      anguloAcc = a1
      const grande = ang > Math.PI ? 1 : 0
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
        {total > 0 ? arcos : <circle cx={cx} cy={cy} r={(R + r) / 2} fill="none" className="stroke-slate-200 dark:stroke-slate-700" strokeWidth={R - r} />}
      </svg>
      <ul className="flex-1 space-y-1 text-xs">
        {fatias.map((f) => (
          <li key={f.rotulo} className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
              <span className={`inline-block h-2.5 w-2.5 rounded-sm ${f.cor.replace('fill-', 'bg-')}`} />
              {f.rotulo}
            </span>
            <span className="font-medium tabular-nums text-slate-800 dark:text-slate-100">{moedaCompacta(f.valor)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
