import type { EntradaCircuito, ResultadoDimensionamento } from './calculos'
import { ROTULO_CRITERIO } from './rotulos'
import { METODOS_INSTALACAO } from './tabelas'

const ROTULO_TIPO_CIRCUITO: Record<EntradaCircuito['tipoCircuito'], string> = {
  monofasico: 'Monofásico',
  bifasico: 'Bifásico',
  trifasico: 'Trifásico',
}

const ROTULO_ISOLACAO: Record<EntradaCircuito['isolacao'], string> = {
  PVC: 'PVC (70°C)',
  EPR_XLPE: 'EPR/XLPE (90°C)',
}

export async function exportarMemorialPDF(entrada: EntradaCircuito, resultado: ResultadoDimensionamento) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const margem = 15
  let y = margem
  const larguraUtil = doc.internal.pageSize.getWidth() - margem * 2

  function quebrarPagina(alturaNecessaria: number) {
    if (y + alturaNecessaria > doc.internal.pageSize.getHeight() - margem) {
      doc.addPage()
      y = margem
    }
  }

  function titulo(texto: string, tamanho = 14) {
    quebrarPagina(10)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(tamanho)
    doc.text(texto, margem, y)
    y += tamanho / 2 + 3
  }

  function paragrafo(texto: string, tamanho = 10) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(tamanho)
    const linhas = doc.splitTextToSize(texto, larguraUtil)
    quebrarPagina(linhas.length * 5 + 2)
    doc.text(linhas, margem, y)
    y += linhas.length * 5 + 2
  }

  function linhaChaveValor(chave: string, valor: string) {
    quebrarPagina(6)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9.5)
    doc.text(chave, margem, y)
    doc.setFont('helvetica', 'normal')
    doc.text(valor, margem + 65, y)
    y += 5.5
  }

  titulo('Memorial de Cálculo — Dimensionamento de Condutor', 15)
  paragrafo(`Circuito: ${entrada.nome || 'sem identificação'}    |    Norma de referência: ABNT NBR 5410:2004`)
  doc.setDrawColor(180)
  doc.line(margem, y, margem + larguraUtil, y)
  y += 6

  titulo('1. Dados de entrada', 12)
  const metodoInfo = METODOS_INSTALACAO.find((m) => m.codigo === entrada.metodoInstalacao)
  linhaChaveValor('Tipo de circuito', ROTULO_TIPO_CIRCUITO[entrada.tipoCircuito])
  linhaChaveValor('Tensão nominal', `${entrada.tensaoV} V`)
  linhaChaveValor('Fator de potência', `${entrada.fatorPotencia}`)
  linhaChaveValor('Distância (ida)', `${entrada.distanciaM} m`)
  linhaChaveValor('Método de instalação', `${entrada.metodoInstalacao} — ${metodoInfo?.nome ?? ''}`)
  linhaChaveValor('Isolação', ROTULO_ISOLACAO[entrada.isolacao])
  linhaChaveValor('Material do condutor', entrada.material === 'cobre' ? 'Cobre' : 'Alumínio')
  linhaChaveValor('Condutores carregados', `${entrada.numCondutoresCarregados}`)
  linhaChaveValor('Temperatura ambiente', `${entrada.temperaturaAmbienteC} °C`)
  linhaChaveValor('Circuitos agrupados', `${entrada.numCircuitosAgrupados}`)
  linhaChaveValor('Queda de tensão máxima admissível', `${entrada.quedaTensaoMaximaPercent}%`)
  if (entrada.correnteCurtoCircuitoKA) {
    linhaChaveValor('Corrente de curto-circuito', `${entrada.correnteCurtoCircuitoKA} kA`)
    linhaChaveValor('Tempo de atuação da proteção', `${entrada.tempoAtuacaoS} s`)
  }
  y += 2

  titulo('2. Resultado do dimensionamento', 12)
  linhaChaveValor('Corrente de projeto (Ib)', `${resultado.correnteProjeto.toFixed(2)} A`)
  linhaChaveValor('Seção recomendada', `${resultado.secaoEscolhida} mm²`)
  linhaChaveValor('Capacidade tabelada', `${resultado.ampacidadeTabelada.toFixed(1)} A`)
  linhaChaveValor('Fator de correção total', `${resultado.fatorCorrecaoTotal.toFixed(3)}`)
  linhaChaveValor('Capacidade corrigida (Iz)', `${resultado.ampacidadeCorrigida.toFixed(1)} A`)
  linhaChaveValor('Margem de folga', `${resultado.margemFolgaPercent.toFixed(1)}%`)
  linhaChaveValor('Queda de tensão calculada', `${resultado.quedaTensaoV.toFixed(2)} V (${resultado.quedaTensaoPercent.toFixed(2)}%)`)
  linhaChaveValor('Situação da queda de tensão', resultado.quedaTensaoOk ? 'Dentro do limite' : 'FORA DO LIMITE')
  linhaChaveValor('Critério determinante da seção', ROTULO_CRITERIO[resultado.criterioDeterminante])
  linhaChaveValor('Disjuntor sugerido', resultado.disjuntorSugeridoA ? `${resultado.disjuntorSugeridoA} A` : 'não coordenado')
  if (resultado.secaoMinimaCurtoCircuito) {
    linhaChaveValor('Seção mínima por curto-circuito', `${resultado.secaoMinimaCurtoCircuito.toFixed(2)} mm²`)
  }
  y += 2

  if (resultado.alertas.length > 0) {
    titulo('3. Alertas', 12)
    for (const alerta of resultado.alertas) {
      paragrafo(`[${alerta.nivel.toUpperCase()}] ${alerta.mensagem}`)
    }
    y += 1
  }

  titulo(`${resultado.alertas.length > 0 ? '4' : '3'}. Memorial de cálculo passo a passo`, 12)
  for (const passo of resultado.memorial) {
    quebrarPagina(14)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10.5)
    const linhasTitulo = doc.splitTextToSize(passo.titulo, larguraUtil)
    doc.text(linhasTitulo, margem, y)
    y += linhasTitulo.length * 5
    paragrafo(passo.descricao, 9.5)
    if (passo.referenciaNormativa) {
      doc.setFont('helvetica', 'italic')
      doc.setFontSize(8.5)
      doc.setTextColor(110)
      const linhasRef = doc.splitTextToSize(`Referência: ${passo.referenciaNormativa}`, larguraUtil)
      quebrarPagina(linhasRef.length * 4.5)
      doc.text(linhasRef, margem, y)
      doc.setTextColor(0)
      y += linhasRef.length * 4.5 + 3
    }
  }

  quebrarPagina(24)
  doc.setDrawColor(180)
  doc.line(margem, y, margem + larguraUtil, y)
  y += 6
  doc.setFont('helvetica', 'bolditalic')
  doc.setFontSize(9)
  paragrafo(
    'AVISO: Este relatório é uma ferramenta de apoio ao dimensionamento e utiliza tabelas de referência digitalizadas a partir da ABNT NBR 5410. Ele não substitui a responsabilidade técnica de um engenheiro eletricista habilitado, que deve validar todos os valores, premissas e resultados antes de sua aplicação em projeto executivo.',
    8.5,
  )

  const nomeArquivo = `memorial-${(entrada.nome || 'circuito').toLowerCase().replace(/[^a-z0-9]+/g, '-')}.pdf`
  doc.save(nomeArquivo)
}
