"""Interface Streamlit — Dimensionamento de sistema fotovoltaico híbrido (backup).

Escopo de projeto (definido com o usuário):
  • Banco de baterias e inversor dimensionados apenas para as CARGAS PRIORITÁRIAS
    críticas (backup durante blackout).
  • Gerador FV dimensionado para cobrir o CONSUMO TOTAL da fatura (opção de somar
    a recarga do banco).
  • Catálogo genérico (kWh/kWp/kW), com módulo e unidade de bateria editáveis.
  • Uso local, sem login.

Execução:  streamlit run solar_hibrido/app.py
"""
from __future__ import annotations

import io
import sys
from pathlib import Path

import pandas as pd
import streamlit as st

# Permite executar tanto com `streamlit run solar_hibrido/app.py` quanto como módulo.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from solar_hibrido.core.modelos import (  # noqa: E402
    Carga,
    CriterioFV,
    CriterioHSP,
    DadosFatura,
    ParametrosProjeto,
    TipoBateria,
    PARAMETROS_BATERIA,
)
from solar_hibrido.core import fatura as mod_fatura  # noqa: E402
from solar_hibrido.core import irradiacao as mod_irr  # noqa: E402
from solar_hibrido.core.calculo_baterias import dimensionar_baterias  # noqa: E402
from solar_hibrido.core.calculo_fv import dimensionar_fv  # noqa: E402
from solar_hibrido.core.calculo_inversor import dimensionar_inversor  # noqa: E402
from solar_hibrido.core.relatorio import (  # noqa: E402
    montar_memorial,
    exportar_pdf,
    exportar_docx,
)
from solar_hibrido.core.validacoes import (  # noqa: E402
    validar_area,
    validar_entradas,
    validar_resultados,
)
from solar_hibrido.data.hsp_brasil import CAPITAL_UF  # noqa: E402

MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
         "Jul", "Ago", "Set", "Out", "Nov", "Dez"]


st.set_page_config(page_title="Dimensionamento FV Híbrido", page_icon="🔋", layout="wide")


# --------------------------------------------------------------------------- #
# Cache das chamadas de irradiação (evita refazer a consulta a cada interação).
# --------------------------------------------------------------------------- #
@st.cache_data(show_spinner=False, ttl=60 * 60 * 24)
def _irradiacao_cacheada(cidade: str, uf: str, usar_api: bool):
    return mod_irr.obter_irradiacao(cidade, uf, usar_api=usar_api)


# --------------------------------------------------------------------------- #
# Sidebar — parâmetros de projeto
# --------------------------------------------------------------------------- #
def montar_parametros() -> ParametrosProjeto:
    st.sidebar.header("⚙️ Parâmetros de projeto")

    tipo = st.sidebar.selectbox(
        "Tipo de bateria", list(TipoBateria),
        format_func=lambda t: "Lítio (LiFePO4)" if t == TipoBateria.LITIO else "Chumbo-ácido",
    )
    padrao = PARAMETROS_BATERIA[tipo]
    dod = st.sidebar.slider("DoD — profundidade de descarga", 0.3, 1.0,
                            float(padrao["dod"]), 0.05)

    autonomia = st.sidebar.number_input("Autonomia sem rede/geração (dias)",
                                        0.25, 10.0, 1.0, 0.25)
    tensao_banco = st.sidebar.selectbox("Tensão do banco (V)", [12, 24, 48], index=2)
    eff = st.sidebar.slider("Eficiência global do sistema", 0.80, 0.98, 0.92, 0.01)
    fsimult = st.sidebar.slider("Fator de simultaneidade", 0.3, 1.0, 0.7, 0.05)

    st.sidebar.subheader("Gerador FV")
    pot_modulo = st.sidebar.number_input("Potência do módulo (Wp)", 300.0, 800.0, 550.0, 5.0)
    eff_modulo = st.sidebar.slider("Eficiência do módulo", 0.15, 0.25, 0.21, 0.005)
    pr = st.sidebar.slider("Performance ratio (PR)", 0.65, 0.90, 0.78, 0.01)
    criterio_hsp = st.sidebar.radio(
        "Critério de HSP",
        [CriterioHSP.MES_CRITICO, CriterioHSP.MEDIA_ANUAL],
        format_func=lambda c: "Mês crítico (conservador)" if c == CriterioHSP.MES_CRITICO
        else "Média anual",
    )
    criterio_fv = st.sidebar.radio(
        "O FV deve cobrir",
        [CriterioFV.CONSUMO_TOTAL, CriterioFV.CONSUMO_MAIS_RECARGA],
        format_func=lambda c: "Consumo total da fatura" if c == CriterioFV.CONSUMO_TOTAL
        else "Consumo total + recarga do banco",
    )

    st.sidebar.subheader("Inversor")
    margem = st.sidebar.slider("Margem de segurança do inversor", 0.10, 0.50, 0.25, 0.05)

    st.sidebar.subheader("Unidade de bateria comercial (referência)")
    cap_unid = st.sidebar.number_input("Capacidade da unidade (kWh)", 1.0, 20.0, 5.12, 0.01)
    tensao_unid = st.sidebar.number_input("Tensão da unidade (V)", 12.0, 60.0, 51.2, 0.1)

    area = st.sidebar.number_input("Área disponível (m²) — opcional", 0.0, 100000.0, 0.0, 1.0)

    return ParametrosProjeto(
        autonomia_dias=autonomia,
        tipo_bateria=tipo,
        dod=dod,
        tensao_banco_v=tensao_banco,
        eficiencia_sistema=eff,
        fator_simultaneidade=fsimult,
        performance_ratio=pr,
        potencia_modulo_wp=pot_modulo,
        eficiencia_modulo=eff_modulo,
        margem_inversor=margem,
        criterio_hsp=criterio_hsp,
        criterio_fv=criterio_fv,
        capacidade_unidade_bateria_wh=cap_unid * 1000.0,
        tensao_unidade_bateria_v=tensao_unid,
        area_disponivel_m2=area if area > 0 else None,
    )


