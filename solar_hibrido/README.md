# Dimensionamento de Sistema Fotovoltaico Híbrido

Aplicativo web (**Python + Streamlit**) para dimensionamento de sistemas
fotovoltaicos **híbridos**: on-grid com banco de baterias e **backup de cargas
prioritárias**. Recebe a fatura de energia e a lista de cargas críticas e devolve
o dimensionamento técnico completo (FV, baterias, inversor) com memorial de
cálculo e exportação em PDF/DOCX.

> Este app vive numa subpasta própria do repositório. Ele **não** roda no deploy
> estático do GitHub Pages (Streamlit precisa de um servidor Python) — use
> execução local ou um host como Streamlit Cloud / Render / container.

## Escopo de projeto adotado

Decisões combinadas antes da implementação:

| Tema | Decisão |
| ---- | ------- |
| **Backup** | Baterias e inversor dimensionados **apenas para as cargas prioritárias críticas** (atendidas no blackout). |
| **Gerador FV** | Dimensionado para cobrir o **consumo total da fatura** (opção de somar a recarga do banco). |
| **Catálogo** | **Genérico** (kWh / kWp / kW); potência do módulo e unidade de bateria comercial são editáveis. |
| **Acesso** | **Uso local, sem login.** |

## Como executar

```bash
cd solar_hibrido
pip install -r requirements.txt
streamlit run app.py          # a partir da subpasta
# ou, da raiz do repositório:
streamlit run solar_hibrido/app.py
```

Testes unitários (rodar da **raiz** do repositório):

```bash
python -m pytest solar_hibrido/tests -q
```

## Estrutura

```
solar_hibrido/
├── app.py                     # interface Streamlit (entradas, resultados, gráficos, export)
├── core/                      # lógica de cálculo — sem dependência de Streamlit, testável
│   ├── modelos.py             # dataclasses de entrada/saída e parâmetros padrão
│   ├── calculo_baterias.py    # banco de baterias (backup das cargas críticas)
│   ├── calculo_fv.py          # gerador fotovoltaico (nº de módulos, kWp)
│   ├── calculo_inversor.py    # inversor híbrido (carga + surto + FDI da FV)
│   ├── irradiacao.py          # HSP via NASA POWER / PVGIS + geocodificação + fallback
│   ├── fatura.py              # extração de PDF (pdfplumber) com fallback manual
│   ├── validacoes.py          # alertas de inconsistência
│   └── relatorio.py           # memorial de cálculo + exportação PDF/DOCX
├── data/hsp_brasil.py         # base local de HSP por UF (fallback offline)
├── tests/                     # pytest, com casos de referência conferidos à mão
└── requirements.txt
```

## Fórmulas (explícitas no código)

**Banco de baterias** (`core/calculo_baterias.py`)

```
E_dia   = Σ(potência × qtd × horas_uso) × fator_simultaneidade   # só cargas críticas
C_util  = E_dia × autonomia(dias) / η_sistema
C_nom   = C_util / DoD
Ah      = C_nom / tensão_do_banco
```

**Gerador fotovoltaico** (`core/calculo_fv.py`)

```
E_ger   = (consumo_diário [+ recarga do banco]) / η_sistema
P_fv    = E_ger / HSP / performance_ratio
n_mód   = ⌈ P_fv / potência_do_módulo ⌉
área    = P_fv_instalada / (1000 × η_módulo)
```

**Inversor híbrido** (`core/calculo_inversor.py`)

```
P_sim   = Σ(potência_ativa × qtd) × fator_simultaneidade
P_nom   = max( P_sim × (1 + margem) ,  P_fv_instalada / FDI_max )
pico    = Σ(potência_regime) + max(surto_i − regime_i)   # capacidade de surto exigida
```

## Irradiação (HSP)

1. Geocodifica a cidade (Nominatim/OpenStreetMap) → lat/long.
2. Consulta **NASA POWER** (climatologia, HSP em kWh/m²/dia mês a mês); alternativa **PVGIS**.
3. Se falhar (offline, cidade não encontrada, timeout) → **base local por UF**
   (`data/hsp_brasil.py`, valores aproximados do Atlas Brasileiro / CRESESB).

O usuário escolhe dimensionar pelo **mês crítico** (conservador) ou pela **média
anual**. As chamadas de rede são cacheadas na camada de UI (`st.cache_data`).

## Saídas

- Resumo executivo (kWp, nº de módulos, kWh/Ah do banco, kW do inversor).
- Memorial de cálculo detalhado (cada fórmula e valor intermediário).
- Gráfico de HSP mensal da cidade.
- Tabela de cargas prioritárias com consumo individual e total.
- Alertas de inconsistência (cargas críticas > fatura, autonomia irreal, área
  insuficiente, etc.).
- Exportação do relatório em **PDF** (fpdf2) e **DOCX** (python-docx).

## Observações

- A extração de fatura em PDF é *best-effort* (o layout varia por distribuidora);
  sempre confirme os valores no formulário manual.
- Ferramenta de **apoio à engenharia** — o dimensionamento final deve ser
  validado por projeto elétrico responsável.
```
