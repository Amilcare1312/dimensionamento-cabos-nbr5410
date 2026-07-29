# Controle Financeiro

Aplicativo web para controle financeiro de uma pequena empresa, com escrituração
por **partidas dobradas**. Reproduz e amplia a planilha
`Planilha_financeira_com_diario.xlsx`: o **Diário** é a entrada única de dados e
alimenta automaticamente as Contas a Pagar, Contas a Receber, o Fluxo de Caixa e
o **Dashboard**.

Tudo roda no navegador — não há backend. Os dados são persistidos em
`localStorage` e podem ser exportados/importados em JSON. A lógica contábil
(agregações, status, fluxo de caixa) fica em
[`src/financeiro/calculos.ts`](src/financeiro/calculos.ts), separada da interface.

## Funcionalidades

- **Preenchimento guiado**: escolha o tipo de transação (compra/despesa a prazo,
  pagamento a fornecedor, venda/serviço a prazo, recebimento de cliente, despesa
  ou receita à vista, folha de pagamento) e as partidas de débito/crédito são
  geradas automaticamente. Há também um modo manual avançado para lançar partidas
  livremente, sempre validando débito = crédito.
- **Diário de lançamentos** com busca e remoção, exibindo cada partida contábil.
- **Contas a Pagar** — consolidadas por fornecedor/categoria (contas 2.1.1, 2.1.2,
  2.1.3), com saldo, próximo vencimento e status (Pago / Pendente / Vencido).
- **Contas a Receber** — consolidadas por cliente (conta 1.1.3), com status
  (Recebido / Pendente / Vencido).
- **Fluxo de Caixa** mensal em regime de caixa (conta 1.1.2), classificado por
  categoria, com resultado do período e saldo acumulado; saldo inicial ajustável.
- **Dashboard** com KPIs (total a pagar/receber, saldo de caixa e resultado do
  mês), gráfico de barras entradas × saídas com linha de saldo, distribuição por
  status (rosca) e rankings das maiores contas.
- **Plano de contas** de referência.
- Exportar/importar dados (JSON), carregar dados de exemplo, limpar tudo.
- Modo claro/escuro e layout responsivo.

## Modelo contábil

Cada transação é um lançamento com 2 ou mais linhas balanceadas (Σdébitos =
Σcréditos). Os relatórios são derivados dos lançamentos:

| Relatório          | Conta base        | Débito significa      | Crédito significa      |
| ------------------ | ----------------- | --------------------- | ---------------------- |
| Contas a Pagar     | 2.1.1/2.1.2/2.1.3 | pagamento efetuado    | obrigação incorrida    |
| Contas a Receber   | 1.1.3             | NF emitida            | recebimento            |
| Fluxo de Caixa     | 1.1.2             | entrada de caixa      | saída de caixa         |

No Fluxo de Caixa, a categoria (`Categ. FC`) é registrada na linha da conta 1.1.2.

## Desenvolvimento

```bash
npm install
npm run dev      # servidor de desenvolvimento
npm test         # testes unitários (vitest)
npm run build    # build de produção
npm run lint     # oxlint
```

## Licença

Copyright (c) 2026 Amilcare. Todos os direitos reservados. O código-fonte está
publicamente visível para consulta, mas seu uso, cópia, modificação ou
redistribuição não são permitidos sem autorização — veja [LICENSE](LICENSE).
