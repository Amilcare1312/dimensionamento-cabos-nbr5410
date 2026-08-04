# CRM de Leads · WhatsApp

Aplicativo web para gerenciar **leads qualificados que chegam pelo WhatsApp** —
pensado para o dia a dia comercial de energia solar / BESS / EVSE, mas útil para
qualquer operação de vendas consultivas. Organiza os contatos em um funil,
lembra dos follow-ups e mantém todo o histórico de conversas de cada lead.

Tudo roda no navegador — **não há backend nem servidor**. Os dados são
persistidos em `localStorage` e podem ser exportados/importados (JSON) ou
exportados em CSV para o Excel. A lógica de métricas fica em
[`src/crm/calculos.ts`](src/crm/calculos.ts), separada da interface.

> A integração com o WhatsApp usa os links oficiais **click-to-chat** (`wa.me`):
> ao clicar em "Abrir no WhatsApp", a conversa abre já com a mensagem
> pré-preenchida (WhatsApp Web ou app). Não é necessária a API oficial nem
> nenhuma credencial.

## Funcionalidades

- **Dashboard** com KPIs (leads em aberto, valor no pipeline, taxa de conversão,
  valor ganho e ticket médio), funil de vendas, distribuição por origem e por
  produto (gráficos de rosca em SVG puro) e a lista de **follow-ups do dia**.
- **Pipeline (Kanban)** com 6 etapas — Novo, Qualificado, Proposta enviada,
  Negociação, Ganho e Perdido. Arraste os cartões entre colunas para mover o
  lead no funil; cada mudança fica registrada no histórico.
- **Lista de leads** com busca (nome, empresa, cidade, tag), filtros por etapa e
  produto, e ordenação por recência, valor ou urgência de follow-up. Exportação
  em CSV.
- **Detalhe do lead** com:
  - envio de WhatsApp com **modelos de mensagem** e variáveis preenchidas
    automaticamente (`{primeiroNome}`, `{empresa}`, `{produto}`…);
  - **linha do tempo** de interações (mensagens, ligações, reuniões, propostas,
    notas), com registro rápido;
  - mudança de etapa em um clique e agendamento do próximo contato.
- **Modelos de mensagem** editáveis para padronizar a abordagem no WhatsApp.
- **Temperatura** do lead (🔥 quente / 🌤️ morno / ❄️ frio), tags livres, valor
  estimado do negócio e motivo de perda.
- Backup/restauração (JSON), exportação CSV, dados de exemplo e limpar tudo.
- Modo claro/escuro e layout responsivo (Kanban, tabela e cartões no celular).

## Estrutura

```
src/crm/
  tipos.ts            # modelo de dados (Lead, Etapa, Interacao, Template…)
  calculos.ts         # métricas do dashboard e pendências de follow-up
  whatsapp.ts         # links wa.me, normalização de telefone, templates
  formatar.ts         # moeda, datas relativas, telefone, iniciais
  armazenamento.ts    # localStorage, import/export JSON e CSV
  dadosIniciais.ts    # leads de exemplo e modelos de mensagem padrão
  AppCRM.tsx          # shell (abas, modais, estado)
  components/         # Dashboard, Pipeline, ListaLeads, DetalheLead, ...
```

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
