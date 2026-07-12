import type { ResultadoDimensionamento } from './calculos'

export const ROTULO_CRITERIO: Record<ResultadoDimensionamento['criterioDeterminante'], string> = {
  corrente: 'Capacidade de condução de corrente',
  quedaTensao: 'Queda de tensão',
  minimoNorma: 'Seção mínima exigida por norma',
  curtoCircuito: 'Suportabilidade térmica de curto-circuito',
}
