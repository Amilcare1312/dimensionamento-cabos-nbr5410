import type { EntradaCircuito } from './calculos'

export function novaEntradaPadrao(): EntradaCircuito {
  return {
    nome: 'Circuito 1',
    modoEntradaCorrente: 'potencia',
    correnteProjetoA: undefined,
    modoPotencia: 'ativa',
    potencia: 2000,
    tensaoV: 220,
    fatorPotencia: 0.92,
    tipoCircuito: 'monofasico',
    distanciaM: 20,
    metodoInstalacao: 'B1',
    isolacao: 'PVC',
    material: 'cobre',
    numCondutoresCarregados: 2,
    temperaturaAmbienteC: 30,
    numCircuitosAgrupados: 1,
    quedaTensaoMaximaPercent: 4,
    finalidade: 'outro',
    correnteCurtoCircuitoKA: undefined,
    tempoAtuacaoS: undefined,
  }
}
