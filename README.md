# Dimensionamento de Cabos — NBR 5410

Aplicativo web para dimensionamento de condutores elétricos de baixa tensão
conforme a ABNT NBR 5410:2004. Calcula a seção mínima do condutor a partir da
corrente de projeto (ou da potência da carga), verifica a queda de tensão em
função da distância do circuito, sugere o disjuntor de proteção coordenado e
verifica a suportabilidade térmica em curto-circuito.

Todo o cálculo roda no navegador — não há backend. As tabelas técnicas
(ampacidade, fatores de correção de temperatura e agrupamento, impedância dos
cabos) ficam em [`src/lib/tabelas.ts`](src/lib/tabelas.ts), separadas da
lógica de cálculo em [`src/lib/calculos.ts`](src/lib/calculos.ts).

> **Aviso:** os resultados são um apoio ao dimensionamento e não substituem a
> responsabilidade técnica de um engenheiro eletricista habilitado. Os valores
> tabelados foram digitalizados a partir de fontes técnicas públicas — confira
> a edição vigente da norma antes de aplicar em projeto executivo.

## Funcionalidades

- Corrente de projeto a partir de corrente direta ou de potência (ativa/aparente) × tensão × fator de potência, para circuitos monofásicos, bifásicos e trifásicos.
- Seleção visual do método de instalação (Tabela 33): eletroduto embutido em parede isolante, eletroduto aparente/embutido em alvenaria, fixação direta ao ar livre, diretamente enterrado, bandeja perfurada.
- Seção mínima por capacidade de condução de corrente (Tabela 36), com fatores de correção de temperatura (Tabela 40) e agrupamento (Tabela 42).
- Verificação de queda de tensão (ΔV) com elevação automática de seção quando ela é o fator limitante.
- Seção mínima por norma (1,5 mm² iluminação / 2,5 mm² tomadas), coordenação com disjuntor padronizado e verificação térmica de curto-circuito.
- Memorial de cálculo passo a passo, exportável em PDF.
- Comparativo cobre × alumínio, comparação lado a lado entre métodos de instalação, e biblioteca de circuitos (resumo de quadro de distribuição) persistida no navegador.
- Modo claro/escuro e layout responsivo.

## Desenvolvimento

```bash
npm install
npm run dev      # servidor de desenvolvimento
npm test         # testes unitários (vitest)
npm run build    # build de produção
```
