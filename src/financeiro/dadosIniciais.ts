import type { EstadoFinanceiro, Lancamento } from './tipos'

let seq = 0
function id(): string {
  seq += 1
  return `seed_${seq.toString().padStart(3, '0')}`
}

// Ajuda a montar um lançamento de 2 linhas (débito + crédito).
function par(
  data: string,
  noDoc: string,
  historico: string,
  debito: { cod: string; valor: number; parte?: string; venc?: string; categFC?: string },
  credito: { cod: string; valor: number; parte?: string; venc?: string; categFC?: string },
): Lancamento {
  return {
    id: id(),
    data,
    noDoc,
    historico,
    ref: noDoc,
    linhas: [
      {
        codConta: debito.cod,
        debito: debito.valor,
        credito: 0,
        parte: debito.parte,
        vencimento: debito.venc,
        categFC: debito.categFC,
      },
      {
        codConta: credito.cod,
        debito: 0,
        credito: credito.valor,
        parte: credito.parte,
        vencimento: credito.venc,
        categFC: credito.categFC,
      },
    ],
  }
}

// Lançamentos de exemplo (maio/2026) — mesmos dados da planilha original,
// servem de demonstração e podem ser removidos pelo usuário.
const LANCAMENTOS: Lancamento[] = [
  par('2026-05-01', 'NF-001', 'Aluguel maio/2026',
    { cod: '4.2.2', valor: 4500, parte: 'Aluguel Comercial Ltda', venc: '2026-05-05' },
    { cod: '2.1.1', valor: 4500, parte: 'Aluguel Comercial Ltda', venc: '2026-05-05' }),
  par('2026-05-02', 'PAG-001', 'Pagto aluguel mai/2026',
    { cod: '2.1.1', valor: 4500, parte: 'Aluguel Comercial Ltda' },
    { cod: '1.1.2', valor: 4500, parte: 'Aluguel Comercial Ltda', categFC: 'Aluguel' }),
  par('2026-05-05', 'NF-002', 'Energia elet. maio/2026',
    { cod: '4.2.3', valor: 850, parte: 'Energia Sul S.A.', venc: '2026-05-10' },
    { cod: '2.1.1', valor: 850, parte: 'Energia Sul S.A.', venc: '2026-05-10' }),
  par('2026-05-09', 'PAG-002', 'Pagto energia mai/2026',
    { cod: '2.1.1', valor: 850, parte: 'Energia Sul S.A.' },
    { cod: '1.1.2', valor: 850, parte: 'Energia Sul S.A.', categFC: 'Energia Eletrica' }),
  par('2026-05-01', 'NF-CR01', 'Servicos - Cliente Alpha Ltda',
    { cod: '1.1.3', valor: 8500, parte: 'Cliente Alpha Ltda', venc: '2026-06-01' },
    { cod: '3.1.2', valor: 8500, parte: 'Cliente Alpha Ltda', venc: '2026-06-01' }),
  par('2026-05-08', 'REC-001', 'Recebto Cliente Alpha Ltda',
    { cod: '1.1.2', valor: 8500, parte: 'Cliente Alpha Ltda', categFC: 'Receitas de Servicos' },
    { cod: '1.1.3', valor: 8500, parte: 'Cliente Alpha Ltda' }),
  par('2026-05-05', 'NF-CR02', 'Venda produtos - Beta Comercio S.A.',
    { cod: '1.1.3', valor: 15000, parte: 'Beta Comercio S.A.', venc: '2026-05-20' },
    { cod: '3.1.1', valor: 15000, parte: 'Beta Comercio S.A.', venc: '2026-05-20' }),
  par('2026-05-10', 'REC-002', 'Recebto Beta Comercio S.A.',
    { cod: '1.1.2', valor: 15000, parte: 'Beta Comercio S.A.', categFC: 'Receitas de Produtos' },
    { cod: '1.1.3', valor: 15000, parte: 'Beta Comercio S.A.' }),
  par('2026-05-05', 'FP-001', 'Folha pagto mai/2026',
    { cod: '4.2.1', valor: 12000, parte: 'Folha de Pagamento', venc: '2026-05-05' },
    { cod: '2.1.2', valor: 12000, parte: 'Folha de Pagamento', venc: '2026-05-05' }),
  par('2026-05-05', 'PAG-003', 'Pagto folha mai/2026',
    { cod: '2.1.2', valor: 12000, parte: 'Folha de Pagamento' },
    { cod: '1.1.2', valor: 12000, parte: 'Folha de Pagamento', categFC: 'Folha de Pagamento' }),
  par('2026-05-10', 'NF-CR03', 'Consultoria - Gamma Industria',
    { cod: '1.1.3', valor: 6200, parte: 'Gamma Industria', venc: '2026-05-15' },
    { cod: '3.1.2', valor: 6200, parte: 'Gamma Industria', venc: '2026-05-15' }),
  par('2026-05-18', 'NF-003', 'Camp. marketing mai/2026',
    { cod: '4.2.5', valor: 2500, parte: 'Marketing Digital Co.', venc: '2026-05-20' },
    { cod: '2.1.1', valor: 2500, parte: 'Marketing Digital Co.', venc: '2026-05-20' }),
  par('2026-03-15', 'NF-OLD', 'Licenca ERP - Software Cloud',
    { cod: '4.2.6', valor: 980, parte: 'Software Cloud Inc.', venc: '2026-04-30' },
    { cod: '2.1.1', valor: 980, parte: 'Software Cloud Inc.', venc: '2026-04-30' }),
  par('2026-05-12', 'TAR-001', 'Tarifas bancarias mai/2026',
    { cod: '4.3.2', valor: 120 },
    { cod: '1.1.2', valor: 120, categFC: 'Tarifas Bancarias' }),
  par('2026-05-31', 'AJU-001', 'Depreciacao mai/2026',
    { cod: '4.2.7', valor: 1200 },
    { cod: '1.2.2', valor: 1200 }),
]

export function estadoInicial(): EstadoFinanceiro {
  return {
    ano: 2026,
    saldoInicial: 0,
    lancamentos: LANCAMENTOS.map((l) => ({
      ...l,
      linhas: l.linhas.map((li) => ({ ...li })),
    })),
  }
}

export function estadoVazio(ano = new Date().getFullYear()): EstadoFinanceiro {
  return { ano, saldoInicial: 0, lancamentos: [] }
}
