import type { EstadoCRM, Interacao, Lead, Template } from './tipos'

let seq = 0
function id(p: string): string {
  seq += 1
  return `${p}_${seq.toString().padStart(3, '0')}`
}

function dataRelativa(diasAtras: number): string {
  const d = new Date()
  d.setDate(d.getDate() - diasAtras)
  return d.toISOString()
}

function dataFutura(diasFrente: number): string {
  const d = new Date()
  d.setDate(d.getDate() + diasFrente)
  return d.toISOString().slice(0, 10)
}

function inter(diasAtras: number, tipo: Interacao['tipo'], descricao: string): Interacao {
  return { id: id('int'), data: dataRelativa(diasAtras), tipo, descricao }
}

/** Modelos de mensagem de WhatsApp padrão (editáveis pelo usuário). */
export const TEMPLATES_PADRAO: Template[] = [
  {
    id: id('tpl'),
    titulo: 'Primeiro contato',
    texto:
      'Olá {primeiroNome}, tudo bem? Aqui é da Amper Energia 👋\n' +
      'Recebi seu contato sobre {produto}. Posso te enviar uma proposta sem compromisso?',
  },
  {
    id: id('tpl'),
    titulo: 'Solicitar conta de energia',
    texto:
      'Perfeito, {primeiroNome}! Para montar seu estudo de {produto} eu preciso da sua última conta de energia. ' +
      'Pode me mandar por aqui uma foto ou o PDF? 📄',
  },
  {
    id: id('tpl'),
    titulo: 'Proposta enviada',
    texto:
      'Prontinho, {primeiroNome}! Acabei de te enviar a proposta de {produto}. ' +
      'Qualquer dúvida sobre economia, prazo ou pagamento é só me chamar. 😉',
  },
  {
    id: id('tpl'),
    titulo: 'Follow-up (sem resposta)',
    texto:
      'Oi {primeiroNome}, passando para saber se conseguiu analisar a proposta. ' +
      'Consigo segurar as condições atuais por mais alguns dias — quer que eu te ligue rapidinho?',
  },
  {
    id: id('tpl'),
    titulo: 'Agendar visita técnica',
    texto:
      '{primeiroNome}, para fecharmos os detalhes do projeto consigo agendar uma visita técnica. ' +
      'Qual o melhor dia e horário para você esta semana?',
  },
]