# --------------------------------------------------------------------------- #
# Entrada da fatura
# --------------------------------------------------------------------------- #
def montar_fatura() -> DadosFatura:
    st.subheader("1️⃣ Fatura de energia")

    if "consumos" not in st.session_state:
        st.session_state.consumos = [300.0] * 12

    col1, col2 = st.columns([1, 1])
    with col1:
        arquivo = st.file_uploader("Upload da fatura (PDF) — opcional", type=["pdf"])
        if arquivo is not None:
            res = mod_fatura.parse_fatura_pdf(io.BytesIO(arquivo.read()))
            if res.sucesso:
                if res.campos_encontrados:
                    st.success("Extraídos do PDF: " + ", ".join(res.campos_encontrados))
                if res.dados.consumos_mensais_kwh:
                    vals = res.dados.consumos_mensais_kwh
                    st.session_state.consumos = (vals + [vals[-1]] * 12)[:12]
                if res.dados.uf:
                    st.session_state.uf_detectada = res.dados.uf
                if res.dados.distribuidora:
                    st.session_state.dist_detectada = res.dados.distribuidora
                st.info("Confira e ajuste os valores manualmente abaixo.")
            else:
                st.warning(res.erro)

    with col2:
        distribuidora = st.text_input("Distribuidora",
                                      st.session_state.get("dist_detectada", ""))
        classe = st.selectbox("Classe tarifária", ["B", "A"])
        tensao_forn = st.selectbox(
            "Tensão de fornecimento",
            ["Monofásico 127V", "Bifásico 220V", "Trifásico 220V", "Trifásico 380V"],
            index=1,
        )

    col3, col4 = st.columns([1, 1])
    ufs = sorted(CAPITAL_UF.keys())
    uf_padrao = st.session_state.get("uf_detectada", "SC")
    with col3:
        uf = st.selectbox("UF", ufs, index=ufs.index(uf_padrao) if uf_padrao in ufs else 0)
    with col4:
        cidade = st.text_input("Cidade", CAPITAL_UF.get(uf, ""))

    st.markdown("**Consumo mensal (kWh) — últimos 12 meses**")
    df = pd.DataFrame({"Mês": MESES, "Consumo (kWh)": st.session_state.consumos})
    df_edit = st.data_editor(df, hide_index=True, use_container_width=True,
                             disabled=["Mês"], key="editor_consumo")
    consumos = [float(v) for v in df_edit["Consumo (kWh)"].tolist()]
    st.session_state.consumos = consumos

    media = sum(consumos) / len(consumos) if consumos else 0
    st.caption(f"Consumo médio: **{media:,.0f} kWh/mês** ({media/30:,.1f} kWh/dia)"
               .replace(",", "."))

    return DadosFatura(
        distribuidora=distribuidora,
        classe_tarifaria=classe,
        cidade=cidade,
        uf=uf,
        tensao_fornecimento=tensao_forn,
        consumos_mensais_kwh=consumos,
    )


