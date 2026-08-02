"""Dimensionamento do banco de baterias (modo backup de cargas prioritárias).

Escopo de projeto adotado: as baterias atendem apenas às cargas marcadas como
CRÍTICAS durante a falta de rede/geração. As fórmulas ficam explícitas abaixo.
"""
from __future__ import annotations

import math
from dataclasses import dataclass

from .modelos import Carga, ParametrosProjeto


@dataclass
class ResultadoBaterias:
    energia_diaria_wh: float          # Wh/dia das cargas críticas (com simultaneidade)
    capacidade_util_wh: float         # energia útil necessária considerando autonomia e eficiência
    capacidade_nominal_wh: float      # capacidade nominal (antes de aplicar DoD)
    capacidade_nominal_ah: float      # idem, convertida para Ah na tensão do banco
    dod: float
    eficiencia: float
    tensao_banco_v: int
    autonomia_dias: float
    # Sugestão de arranjo com unidades comerciais
    num_unidades: int
    capacidade_unidade_wh: float
    unidades_serie: int
    unidades_paralelo: int
    capacidade_banco_comercial_wh: float

    @property
    def energia_diaria_kwh(self) -> float:
        return self.energia_diaria_wh / 1000.0

    @property
    def capacidade_nominal_kwh(self) -> float:
        return self.capacidade_nominal_wh / 1000.0

    @property
    def capacidade_banco_comercial_kwh(self) -> float:
        return self.capacidade_banco_comercial_wh / 1000.0


def energia_diaria_cargas_criticas(cargas: list[Carga], fator_simultaneidade: float) -> float:
    """Energia diária (Wh/dia) das cargas críticas.

    Fórmula:
        E_dia = Σ(potência × qtd × horas_uso)  ×  fator_simultaneidade
    Apenas cargas marcadas como críticas entram no banco de baterias.
    """
    total = sum(c.energia_dia_wh for c in cargas if c.critica)
    return total * fator_simultaneidade


def dimensionar_baterias(cargas: list[Carga], p: ParametrosProjeto) -> ResultadoBaterias:
    dod = p.dod_efetivo()
    eficiencia = p.eficiencia_bateria_efetiva()

    # 1) Energia diária das cargas críticas (com fator de simultaneidade)
    energia_diaria_wh = energia_diaria_cargas_criticas(cargas, p.fator_simultaneidade)

    # 2) Capacidade útil necessária:
    #    C_util = E_dia × autonomia(dias) / eficiência_do_sistema
    capacidade_util_wh = (energia_diaria_wh * p.autonomia_dias) / p.eficiencia_sistema

    # 3) Capacidade nominal do banco (o DoD limita quanto se pode extrair):
    #    C_nom = C_util / DoD
    capacidade_nominal_wh = capacidade_util_wh / dod

    # 4) Conversão para Ah na tensão do banco:  Ah = Wh / V
    capacidade_nominal_ah = (
        capacidade_nominal_wh / p.tensao_banco_v if p.tensao_banco_v else 0.0
    )

    # 5) Sugestão de arranjo com unidades comerciais (ex.: 5,12 kWh / 51,2 V).
    cap_unid = p.capacidade_unidade_bateria_wh
    num_unidades = max(1, math.ceil(capacidade_nominal_wh / cap_unid)) if cap_unid else 0

    # Unidades em série para atingir a tensão do banco; o restante vai em paralelo.
    unidades_serie = 1
    if p.tensao_unidade_bateria_v:
        unidades_serie = max(1, round(p.tensao_banco_v / p.tensao_unidade_bateria_v))
    unidades_paralelo = max(1, math.ceil(num_unidades / unidades_serie))
    total_unidades_arranjo = unidades_serie * unidades_paralelo
    capacidade_banco_comercial_wh = total_unidades_arranjo * cap_unid

    return ResultadoBaterias(
        energia_diaria_wh=energia_diaria_wh,
        capacidade_util_wh=capacidade_util_wh,
        capacidade_nominal_wh=capacidade_nominal_wh,
        capacidade_nominal_ah=capacidade_nominal_ah,
        dod=dod,
        eficiencia=eficiencia,
        tensao_banco_v=p.tensao_banco_v,
        autonomia_dias=p.autonomia_dias,
        num_unidades=total_unidades_arranjo,
        capacidade_unidade_wh=cap_unid,
        unidades_serie=unidades_serie,
        unidades_paralelo=unidades_paralelo,
        capacidade_banco_comercial_wh=capacidade_banco_comercial_wh,
    )
