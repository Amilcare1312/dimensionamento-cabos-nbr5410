import { describe, expect, it } from 'vitest'
import {
  calcularCorrenteProjeto,
  calcularQuedaTensao,
  calcularSecaoMinimaCurtoCircuito,
  dimensionarCabo,
  obterAmpacidadeTabelada,
  obterFatorAgrupamento,
  obterFatorTemperatura,
  sugerirDisjuntor,
  type EntradaCircuito,
} from './calculos'

function entradaBase(overrides: Partial<EntradaCircuito> = {}): EntradaCircuito {
  return {
    nome: 'Circuito de teste',
    modoEntradaCorrente: 'corrente',
    correnteProjetoA: 20,
    tensaoV: 220,
    fatorPotencia: 0.92,
    tipoCircuito: 'monofasico',
    distanciaM: 15,
    metodoInstalacao: 'B1',
    isolacao: 'PVC',
    material: 'cobre',
    numCondutoresCarregados: 2,
    temperaturaAmbienteC: 30,
    numCircuitosAgrupados: 1,
    quedaTensaoMaximaPercent: 4,
    finalidade: 'outro',
    ...overrides,
  }
}

describe('calcularCorrenteProjeto', () => {
  it('retorna a corrente informada diretamente quando modoEntradaCorrente = corrente', () => {
    expect(calcularCorrenteProjeto(entradaBase({ correnteProjetoA: 12.3 }))).toBe(12.3)
  })

  it('calcula a corrente monofásica a partir de potência ativa: I = P / (V × cosφ)', () => {
    const i = calcularCorrenteProjeto(
      entradaBase({
        modoEntradaCorrente: 'potencia',
        modoPotencia: 'ativa',
        potencia: 2000,
        tensaoV: 220,
        fatorPotencia: 0.92,
      }),
    )
    expect(i).toBeCloseTo(2000 / (220 * 0.92), 5)
  })

  it('calcula a corrente trifásica a partir de potência ativa: I = P / (√3 × V × cosφ)', () => {
    const i = calcularCorrenteProjeto(
      entradaBase({
        tipoCircuito: 'trifasico',
        modoEntradaCorrente: 'potencia',
        modoPotencia: 'ativa',
        potencia: 15000,
        tensaoV: 380,
        fatorPotencia: 0.85,
      }),
    )
    expect(i).toBeCloseTo(15000 / (Math.sqrt(3) * 380 * 0.85), 5)
  })

  it('usa cosφ = 1 quando a potência informada é aparente (VA)', () => {
    const i = calcularCorrenteProjeto(
      entradaBase({
        modoEntradaCorrente: 'potencia',
        modoPotencia: 'aparente',
        potencia: 2200,
        tensaoV: 220,
        fatorPotencia: 0.92,
      }),
    )
    expect(i).toBeCloseTo(10, 5)
  })
})

describe('tabelas de correção', () => {
  it('fator de temperatura PVC ao ar é 1,00 na referência de 30°C', () => {
    expect(obterFatorTemperatura('PVC', 'ar', 30)).toBe(1.0)
  })

  it('fator de temperatura PVC ao ar a 40°C é 0,87 (Tabela 40)', () => {
    expect(obterFatorTemperatura('PVC', 'ar', 40)).toBe(0.87)
  })

  it('fator de agrupamento para 3 circuitos é 0,70 (Tabela 42)', () => {
    expect(obterFatorAgrupamento(3)).toBe(0.7)
  })

  it('fator de agrupamento para 1 circuito é 1,00', () => {
    expect(obterFatorAgrupamento(1)).toBe(1.0)
  })

  it('fator de agrupamento usa o último patamar para valores muito altos', () => {
    expect(obterFatorAgrupamento(50)).toBe(0.38)
  })
})

describe('obterAmpacidadeTabelada', () => {
  it('confere o valor de referência da Tabela 36 (B1, PVC, cobre, 2,5 mm², 2 condutores) = 24 A', () => {
    expect(obterAmpacidadeTabelada('PVC', 'B1', 2.5, 2, 'cobre')).toBe(24)
  })

  it('confere o valor de referência da Tabela 36 (B1, PVC, cobre, 2,5 mm², 3 condutores) = 21 A', () => {
    expect(obterAmpacidadeTabelada('PVC', 'B1', 2.5, 3, 'cobre')).toBe(21)
  })

  it('alumínio tem ampacidade reduzida em relação ao cobre na mesma seção', () => {
    const cobre = obterAmpacidadeTabelada('PVC', 'B1', 10, 2, 'cobre')
    const aluminio = obterAmpacidadeTabelada('PVC', 'B1', 10, 2, 'aluminio')
    expect(aluminio).toBeLessThan(cobre)
  })
})

describe('calcularQuedaTensao', () => {
  it('aplica o multiplicador 2 para circuitos monofásicos', () => {
    const { deltaV } = calcularQuedaTensao('monofasico', 100, 20, 2.5, 'cobre', 0.92, 220)
    // ΔV = 2 × L × I × (R·cosφ + X·senφ) / 1000
    const r = 8.87
    const x = 0.156
    const senPhi = Math.sqrt(1 - 0.92 * 0.92)
    const esperado = (2 * 100 * 20 * (r * 0.92 + x * senPhi)) / 1000
    expect(deltaV).toBeCloseTo(esperado, 6)
  })

  it('aplica o multiplicador √3 para circuitos trifásicos', () => {
    const { deltaV } = calcularQuedaTensao('trifasico', 100, 20, 2.5, 'cobre', 0.92, 380)
    const r = 8.87
    const x = 0.156
    const senPhi = Math.sqrt(1 - 0.92 * 0.92)
    const esperado = (Math.sqrt(3) * 100 * 20 * (r * 0.92 + x * senPhi)) / 1000
    expect(deltaV).toBeCloseTo(esperado, 6)
  })
})

