"""Testes do dimensionamento do inversor híbrido."""
import math

from solar_hibrido.core.modelos import Carga, ParametrosProjeto
from solar_hibrido.core.calculo_inversor import (
    dimensionar_inversor,
    pico_de_partida,
    potencia_ativa_simultanea,
)


def _params(**kw):
    base = dict(fator_simultaneidade=1.0, margem_inversor=0.25, fdi_max=1.30)
    base.update(kw)
    return ParametrosProjeto(**base)


def _cargas():
    return [
        Carga("Motor", potencia_w=1000, horas_dia=2, quantidade=1,
              potencia_surto_w=3000, critica=True),
        Carga("Iluminação", potencia_w=200, horas_dia=5, quantidade=1, critica=True),
    ]


def test_potencia_ativa_simultanea():
    # (1000 + 200) × 1.0 = 1200 W
    assert potencia_ativa_simultanea(_cargas(), 1.0) == 1200


def test_pico_de_partida():
    # regime_total = 1200; maior acréscimo = 3000-1000 = 2000 -> pico = 3200 W
    assert pico_de_partida(_cargas()) == 3200


def test_caso_referencia_inversor_dominado_por_fv():
    # FV instalada = 2750 Wp; P_fv/1.3 = 2115 W domina sobre a carga (1500 W).
    r = dimensionar_inversor(_cargas(), _params(), potencia_fv_instalada_wp=2750)
    assert math.isclose(r.potencia_com_margem_w, 1500.0)      # 1200 × 1.25
    assert math.isclose(r.potencia_por_fv_w, 2750 / 1.3, rel_tol=1e-6)
    assert math.isclose(r.potencia_nominal_recomendada_w, 2750 / 1.3, rel_tol=1e-6)
    assert r.potencia_surto_requerida_w == 3200


def test_caso_referencia_inversor_dominado_por_carga():
    # Sem FV, quem manda é a carga com margem.
    r = dimensionar_inversor(_cargas(), _params(), potencia_fv_instalada_wp=0)
    assert math.isclose(r.potencia_nominal_recomendada_w, 1500.0)
