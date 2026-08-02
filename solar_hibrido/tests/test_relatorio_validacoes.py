"""Testes do memorial de cálculo e das validações de inconsistência."""
from solar_hibrido.core.modelos import (
    Carga,
    CriterioFV,
    CriterioHSP,
    DadosFatura,
    Irradiacao,
    ParametrosProjeto,
)
from solar_hibrido.core.calculo_baterias import dimensionar_baterias
from solar_hibrido.core.calculo_fv import dimensionar_fv
from solar_hibrido.core.calculo_inversor import dimensionar_inversor
from solar_hibrido.core.relatorio import montar_memorial, memorial_para_texto
from solar_hibrido.core.validacoes import validar_entradas, validar_resultados


def _cenario():
    fatura = DadosFatura(
        distribuidora="CELESC", uf="SC", cidade="Florianópolis",
        consumos_mensais_kwh=[300.0] * 12,
    )
    cargas = [
        Carga("Geladeira", 150, 24, 1, critica=True),
        Carga("Bomba", 1000, 2, 1, potencia_surto_w=3000, critica=True),
    ]
    p = ParametrosProjeto(criterio_fv=CriterioFV.CONSUMO_TOTAL,
                          criterio_hsp=CriterioHSP.MES_CRITICO)
    irr = Irradiacao(hsp_mensal=[4.5] * 12, hsp_media_anual=4.5, fonte="teste")
    bat = dimensionar_baterias(cargas, p)
    fv = dimensionar_fv(fatura, p, irr, bat)
    inv = dimensionar_inversor(cargas, p, fv.potencia_fv_instalada_wp)
    return fatura, cargas, p, irr, bat, fv, inv


def test_memorial_contem_secoes_e_resumo():
    fatura, cargas, p, irr, bat, fv, inv = _cenario()
    mem = montar_memorial(fatura, cargas, p, irr, bat, fv, inv)
    assert mem.resumo  # resumo executivo preenchido
    titulos = [s.titulo for s in mem.secoes]
    assert any("bateria" in t.lower() for t in titulos)
    assert any("fotovoltaico" in t.lower() for t in titulos)
    assert any("inversor" in t.lower() for t in titulos)
    texto = memorial_para_texto(mem)
    assert "RESUMO EXECUTIVO" in texto


def test_validacao_detecta_consumo_zero():
    fatura = DadosFatura(consumos_mensais_kwh=[])
    cargas = [Carga("X", 100, 5, critica=True)]
    alertas = validar_entradas(fatura, cargas, ParametrosProjeto())
    assert any(a.nivel == "erro" for a in alertas)


def test_validacao_cargas_criticas_maiores_que_fatura():
    # Consumo minúsculo na fatura vs cargas críticas grandes.
    fatura = DadosFatura(consumos_mensais_kwh=[30.0])  # 1 kWh/dia
    cargas = [Carga("Forno", 3000, 5, critica=True)]
    p = ParametrosProjeto()
    irr = Irradiacao(hsp_mensal=[5] * 12, hsp_media_anual=5, fonte="teste")
    bat = dimensionar_baterias(cargas, p)
    fv = dimensionar_fv(fatura, p, irr, bat)
    alertas = validar_resultados(fatura, bat, fv)
    assert any("MAIOR" in a.texto for a in alertas)
