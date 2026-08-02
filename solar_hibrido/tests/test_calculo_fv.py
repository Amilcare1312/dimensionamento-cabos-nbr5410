"""Testes do dimensionamento do gerador fotovoltaico."""
import math

from solar_hibrido.core.modelos import (
    CriterioFV,
    CriterioHSP,
    DadosFatura,
    Irradiacao,
    ParametrosProjeto,
)
from solar_hibrido.core.calculo_fv import area_por_potencia, dimensionar_fv


def _irr(hsp=5.0):
    return Irradiacao(hsp_mensal=[hsp] * 12, hsp_media_anual=hsp, fonte="teste")


def _params(**kw):
    base = dict(
        eficiencia_sistema=1.0,
        performance_ratio=0.8,
        potencia_modulo_wp=550.0,
        eficiencia_modulo=0.21,
        criterio_hsp=CriterioHSP.MEDIA_ANUAL,
        criterio_fv=CriterioFV.CONSUMO_TOTAL,
    )
    base.update(kw)
    return ParametrosProjeto(**base)


def test_caso_referencia_fv():
    # 300 kWh/mês -> 10 kWh/dia = 10000 Wh/dia.
    fatura = DadosFatura(consumos_mensais_kwh=[300.0])
    r = dimensionar_fv(fatura, _params(), _irr(5.0))

    # E_ger = 10000 / 1.0 = 10000 Wh
    assert math.isclose(r.geracao_diaria_necessaria_wh, 10000.0)
    # P_fv = 10000 / 5 / 0.8 = 2500 Wp
    assert math.isclose(r.potencia_fv_necessaria_wp, 2500.0)
    # ceil(2500 / 550) = 5 módulos
    assert r.num_modulos == 5
    assert r.potencia_fv_instalada_wp == 5 * 550


def test_area_por_potencia():
    # 1000 Wp a 20% de eficiência -> 5 m².
    assert math.isclose(area_por_potencia(1000, 0.20), 5.0)


def test_mes_critico_exige_mais_potencia_que_media():
    fatura = DadosFatura(consumos_mensais_kwh=[300.0])
    irr = Irradiacao(
        hsp_mensal=[6, 6, 6, 6, 6, 3, 3, 6, 6, 6, 6, 6],  # mês crítico = 3
        hsp_media_anual=5.5,
        fonte="teste",
    )
    r_media = dimensionar_fv(fatura, _params(criterio_hsp=CriterioHSP.MEDIA_ANUAL), irr)
    r_critico = dimensionar_fv(fatura, _params(criterio_hsp=CriterioHSP.MES_CRITICO), irr)
    # Mês crítico (HSP menor) => maior potência necessária.
    assert r_critico.potencia_fv_necessaria_wp > r_media.potencia_fv_necessaria_wp
    assert r_critico.hsp_utilizado == 3
