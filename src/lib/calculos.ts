import {
  AMPACIDADE_COBRE,
  CORRENTES_DISJUNTOR,
  CUSTO_REFERENCIA_POR_MM2_METRO,
  FATOR_AGRUPAMENTO,
  FATOR_AMPACIDADE_ALUMINIO,
  FATOR_RESISTENCIA_ALUMINIO,
  FATOR_TEMPERATURA,
  IMPEDANCIA_CABO_COBRE,
  K_CURTO_CIRCUITO,
  METODOS_INSTALACAO,
  QUEDA_TENSAO_PADRAO,
  SECAO_MINIMA_NORMA,
  SECOES_PADRONIZADAS,
  type Isolacao,
  type Material,
  type MetodoInstalacao,
  type NumCondutoresCarregados,
  type Secao,
  type TipoCircuito,
} from './tabelas'

export type Finalidade = 'iluminacao' | 'tomadas' | 'outro'
export type ModoEntradaCorrente = 'corrente' | 'potencia'
export type ModoPotencia = 'ativa' | 'aparente'

export interface EntradaCircuito {
  nome: string
  modoEntradaCorrente: ModoEntradaCorrente
  correnteProjetoA?: number
  modoPotencia?: ModoPotencia
  potencia?: number // W (ativa) ou VA (aparente)
  tensaoV: number
  fatorPotencia: number
  tipoCircuito: TipoCircuito
  distanciaM: number
  metodoInstalacao: MetodoInstalacao
  isolacao: Isolacao
  material: Material
  numCondutoresCarregados: NumCondutoresCarregados
  temperaturaAmbienteC: number
  numCircuitosAgrupados: number
  quedaTensaoMaximaPercent: number
  finalidade: Finalidade
  correnteCurtoCircuitoKA?: number
  tempoAtuacaoS?: number
}

export interface Alerta {
  nivel: 'info' | 'aviso' | 'erro'
  mensagem: string
}

export interface PassoMemorial {
  titulo: string
  descricao: string
  referenciaNormativa?: string
}

export interface ResultadoDimensionamento {
  correnteProjeto: number
  fatorTemperatura: number
  fatorAgrupamento: number
  fatorCorrecaoTotal: number
  secaoEscolhida: Secao
  ampacidadeTabelada: number
  ampacidadeCorrigida: number
  margemFolgaPercent: number
  quedaTensaoV: number
  quedaTensaoPercent: number
  quedaTensaoOk: boolean
  criterioDeterminante: 'corrente' | 'quedaTensao' | 'minimoNorma' | 'curtoCircuito'
  disjuntorSugeridoA: number | null
  secaoMinimaCurtoCircuito: number | null
  alertas: Alerta[]
  memorial: PassoMemorial[]
}

export function calcularCorrenteProjeto(entrada: EntradaCircuito): number {
  if (entrada.modoEntradaCorrente === 'corrente') {
    return entrada.correnteProjetoA ?? 0
  }
  const potencia = entrada.potencia ?? 0
  const v = entrada.tensaoV
  const fp = entrada.modoPotencia === 'aparente' ? 1 : entrada.fatorPotencia
  if (entrada.tipoCircuito === 'trifasico') {
    return potencia / (Math.sqrt(3) * v * fp)
  }
  return potencia / (v * fp)
}

function interpolar(valores: [number, number][], x: number): number {
  const ordenado = [...valores].sort((a, b) => a[0] - b[0])
  if (x <= ordenado[0][0]) return ordenado[0][1]
  if (x >= ordenado[ordenado.length - 1][0]) return ordenado[ordenado.length - 1][1]
  for (let i = 0; i < ordenado.length - 1; i++) {
    const [x0, y0] = ordenado[i]
    const [x1, y1] = ordenado[i + 1]
    if (x >= x0 && x <= x1) {
      return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0)
    }
  }
  return ordenado[ordenado.length - 1][1]
}

export function obterFatorTemperatura(
  isolacao: Isolacao,
  referencia: 'ar' | 'solo',
  temperaturaAmbienteC: number,
): number {
  const tabela = FATOR_TEMPERATURA[isolacao][referencia]
  return Math.round(interpolar(tabela.valores, temperaturaAmbienteC) * 1000) / 1000
}

export function obterFatorAgrupamento(numCircuitos: number): number {
  const ordenado = [...FATOR_AGRUPAMENTO].sort((a, b) => a[0] - b[0])
  let fator = ordenado[0][1]
  for (const [n, f] of ordenado) {
    if (numCircuitos >= n) fator = f
  }
  return fator
}

