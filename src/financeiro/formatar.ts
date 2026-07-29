const FMT_MOEDA = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const FMT_COMPACTO = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  notation: 'compact',
  maximumFractionDigits: 1,
})

export function moeda(v: number | undefined | null): string {
  return FMT_MOEDA.format(v ?? 0)
}

export function moedaCompacta(v: number | undefined | null): string {
  return FMT_COMPACTO.format(v ?? 0)
}

export function percentual(v: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'percent', maximumFractionDigits: 1 }).format(v)
}

/** Converte 'yyyy-mm-dd' para 'dd/mm/aaaa' sem sofrer com fuso. */
export function dataBR(iso: string | undefined): string {
  if (!iso) return '—'
  const [a, m, d] = iso.slice(0, 10).split('-')
  if (!a || !m || !d) return iso
  return `${d}/${m}/${a}`
}
