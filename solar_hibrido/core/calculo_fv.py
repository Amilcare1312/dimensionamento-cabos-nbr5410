"""Dimensionamento do gerador fotovoltaico (número de módulos e potência de pico).

Critério adotado: o gerador FV cobre o CONSUMO TOTAL da fatura (média diária).
Opcionalmente pode-se somar a energia diária de recarga do banco de baterias.
"""
from __future__ import annotations

import math
from dataclasses import dataclass

from .modelos import CriterioFV, DadosFatura, Irradiacao, ParametrosProjeto
from .calculo_baterias import ResultadoBaterias


@dataclass
class ResultadoFV:
    consumo_diario_wh: float             # consumo diário base (da fatura)
    energia_recarga_wh: float            # energia diária p/ recarregar o banco (se aplicável)
    geracao_diaria_necessaria_wh: float  # energia que o gerador precisa entregar por dia
    hsp_utilizado: float                 # HSP do critério escolhido (kWh/m²/dia)
    performance_ratio: float
    potencia_fv_necessaria_wp: float     # potência de pico teórica
    num_modulos: int
    potencia_modulo_wp: float
    potencia_fv_instalada_wp: float      # potência efetiva com nº inteiro de módulos
    area_estimada_m2: float
    criterio_fv: CriterioFV

    @property
    def potencia_fv_instalada_kwp(self) -> float:
        return self.potencia_fv_instalada_wp / 1000.0

    @property
    def geracao_diaria_estimada_wh(self) -> float:
        """Geração diária estimada da usina já instalada (nº inteiro de módulos)."""
        return self.potencia_fv_instalada_wp * self.hsp_utilizado * self.performance_ratio


def area_por_potencia(potencia_wp: float, eficiencia_modulo: float) -> float:
    """Área (m²) ocupada por uma dada potência de pico.

    Um módulo de eficiência η, sob 1000 W/m² (STC), gera η × 1000 W por m².
    Logo, área = potência_Wp / (1000 × η).
    """
    if eficiencia_modulo <= 0:
        return 0.0
    return potencia_wp / (1000.0 * eficiencia_modulo)


def dimensionar_fv(
    fatura: DadosFatura,
    p: ParametrosProjeto,
    irradiacao: Irradiacao,
    baterias: ResultadoBaterias | None = None,
) -> ResultadoFV:
    # 1) Consumo diário base (da fatura), em Wh/dia.
    consumo_diario_wh = fatura.consumo_medio_diario_kwh * 1000.0

    # 2) Energia diária adicional para recarregar o banco (só no critério correspondente).
    energia_recarga_wh = 0.0
    if p.criterio_fv == CriterioFV.CONSUMO_MAIS_RECARGA and baterias is not None:
        # Assume-se recarregar diariamente a energia útil consumida das baterias.
        energia_recarga_wh = baterias.capacidade_util_wh

    # 3) Geração diária necessária = (consumo + recarga) / eficiência do sistema.
    geracao_diaria_necessaria_wh = (
        consumo_diario_wh + energia_recarga_wh
    ) / p.eficiencia_sistema

    # 4) HSP conforme o critério (mês crítico = conservador; média anual = otimista).
    hsp = irradiacao.hsp_para_criterio(p.criterio_hsp)

    # 5) Potência FV necessária (Wp):
    #    P_fv = E_ger_dia / HSP / PR
    #    O PR (performance ratio) desconta perdas por temperatura, sujeira, cabeamento.
    if hsp <= 0 or p.performance_ratio <= 0:
        potencia_fv_necessaria_wp = 0.0
    else:
        potencia_fv_necessaria_wp = geracao_diaria_necessaria_wh / hsp / p.performance_ratio

    # 6) Número de módulos (arredondado para cima) e potência efetivamente instalada.
    num_modulos = (
        max(1, math.ceil(potencia_fv_necessaria_wp / p.potencia_modulo_wp))
        if p.potencia_modulo_wp
        else 0
    )
    potencia_fv_instalada_wp = num_modulos * p.potencia_modulo_wp

    # 7) Área estimada da usina.
    area_estimada_m2 = area_por_potencia(potencia_fv_instalada_wp, p.eficiencia_modulo)

    return ResultadoFV(
        consumo_diario_wh=consumo_diario_wh,
        energia_recarga_wh=energia_recarga_wh,
        geracao_diaria_necessaria_wh=geracao_diaria_necessaria_wh,
        hsp_utilizado=hsp,
        performance_ratio=p.performance_ratio,
        potencia_fv_necessaria_wp=potencia_fv_necessaria_wp,
        num_modulos=num_modulos,
        potencia_modulo_wp=p.potencia_modulo_wp,
        potencia_fv_instalada_wp=potencia_fv_instalada_wp,
        area_estimada_m2=area_estimada_m2,
        criterio_fv=p.criterio_fv,
    )