const LEADS: Lead[] = [
  {
    id: id('lead'),
    nome: 'Carlos Menezes',
    telefone: '5548999112233',
    empresa: 'Metalúrgica Menezes',
    cidade: 'Joinville',
    produto: 'FV',
    origem: 'WhatsApp',
    etapa: 'proposta',
    temperatura: 'quente',
    valorEstimado: 185000,
    responsavel: 'Amilcare',
    observacoes: 'Conta de ~R$ 9 mil/mês. Quer reduzir custo de demanda. Decisor direto.',
    proximoContato: dataFutura(1),
    tags: ['industrial', 'media-tensao'],
    interacoes: [
      inter(6, 'mensagem', 'Chegou pelo WhatsApp pedindo orçamento de solar.'),
      inter(5, 'proposta', 'Enviei a conta para análise e recebi a fatura.'),
      inter(2, 'proposta', 'Proposta de 132 kWp enviada — payback 3,8 anos.'),
    ],
    criadoEm: dataRelativa(6),
    atualizadoEm: dataRelativa(2),
  },
  {
    id: id('lead'),
    nome: 'Fernanda Alves',
    telefone: '5547988776655',
    empresa: 'Padaria Pão Nosso',
    cidade: 'Florianópolis',
    produto: 'FV',
    origem: 'Indicacao',
    etapa: 'negociacao',
    temperatura: 'quente',
    valorEstimado: 62000,
    responsavel: 'Amilcare',
    observacoes: 'Indicada pelo Carlos. Negociando forma de pagamento (financiamento x à vista).',
    proximoContato: dataFutura(0),
    tags: ['comercial'],
    interacoes: [
      inter(9, 'mensagem', 'Primeiro contato — indicação de cliente.'),
      inter(7, 'proposta', 'Proposta de 40 kWp enviada.'),
      inter(3, 'ligacao', 'Ligação: gostou, quer financiar em 60x.'),
    ],
    criadoEm: dataRelativa(9),
    atualizadoEm: dataRelativa(3),
  },
  {
    id: id('lead'),
    nome: 'Roberto Kummer',
    telefone: '5549991234567',
    cidade: 'Chapecó',
    produto: 'Usina',
    origem: 'Instagram',
    etapa: 'qualificado',
    temperatura: 'morno',
    valorEstimado: 480000,
    responsavel: 'Amilcare',
    observacoes: 'Investidor buscando usina de investimento (~R$0,55/kWh PPA). Perfil aderente.',
    proximoContato: dataFutura(3),
    tags: ['investidor'],
    interacoes: [
      inter(4, 'mensagem', 'Perguntou sobre rentabilidade de usina solar.'),
      inter(3, 'nota', 'Explicado modelo de PPA e TIR ~18%.'),
    ],
    criadoEm: dataRelativa(4),
    atualizadoEm: dataRelativa(3),
  },
  {
    id: id('lead'),
    nome: 'Juliana Ramos',
    telefone: '5548996549871',
    empresa: 'Condomínio Solar Ville',
    cidade: 'Palhoça',
    produto: 'EVSE',
    origem: 'Site',
    etapa: 'novo',
    temperatura: 'morno',
    valorEstimado: 28000,
    responsavel: 'Amilcare',
    observacoes: 'Síndica querendo carregadores para o condomínio. Enviar viabilidade RE6001.',
    proximoContato: dataFutura(-1),
    tags: ['condominio', 'evse'],
    interacoes: [inter(1, 'mensagem', 'Preencheu formulário do site sobre carregador veicular.')],
    criadoEm: dataRelativa(1),
    atualizadoEm: dataRelativa(1),
  },
  {
    id: id('lead'),
    nome: 'Marcos Bianchi',
    telefone: '5547997001122',
    empresa: 'Supermercado Bianchi',
    cidade: 'Blumenau',
    produto: 'BESS',
    origem: 'WhatsApp',
    etapa: 'novo',
    temperatura: 'frio',
    valorEstimado: 95000,
    responsavel: 'Amilcare',
    observacoes: 'Interessado em baterias para horário de ponta. Ainda avaliando.',
    proximoContato: dataFutura(5),
    tags: ['comercial', 'bess'],
    interacoes: [inter(2, 'mensagem', 'Perguntou sobre baterias para reduzir conta na ponta.')],
    criadoEm: dataRelativa(2),
    atualizadoEm: dataRelativa(2),
  },
  {
    id: id('lead'),
    nome: 'Ana Paula Souza',
    telefone: '5548998887766',
    empresa: 'Clínica Vida',
    cidade: 'São José',
    produto: 'FV',
    origem: 'Indicacao',
    etapa: 'ganho',
    temperatura: 'quente',
    valorEstimado: 74000,
    responsavel: 'Amilcare',
    observacoes: 'Fechado! Sistema de 48 kWp. Assinou contrato.',
    tags: ['comercial', 'fechado'],
    interacoes: [
      inter(20, 'mensagem', 'Contato inicial por indicação.'),
      inter(15, 'proposta', 'Proposta enviada.'),
      inter(5, 'reuniao', 'Visita técnica realizada.'),
      inter(1, 'nota', 'Contrato assinado. 🎉'),
    ],
    criadoEm: dataRelativa(20),
    atualizadoEm: dataRelativa(1),
  },
  {
    id: id('lead'),
    nome: 'Pedro Lima',
    telefone: '5549993334455',
    cidade: 'Lages',
    produto: 'FV',
    origem: 'Google',
    etapa: 'perdido',
    temperatura: 'frio',
    valorEstimado: 41000,
    responsavel: 'Amilcare',
    observacoes: 'Fechou com concorrente por preço.',
    motivoPerda: 'Preço — concorrente mais barato',
    tags: ['residencial'],
    interacoes: [
      inter(25, 'mensagem', 'Pediu orçamento pelo Google.'),
      inter(18, 'proposta', 'Proposta enviada.'),
      inter(10, 'nota', 'Optou por concorrente.'),
    ],
    criadoEm: dataRelativa(25),
    atualizadoEm: dataRelativa(10),
  },
]

export function estadoInicial(): EstadoCRM {
  return {
    leads: LEADS.map((l) => ({ ...l, tags: [...l.tags], interacoes: l.interacoes.map((i) => ({ ...i })) })),
    templates: TEMPLATES_PADRAO.map((t) => ({ ...t })),
  }
}

export function estadoVazio(): EstadoCRM {
  return {
    leads: [],
    templates: TEMPLATES_PADRAO.map((t) => ({ ...t })),
  }
}