# --------------------------------------------------------------------------- #
# Cargas prioritárias
# --------------------------------------------------------------------------- #
def montar_cargas() -> list[Carga]:
    st.subheader("2️⃣ Cargas prioritárias")
    st.caption("Marque como *crítica* o que precisa funcionar no blackout "
               "(essas cargas dimensionam o banco de baterias).")

    if "cargas_df" not in st.session_state:
        st.session_state.cargas_df = pd.DataFrame([
            {"Equipamento": "Geladeira", "Potência (W)": 150.0, "Surto (W)": 0.0,
             "Horas/dia": 24.0, "Qtd": 1, "Crítica": True},
            {"Equipamento": "Iluminação", "Potência (W)": 100.0, "Surto (W)": 0.0,
             "Horas/dia": 5.0, "Qtd": 1, "Crítica": True},
            {"Equipamento": "Bomba d'água", "Potência (W)": 750.0, "Surto (W)": 2250.0,
             "Horas/dia": 1.0, "Qtd": 1, "Crítica": False},
        ])

    df = st.data_editor(
        st.session_state.cargas_df,
        num_rows="dynamic",
        use_container_width=True,
        hide_index=True,
        column_config={
            "Potência (W)": st.column_config.NumberColumn(min_value=0.0, step=10.0),
            "Surto (W)": st.column_config.NumberColumn(
                min_value=0.0, step=50.0, help="Potência de partida (0 = sem surto)"),
            "Horas/dia": st.column_config.NumberColumn(min_value=0.0, max_value=24.0, step=0.5),
            "Qtd": st.column_config.NumberColumn(min_value=1, step=1),
            "Crítica": st.column_config.CheckboxColumn(help="Atendida no blackout?"),
        },
        key="editor_cargas",
    )
    st.session_state.cargas_df = df

    cargas: list[Carga] = []
    for _, row in df.iterrows():
        nome = str(row.get("Equipamento", "")).strip()
        if not nome:
            continue
        surto = float(row.get("Surto (W)", 0) or 0)
        cargas.append(Carga(
            nome=nome,
            potencia_w=float(row.get("Potência (W)", 0) or 0),
            horas_dia=float(row.get("Horas/dia", 0) or 0),
            quantidade=int(row.get("Qtd", 1) or 1),
            critica=bool(row.get("Crítica", False)),
            potencia_surto_w=surto if surto > 0 else None,
        ))
    return cargas


# --------------------------------------------------------------------------- #
# Exibição dos resultados
# --------------------------------------------------------------------------- #
def exibir_alertas(alertas):
    for a in alertas:
        if a.nivel == "erro":
            st.error(a.texto)
        elif a.nivel == "aviso":
            st.warning(a.texto)
        else:
            st.info(a.texto)