export function obterAmpacidadeTabelada(
  isolacao: Isolacao,
  metodo: MetodoInstalacao,
  secao: Secao,
  numCondutores: NumCondutoresCarregados,
  material: Material,
): number {
  const entrada = AMPACIDADE_COBRE[isolacao][metodo][secao]
  const base = numCondutores === 2 ? entrada.dois : entrada.tres
  return material === 'aluminio' ? base * FATOR_AMPACIDADE_ALUMINIO : base
}

export function obterImpedanciaCabo(secao: Secao, material: Material): { r: number; x: number } {
  const base = IMPEDANCIA_CABO_COBRE[secao]
  return {
    r: material === 'aluminio' ? base.r * FATOR_RESISTENCIA_ALUMINIO : base.r,
    x: base.x,
  }
}

export function calcularQuedaTensao(
  tipoCircuito: TipoCircuito,
  distanciaM: number,
  correnteA: number,
  secao: Secao,
  material: Material,
  fatorPotencia: number,
  tensaoV: number,
): { deltaV: number; deltaVPercent: number } {
  const { r, x } = obterImpedanciaCabo(secao, material)
  const senPhi = Math.sqrt(Math.max(0, 1 - fatorPotencia * fatorPotencia))
  const multiplicador = tipoCircuito === 'trifasico' ? Math.sqrt(3) : 2
  const deltaV =
    (multiplicador * distanciaM * correnteA * (r * fatorPotencia + x * senPhi)) / 1000
  return { deltaV, deltaVPercent: (deltaV / tensaoV) * 100 }
}

export function sugerirDisjuntor(correnteProjeto: number, ampacidadeCorrigida: number): number | null {
  const candidato = CORRENTES_DISJUNTOR.find((in_) => in_ >= correnteProjeto)
  if (candidato === undefined) return null
  return candidato <= ampacidadeCorrigida ? candidato : null
}

export function calcularSecaoMinimaCurtoCircuito(
  material: Material,
  isolacao: Isolacao,
  correnteCurtoCircuitoKA: number,
  tempoAtuacaoS: number,
): number {
  const k = K_CURTO_CIRCUITO[material][isolacao]
  const iccA = correnteCurtoCircuitoKA * 1000
  return (iccA * Math.sqrt(tempoAtuacaoS)) / k
}

function proximaSecaoPadronizada(minima: number): Secao | null {
  const encontrada = SECOES_PADRONIZADAS.find((s) => s >= minima)
  return encontrada ?? null
}

function secaoMinimaNormaAplicavel(finalidade: Finalidade): number | null {
  if (finalidade === 'iluminacao') return SECAO_MINIMA_NORMA.iluminacao
  if (finalidade === 'tomadas') return SECAO_MINIMA_NORMA.tomadasUsoGeral
  return null
}

