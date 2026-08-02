"""Testes do dimensionamento do banco de baterias, com um caso de referência."""
import math

from solar_hibrido.core.modelos import Carga, ParametrosProjeto, TipoBateria
from solar_hibrido.core.calculo_baterias import (
    dimensionar_baterias,
    energia_diaria_cargas_criticas,
)


def _params(**kw):
    """Parâmetros com números 'limpos' para facilitar a conferência manual."""
    base = dict(
        autonomia_dias=1.0,
        tipo_bateria=TipoBateria.LITIO,
        dod=0.8,
        eficiencia_sistema=1.0,
        fator_simultaneidade=1.0,
        tensao_banco_v=48,
        capacidade_unidade_bateria_wh=5120.0,
        tensao_unidade_bateria_v=51.2,
    )
    base.update(kw)
    return ParametrosProjeto(**base)


def test_energia_diaria_soma_apenas_criticas():
    cargas = [
        Carga("Geladeira", potencia_w=150, horas_dia=24, quantidade=1, critica=True),
        Carga("Ar-cond.", potencia_w=1000, horas_dia=8, quantidade=1, critica=False),
    ]
    # Só a geladeira é crítica: 150 * 24 = 3600 Wh; f_simult = 1.0.
    assert energia_diaria_cargas_criticas(cargas, 1.0) == 3600


def test_caso_referencia_baterias():
    # Caso conhecido: 100 W × 10 h = 1000 Wh/dia (única carga crítica).
    cargas = [Carga("Carga", potencia_w=100, horas_dia=10, quantidade=1, critica=True)]
    r = dimensionar_baterias(cargas, _params())

    # E_dia = 1000 Wh
    assert r.energia_diaria_wh == 1000
    # C_util = 1000 × 1 / 1.0 = 1000 Wh
    assert math.isclose(r.capacidade_util_wh, 1000.0)
    # C_nom = 1000 / 0.8 = 1250 Wh
    assert math.isclose(r.capacidade_nominal_wh, 1250.0)
    # Ah @ 48 V = 1250 / 48 = 26.04 Ah
    assert math.isclose(r.capacidade_nominal_ah, 1250.0 / 48.0, rel_tol=1e-6)


def test_arranjo_comercial_serie_paralelo():
    # Carga grande para exigir várias unidades de 5,12 kWh.
    cargas = [Carga("Carga", potencia_w=2000, horas_dia=10, quantidade=1, critica=True)]
    # E_dia = 20000 Wh; C_util = 20000; C_nom = 25000 Wh.
    r = dimensionar_baterias(cargas, _params())
    # 48 V / 51,2 V -> 1 unidade em série; ceil(25000/5120) = 5 unidades em paralelo.
    assert r.unidades_serie == 1
    assert r.unidades_paralelo == math.ceil(25000 / 5120)
    assert r.capacidade_banco_comercial_wh == r.num_unidades * 5120


def test_chumbo_usa_dod_menor_por_padrao():
    cargas = [Carga("Carga", potencia_w=100, horas_dia=10, critica=True)]
    p = _params(dod=None, tipo_bateria=TipoBateria.CHUMBO)
    r = dimensionar_baterias(cargas, p)
    # DoD padrão do chumbo-ácido = 0,50.
    assert r.dod == 0.5
    # C_nom = 1000 / 0.5 = 2000 Wh
    assert math.isclose(r.capacidade_nominal_wh, 2000.0)