def main():
    st.title("🔋 Dimensionamento de Sistema Fotovoltaico Híbrido")
    st.caption("On-grid com banco de baterias e backup de cargas prioritárias. "
               "Ferramenta de apoio — valide sempre com projeto de engenharia.")

    p = montar_parametros()
    fatura = montar_fatura()
    cargas = montar_cargas()

    st.divider()
    usar_api = st.checkbox("Consultar irradiação online (NASA POWER/PVGIS)", value=True,
                           help="Desmarque para usar a base local de HSP por estado.")

    alertas_entrada = validar_entradas(fatura, cargas, p)
    tem_erro = any(a.nivel == "erro" for a in alertas_entrada)

    if st.button("📐 Calcular dimensionamento", type="primary", disabled=tem_erro):
        st.session_state.calcular = True
    if tem_erro:
        exibir_alertas(alertas_entrada)

    if not st.session_state.get("calcular"):
        exibir_alertas([a for a in alertas_entrada if a.nivel != "erro"])
        return

    # ----------------- Cálculo -----------------
    with st.spinner("Consultando irradiação e calculando..."):
        irr = _irradiacao_cacheada(fatura.cidade, fatura.uf, usar_api)
        baterias = dimensionar_baterias(cargas, p)
        fv = dimensionar_fv(fatura, p, irr, baterias)
        inversor = dimensionar_inversor(cargas, p, fv.potencia_fv_instalada_wp)

    alertas = (alertas_entrada
               + validar_resultados(fatura, baterias, fv)
               + validar_area(fv, p.area_disponivel_m2))
    exibir_alertas(alertas)

    # ----------------- Resumo executivo -----------------
    st.header("📊 Resumo executivo")
    c1, c2, c3, c4 = st.columns(4)
    c1.metric("Potência FV", f"{fv.potencia_fv_instalada_kwp:.2f} kWp",
              f"{fv.num_modulos} módulos")
    c2.metric("Banco de baterias", f"{baterias.capacidade_banco_comercial_kwh:.2f} kWh",
              f"{baterias.capacidade_nominal_ah:.0f} Ah @ {baterias.tensao_banco_v} V")
    c3.metric("Inversor híbrido", f"{inversor.potencia_nominal_recomendada_kw:.2f} kW",
              f"surto ≥ {inversor.potencia_surto_requerida_kw:.1f} kW")
    c4.metric("HSP utilizado", f"{fv.hsp_utilizado:.2f}",
              irr.fonte)

    # ----------------- Gráfico de HSP mensal -----------------
    st.subheader("☀️ Irradiação mensal (HSP)")
    df_hsp = pd.DataFrame({"Mês": MESES, "HSP (kWh/m²/dia)": irr.hsp_mensal}).set_index("Mês")
    st.bar_chart(df_hsp)
    st.caption(f"Fonte: {irr.fonte} · média anual {irr.hsp_media_anual:.2f} · "
               f"mês crítico {irr.hsp_mes_critico:.2f} kWh/m²/dia")

    # ----------------- Tabela de cargas -----------------
    st.subheader("🔌 Cargas prioritárias")
    linhas = []
    for c in cargas:
        linhas.append({
            "Equipamento": c.nome,
            "Potência (W)": c.potencia_total_w,
            "Horas/dia": c.horas_dia,
            "Energia (Wh/dia)": c.energia_dia_wh,
            "Surto (W)": c.surto_total_w,
            "Crítica": "Sim" if c.critica else "Não",
        })
    df_cargas = pd.DataFrame(linhas)
    st.dataframe(df_cargas, hide_index=True, use_container_width=True)
    total_dia = sum(c.energia_dia_wh for c in cargas)
    total_critico = sum(c.energia_dia_wh for c in cargas if c.critica)
    st.caption(f"Energia total: **{total_dia/1000:.1f} kWh/dia** · "
               f"apenas críticas: **{total_critico/1000:.1f} kWh/dia**")

    # ----------------- Memorial de cálculo -----------------
    mem = montar_memorial(fatura, cargas, p, irr, baterias, fv, inversor)
    st.subheader("🧮 Memorial de cálculo")
    for s in mem.secoes:
        with st.expander(s.titulo, expanded=False):
            for linha in s.linhas:
                st.text(linha)

    # ----------------- Exportação -----------------
    st.subheader("📄 Exportar relatório")
    col_pdf, col_docx = st.columns(2)
    tmp = Path(st.session_state.get("_tmpdir", "."))
    with col_pdf:
        try:
            caminho_pdf = str(tmp / "relatorio_fv_hibrido.pdf")
            exportar_pdf(mem, caminho_pdf)
            with open(caminho_pdf, "rb") as fh:
                st.download_button("⬇️ Baixar PDF", fh.read(),
                                   "relatorio_fv_hibrido.pdf", "application/pdf")
        except Exception as exc:
            st.info(f"PDF indisponível ({exc}). Instale 'fpdf2'.")
    with col_docx:
        try:
            caminho_docx = str(tmp / "relatorio_fv_hibrido.docx")
            exportar_docx(mem, caminho_docx)
            with open(caminho_docx, "rb") as fh:
                st.download_button(
                    "⬇️ Baixar DOCX", fh.read(), "relatorio_fv_hibrido.docx",
                    "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
        except Exception as exc:
            st.info(f"DOCX indisponível ({exc}). Instale 'python-docx'.")


if __name__ == "__main__":
    main()