describe('calcularSecaoMinimaCurtoCircuito', () => {
  it('Smin = (Icc × √t) / k', () => {
    // 5 kA, 0,2 s, cobre/PVC (k=115)
    const smin = calcularSecaoMinimaCurtoCircuito('cobre', 'PVC', 5, 0.2)
    expect(smin).toBeCloseTo((5000 * Math.sqrt(0.2)) / 115, 6)
  })
})

describe('sugerirDisjuntor', () => {
  it('escolhe o menor disjuntor padronizado ≥ Ib e ≤ Iz', () => {
    expect(sugerirDisjuntor(18, 24)).toBe(20)
  })

  it('retorna null quando nenhum disjuntor padronizado atende Ib ≤ In ≤ Iz', () => {
    expect(sugerirDisjuntor(23, 24)).toBeNull()
  })
})

describe('dimensionarCabo — casos de referência', () => {
  it('dimensiona um circuito simples de 20 A, B1/PVC/cobre, sem restrição de queda de tensão', () => {
    const r = dimensionarCabo(entradaBase({ correnteProjetoA: 20, distanciaM: 5 }))
    // 1,5mm² (17,5A) não atende; 2,5mm² (24A) atende
    expect(r.secaoEscolhida).toBe(2.5)
    expect(r.criterioDeterminante).toBe('corrente')
    expect(r.quedaTensaoOk).toBe(true)
  })

  it('eleva a seção quando a queda de tensão é o fator limitante em distâncias longas', () => {
    const curto = dimensionarCabo(entradaBase({ correnteProjetoA: 20, distanciaM: 5 }))
    const longo = dimensionarCabo(entradaBase({ correnteProjetoA: 20, distanciaM: 150 }))
    expect(longo.secaoEscolhida).toBeGreaterThan(curto.secaoEscolhida)
    expect(longo.criterioDeterminante).toBe('quedaTensao')
    expect(longo.quedaTensaoOk).toBe(true)
  })

  it('nunca sugere seção abaixo de 1,5 mm² para circuitos de iluminação', () => {
    const r = dimensionarCabo(
      entradaBase({ correnteProjetoA: 2, distanciaM: 3, finalidade: 'iluminacao' }),
    )
    expect(r.secaoEscolhida).toBeGreaterThanOrEqual(1.5)
  })

  it('nunca sugere seção abaixo de 2,5 mm² para circuitos de tomadas de uso geral', () => {
    const r = dimensionarCabo(
      entradaBase({ correnteProjetoA: 8, distanciaM: 3, finalidade: 'tomadas' }),
    )
    expect(r.secaoEscolhida).toBeGreaterThanOrEqual(2.5)
    // com 8A, a capacidade de corrente já indicaria 1,5mm² (17,5A) — a norma eleva para 2,5mm²
    expect(r.alertas.some((a) => a.mensagem.includes('seção mínima'))).toBe(true)
  })

  it('aplica o fator de agrupamento reduzindo a ampacidade corrigida', () => {
    const semAgrupamento = dimensionarCabo(entradaBase({ numCircuitosAgrupados: 1 }))
    const comAgrupamento = dimensionarCabo(entradaBase({ numCircuitosAgrupados: 6 }))
    expect(comAgrupamento.ampacidadeCorrigida).toBeLessThan(semAgrupamento.ampacidadeCorrigida)
  })

  it('eleva a seção quando a corrente de curto-circuito exige maior suportabilidade térmica', () => {
    const semCC = dimensionarCabo(entradaBase({ correnteProjetoA: 10, distanciaM: 5 }))
    const comCC = dimensionarCabo(
      entradaBase({
        correnteProjetoA: 10,
        distanciaM: 5,
        correnteCurtoCircuitoKA: 15,
        tempoAtuacaoS: 1,
      }),
    )
    expect(comCC.secaoEscolhida).toBeGreaterThanOrEqual(semCC.secaoEscolhida)
    expect(comCC.secaoMinimaCurtoCircuito).not.toBeNull()
  })

  it('alerta quando o tempo de atuação do curto-circuito é irrealisticamente longo (> 5 s)', () => {
    const r = dimensionarCabo(
      entradaBase({
        correnteProjetoA: 45,
        numCondutoresCarregados: 3,
        correnteCurtoCircuitoKA: 5,
        tempoAtuacaoS: 45,
      }),
    )
    expect(r.alertas.some((a) => a.mensagem.includes('incomum para curto-circuito'))).toBe(true)
  })

  it('não alerta sobre tempo de atuação quando ele está na faixa realista (≤ 5 s)', () => {
    const r = dimensionarCabo(
      entradaBase({
        correnteProjetoA: 45,
        numCondutoresCarregados: 3,
        correnteCurtoCircuitoKA: 5,
        tempoAtuacaoS: 1,
      }),
    )
    expect(r.alertas.some((a) => a.mensagem.includes('incomum para curto-circuito'))).toBe(false)
  })

  it('emite alerta quando a margem de folga da ampacidade é menor que 10%', () => {
    // corrente bem próxima da ampacidade de 2,5mm² (24A)
    const r = dimensionarCabo(entradaBase({ correnteProjetoA: 23, distanciaM: 5 }))
    expect(r.alertas.some((a) => a.mensagem.toLowerCase().includes('folga'))).toBe(true)
  })
})