export function dimensionarCabo(entrada: EntradaCircuito): ResultadoDimensionamento {
  const alertas: Alerta[] = []
  const memorial: PassoMemorial[] = []

  const correnteProjeto = calcularCorrenteProjeto(entrada)
  const metodoInfo = METODOS_INSTALACAO.find((m) => m.codigo === entrada.metodoInstalacao)!

  memorial.push({
    titulo: '1. Corrente de projeto (Ib)',
    descricao:
      entrada.modoEntradaCorrente === 'corrente'
        ? `Corrente informada diretamente: Ib = ${correnteProjeto.toFixed(2)} A.`
        : entrada.tipoCircuito === 'trifasico'
          ? `Ib = P / (√3 × V × cosφ) = ${entrada.potencia} / (√3 × ${entrada.tensaoV} × ${entrada.fatorPotencia}) = ${correnteProjeto.toFixed(2)} A.`
          : `Ib = P / (V × cosφ) = ${entrada.potencia} / (${entrada.tensaoV} × ${entrada.fatorPotencia}) = ${correnteProjeto.toFixed(2)} A.`,
    referenciaNormativa: 'NBR 5410 — cálculo de corrente de projeto',
  })

  const fatorTemperatura = obterFatorTemperatura(
    entrada.isolacao,
    metodoInfo.referenciaTemperatura,
    entrada.temperaturaAmbienteC,
  )
  const fatorAgrupamento = obterFatorAgrupamento(entrada.numCircuitosAgrupados)
  const fatorCorrecaoTotal = fatorTemperatura * fatorAgrupamento

  memorial.push({
    titulo: '2. Fatores de correção',
    descricao: `Fator de temperatura (${entrada.temperaturaAmbienteC}°C, referência ${metodoInfo.referenciaTemperatura === 'ar' ? '30°C ao ar' : '20°C no solo'}) = ${fatorTemperatura.toFixed(2)}. Fator de agrupamento (${entrada.numCircuitosAgrupados} circuito(s)) = ${fatorAgrupamento.toFixed(2)}. Fator de correção total = ${fatorCorrecaoTotal.toFixed(3)}.`,
    referenciaNormativa: 'NBR 5410 — Tabelas 40 e 42',
  })

  if (entrada.temperaturaAmbienteC > 60 || entrada.temperaturaAmbienteC < 0) {
    alertas.push({
      nivel: 'aviso',
      mensagem: `Temperatura ambiente de ${entrada.temperaturaAmbienteC}°C está fora da faixa usual das tabelas de correção — resultado extrapolado.`,
    })
  }

  let secaoEscolhida: Secao | null = null
  let criterioDeterminante: ResultadoDimensionamento['criterioDeterminante'] = 'corrente'
  let ampacidadeTabelada = 0
  let ampacidadeCorrigida = 0

  const secaoMinimaNorma = secaoMinimaNormaAplicavel(entrada.finalidade)

  for (const secao of SECOES_PADRONIZADAS) {
    const tab = obterAmpacidadeTabelada(
      entrada.isolacao,
      entrada.metodoInstalacao,
      secao,
      entrada.numCondutoresCarregados,
      entrada.material,
    )
    const corrigida = tab * fatorCorrecaoTotal
    if (corrigida >= correnteProjeto) {
      secaoEscolhida = secao
      ampacidadeTabelada = tab
      ampacidadeCorrigida = corrigida
      break
    }
  }

  if (secaoEscolhida === null) {
    secaoEscolhida = SECOES_PADRONIZADAS[SECOES_PADRONIZADAS.length - 1]
    ampacidadeTabelada = obterAmpacidadeTabelada(
      entrada.isolacao,
      entrada.metodoInstalacao,
      secaoEscolhida,
      entrada.numCondutoresCarregados,
      entrada.material,
    )
    ampacidadeCorrigida = ampacidadeTabelada * fatorCorrecaoTotal
    alertas.push({
      nivel: 'erro',
      mensagem:
        'Mesmo a maior seção padronizada (240 mm²) não atende à corrente de projeto com os fatores de correção informados. Considere dividir o circuito ou revisar o método de instalação/agrupamento.',
    })
  }

  memorial.push({
    titulo: '3. Seção mínima pela capacidade de condução de corrente',
    descricao: `Seção de ${secaoEscolhida} mm² selecionada: capacidade tabelada = ${ampacidadeTabelada.toFixed(1)} A; capacidade corrigida (Iz) = ${ampacidadeTabelada.toFixed(1)} × ${fatorCorrecaoTotal.toFixed(3)} = ${ampacidadeCorrigida.toFixed(1)} A ≥ Ib = ${correnteProjeto.toFixed(2)} A.`,
    referenciaNormativa: 'NBR 5410 — Tabela 36 (método ' + entrada.metodoInstalacao + ')',
  })

  if (secaoMinimaNorma !== null && secaoEscolhida < secaoMinimaNorma) {
    secaoEscolhida = proximaSecaoPadronizada(secaoMinimaNorma) ?? secaoEscolhida
    ampacidadeTabelada = obterAmpacidadeTabelada(
      entrada.isolacao,
      entrada.metodoInstalacao,
      secaoEscolhida,
      entrada.numCondutoresCarregados,
      entrada.material,
    )
    ampacidadeCorrigida = ampacidadeTabelada * fatorCorrecaoTotal
    criterioDeterminante = 'minimoNorma'
    alertas.push({
      nivel: 'aviso',
      mensagem: `Seção elevada para ${secaoEscolhida} mm² por exigência de seção mínima da norma para circuitos de ${entrada.finalidade === 'iluminacao' ? 'iluminação (mín. 1,5 mm²)' : 'tomadas de uso geral (mín. 2,5 mm²)'}.`,
    })
  }

  let queda = calcularQuedaTensao(
    entrada.tipoCircuito,
    entrada.distanciaM,
    correnteProjeto,
    secaoEscolhida,
    entrada.material,
    entrada.fatorPotencia,
    entrada.tensaoV,
  )

  const limiteExcedidoInicial = queda.deltaVPercent > entrada.quedaTensaoMaximaPercent
  if (limiteExcedidoInicial) {
    for (const secao of SECOES_PADRONIZADAS) {
      if (secao <= secaoEscolhida) continue
      const q = calcularQuedaTensao(
        entrada.tipoCircuito,
        entrada.distanciaM,
        correnteProjeto,
        secao,
        entrada.material,
        entrada.fatorPotencia,
        entrada.tensaoV,
      )
      if (q.deltaVPercent <= entrada.quedaTensaoMaximaPercent) {
        secaoEscolhida = secao
        queda = q
        ampacidadeTabelada = obterAmpacidadeTabelada(
          entrada.isolacao,
          entrada.metodoInstalacao,
          secao,
          entrada.numCondutoresCarregados,
          entrada.material,
        )
        ampacidadeCorrigida = ampacidadeTabelada * fatorCorrecaoTotal
        criterioDeterminante = 'quedaTensao'
        break
      }
    }
    if (queda.deltaVPercent > entrada.quedaTensaoMaximaPercent) {
      alertas.push({
        nivel: 'erro',
        mensagem:
          'Mesmo com a maior seção padronizada, a queda de tensão máxima admissível não é atendida. Reduza a distância, aumente a tensão ou divida o circuito.',
      })
    } else {
      alertas.push({
        nivel: 'aviso',
        mensagem: `Seção elevada para ${secaoEscolhida} mm² pois a queda de tensão foi o fator limitante (não a capacidade de corrente). Alternativas: aumentar a seção, reduzir a distância ou dividir o circuito.`,
      })
    }
  }

  memorial.push({
    titulo: '4. Verificação da queda de tensão',
    descricao:
      entrada.tipoCircuito === 'trifasico'
        ? `ΔV = √3 × L × Ib × (R·cosφ + X·senφ) / 1000 = √3 × ${entrada.distanciaM} × ${correnteProjeto.toFixed(2)} × (...)/1000 = ${queda.deltaV.toFixed(2)} V (${queda.deltaVPercent.toFixed(2)}%), limite admissível ${entrada.quedaTensaoMaximaPercent}%.`
        : `ΔV = 2 × L × Ib × (R·cosφ + X·senφ) / 1000 = 2 × ${entrada.distanciaM} × ${correnteProjeto.toFixed(2)} × (...)/1000 = ${queda.deltaV.toFixed(2)} V (${queda.deltaVPercent.toFixed(2)}%), limite admissível ${entrada.quedaTensaoMaximaPercent}%.`,
    referenciaNormativa: 'NBR 5410 — 6.2.7 (limites de queda de tensão)',
  })

  let secaoMinimaCurtoCircuito: number | null = null
  if (entrada.correnteCurtoCircuitoKA && entrada.tempoAtuacaoS) {
    secaoMinimaCurtoCircuito = calcularSecaoMinimaCurtoCircuito(
      entrada.material,
      entrada.isolacao,
      entrada.correnteCurtoCircuitoKA,
      entrada.tempoAtuacaoS,
    )
    memorial.push({
      titulo: '5. Verificação térmica de curto-circuito',
      descricao: `Smin = (Icc × √t) / k = (${entrada.correnteCurtoCircuitoKA * 1000} × √${entrada.tempoAtuacaoS}) / ${K_CURTO_CIRCUITO[entrada.material][entrada.isolacao]} = ${secaoMinimaCurtoCircuito.toFixed(2)} mm².`,
      referenciaNormativa: 'NBR 5410 / IEC 60364-5-54 — verificação térmica simplificada',
    })
    if (secaoMinimaCurtoCircuito > secaoEscolhida) {
      const novaSecao = proximaSecaoPadronizada(secaoMinimaCurtoCircuito)
      if (novaSecao) {
        secaoEscolhida = novaSecao
        ampacidadeTabelada = obterAmpacidadeTabelada(
          entrada.isolacao,
          entrada.metodoInstalacao,
          secaoEscolhida,
          entrada.numCondutoresCarregados,
          entrada.material,
        )
        ampacidadeCorrigida = ampacidadeTabelada * fatorCorrecaoTotal
        queda = calcularQuedaTensao(
          entrada.tipoCircuito,
          entrada.distanciaM,
          correnteProjeto,
          secaoEscolhida,
          entrada.material,
          entrada.fatorPotencia,
          entrada.tensaoV,
        )
        criterioDeterminante = 'curtoCircuito'
        alertas.push({
          nivel: 'aviso',
          mensagem: `Seção elevada para ${secaoEscolhida} mm² por exigência de suportabilidade térmica ao curto-circuito.`,
        })
      }
    }
  }

  const margemFolgaPercent = ((ampacidadeCorrigida - correnteProjeto) / correnteProjeto) * 100
  if (margemFolgaPercent < 10) {
    alertas.push({
      nivel: 'aviso',
      mensagem: `A folga entre a corrente de projeto e a capacidade corrigida é de apenas ${margemFolgaPercent.toFixed(1)}% — considere a seção comercial seguinte se houver expectativa de aumento de carga.`,
    })
  }

  const disjuntorSugeridoA = sugerirDisjuntor(correnteProjeto, ampacidadeCorrigida)
  if (disjuntorSugeridoA === null) {
    alertas.push({
      nivel: 'erro',
      mensagem: 'Não foi possível coordenar um disjuntor padronizado que atenda Ib ≤ In ≤ Iz. Revise a seção ou a corrente de projeto.',
    })
  } else {
    memorial.push({
      titulo: '6. Coordenação com o dispositivo de proteção',
      descricao: `Disjuntor sugerido: In = ${disjuntorSugeridoA} A, satisfazendo Ib (${correnteProjeto.toFixed(2)} A) ≤ In (${disjuntorSugeridoA} A) ≤ Iz (${ampacidadeCorrigida.toFixed(1)} A). Corrente convencional de disparo (1,45×In = ${(1.45 * disjuntorSugeridoA).toFixed(1)} A) ≤ 1,45×Iz (${(1.45 * ampacidadeCorrigida).toFixed(1)} A).`,
      referenciaNormativa: 'NBR 5410 — 5.3.4 (proteção contra sobrecargas)',
    })
  }

  if (entrada.fatorPotencia < 0.7 || entrada.fatorPotencia > 1) {
    alertas.push({
      nivel: 'aviso',
      mensagem: `Fator de potência de ${entrada.fatorPotencia} está fora da faixa usual (0,7 a 1,0) — confira o valor informado.`,
    })
  }

  return {
    correnteProjeto,
    fatorTemperatura,
    fatorAgrupamento,
    fatorCorrecaoTotal,
    secaoEscolhida,
    ampacidadeTabelada,
    ampacidadeCorrigida,
    margemFolgaPercent,
    quedaTensaoV: queda.deltaV,
    quedaTensaoPercent: queda.deltaVPercent,
    quedaTensaoOk: queda.deltaVPercent <= entrada.quedaTensaoMaximaPercent,
    criterioDeterminante,
    disjuntorSugeridoA,
    secaoMinimaCurtoCircuito,
    alertas,
    memorial,
  }
}

