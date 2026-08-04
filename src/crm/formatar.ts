const FMT_MOEDA = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
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

export function percentual(v: number, casas = 0): string {
  return new Intl.NumberFormat('pt-BR', { style: 'percent', maximumFractionDigits: casas }).format(v)
}

/** Converte 'yyyy-mm-dd' para 'dd/mm/aaaa' sem sofrer com fuso. */
export function dataBR(iso: string | undefined): string {
  if (!iso) return '—'
  const [a, m, d] = iso.slice(0, 10).split('-')
  if (!a || !m || !d) return iso
  return `${d}/${m}/${a}`
}

/** Data + hora curtas a partir de um ISO datetime. */
export function dataHoraBR(iso: string | undefined): string {
  if (!iso) return '—'
  const dt = new Date(iso)
  if (Number.isNaN(dt.getTime())) return dataBR(iso)
  return dt.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** Distância humana relativa a hoje: "há 2 dias", "em 3 dias", "hoje". */
export function relativoDias(iso: string | undefined): string {
  if (!iso) return '—'
  const dias = diasAte(iso)
  if (dias === null) return '—'
  if (dias === 0) return 'hoje'
  if (dias === 1) return 'amanhã'
  if (dias === -1) return 'ontem'
  if (dias > 0) return `em ${dias} dias`
  return `há ${Math.abs(dias)} dias`
}

/** Nº de dias (inteiro) de hoje até a data ISO. Negativo = passado. */
export function diasAte(iso: string | undefined): number | null {
  if (!iso) return null
  const [a, m, d] = iso.slice(0, 10).split('-').map(Number)
  if (!a || !m || !d) return null
  const alvo = new Date(a, m - 1, d)
  const hoje = new Date()
  const h0 = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate())
  return Math.round((alvo.getTime() - h0.getTime()) / 86_400_000)
}

/** Formata um telefone só-dígitos (5548999998888) para leitura (+55 48 99999-8888). */
export function telefoneBR(digitos: string): string {
  const s = (digitos || '').replace(/\D/g, '')
  if (!s) return '—'
  let resto = s
  let ddi = ''
  if (resto.length > 11) {
    ddi = `+${resto.slice(0, resto.length - 11)} `
    resto = resto.slice(resto.length - 11)
  }
  if (resto.length === 11) return `${ddi}(${resto.slice(0, 2)}) ${resto.slice(2, 7)}-${resto.slice(7)}`
  if (resto.length === 10) return `${ddi}(${resto.slice(0, 2)}) ${resto.slice(2, 6)}-${resto.slice(6)}`
  return `${ddi}${resto}`
}

/** Iniciais para avatar (até 2 letras). */
export function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean)
  if (partes.length === 0) return '?'
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase()
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase()
}