export interface ComparativoMaterial {
  cobre: ResultadoDimensionamento
  aluminio: ResultadoDimensionamento
  custoCobre: number
  custoAluminio: number
  economiaAluminioPercent: number
}

export function compararCobreAluminio(entrada: EntradaCircuito): ComparativoMaterial {
  const cobre = dimensionarCabo({ ...entrada, material: 'cobre' })
  const aluminio = dimensionarCabo({ ...entrada, material: 'aluminio' })
  const custoCobre =
    cobre.secaoEscolhida * entrada.distanciaM * CUSTO_REFERENCIA_POR_MM2_METRO.cobre
  const custoAluminio =
    aluminio.secaoEscolhida * entrada.distanciaM * CUSTO_REFERENCIA_POR_MM2_METRO.aluminio
  return {
    cobre,
    aluminio,
    custoCobre,
    custoAluminio,
    economiaAluminioPercent: ((custoCobre - custoAluminio) / custoCobre) * 100,
  }
}

export function compararMetodosInstalacao(
  entrada: EntradaCircuito,
  metodos: MetodoInstalacao[],
): { metodo: MetodoInstalacao; resultado: ResultadoDimensionamento }[] {
  return metodos.map((metodo) => ({
    metodo,
    resultado: dimensionarCabo({ ...entrada, metodoInstalacao: metodo }),
  }))
}

export const QUEDAS_TENSAO_PADRAO = QUEDA_TENSAO_PADRAO
