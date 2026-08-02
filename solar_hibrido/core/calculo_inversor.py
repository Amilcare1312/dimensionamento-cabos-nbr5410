"""Dimensionamento do inversor híbrido.

O inversor deve, simultaneamente:
  - suprir a potência ativa das cargas prioritárias simultâneas (com margem);
  - suportar o pico de partida (surtos de motores/compressores), que costuma
    dominar o dimensionamento;
  - acomodar a potência FV instalada dentro do fator de dimensionamento (FDI).
"""
from __future__ import annotations

from dataclasses import dataclass

from .modelos import Carga, ParametrosProjeto


@dataclass
class ResultadoInversor:
    potencia_ativa_simultanea_w: float   # carga ativa simultânea (com simultaneidade)
    potencia_com_margem_w: float         # + margem de segurança
    pico_partida_w: float                # surto total (partidas)
    potencia_por_fv_w: float             # mínimo para acomodar a FV (Pfv / FDI_max)
    potencia_nominal_recomendada_w: float
    potencia_surto_requerida_w: float
    margem: float
    faixa_fdi: tuple[float, float]
    tensao_banco_v: int

    @property
    def potencia_nominal_recomendada_kw(self) -> float:
        return self.potencia_nominal_recomendada_w / 1000.0

    @property
    def potencia_surto_requerida_kw(self) -> float:
        return self.potencia_surto_requerida_w / 1000.0


def potencia_ativa_simultanea(cargas: list[Carga], fator_simultaneidade: float) -> float:
    """Soma das potências ativas das cargas prioritárias, com fator de simultaneidade.

    P_sim = Σ(potência_ativa × qtd) × fator_simultaneidade
    """
    return sum(c.potencia_total_w for c in cargas) * fator_simultaneidade


def pico_de_partida(cargas: list[Carga]) -> float:
    """Pico de partida.

    Aproximação conservadora: assume que as cargas em regime estão ligadas e que a
    maior partida ocorre por cima delas. Calcula-se, para cada carga com surto, o
    acréscimo (surto − regime); o inversor precisa suportar a soma das cargas em
    regime mais o MAIOR desses acréscimos de partida.

        pico = Σ(potência_regime) + max(surto_i − regime_i)
    """
    regime_total = sum(c.potencia_total_w for c in cargas)
    maior_acrescimo = 0.0
    for c in cargas:
        acrescimo = c.surto_total_w - c.potencia_total_w
        if acrescimo > maior_acrescimo:
            maior_acrescimo = acrescimo
    return regime_total + maior_acrescimo


def dimensionar_inversor(
    cargas: list[Carga],
    p: ParametrosProjeto,
    potencia_fv_instalada_wp: float = 0.0,
) -> ResultadoInversor:
    # 1) Potência ativa simultânea das cargas prioritárias.
    p_sim = potencia_ativa_simultanea(cargas, p.fator_simultaneidade)

    # 2) Acréscimo de margem de segurança (20–25%).
    p_margem = p_sim * (1.0 + p.margem_inversor)

    # 3) Pico de partida (surtos de motores/compressores).
    pico = pico_de_partida(cargas)

    # 4) Potência mínima para acomodar a FV instalada, respeitando o FDI.
    #    FDI = Pfv / Pinv, típico 1,1–1,3  =>  Pinv >= Pfv / FDI_max.
    p_por_fv = potencia_fv_instalada_wp / p.fdi_max if p.fdi_max else 0.0

    # 5) Potência nominal recomendada: maior exigência entre cargas e FV.
    p_nominal = max(p_margem, p_por_fv)

    # 6) Capacidade de surto requerida: o inversor deve suportar o pico de partida.
    p_surto = pico

    return ResultadoInversor(
        potencia_ativa_simultanea_w=p_sim,
        potencia_com_margem_w=p_margem,
        pico_partida_w=pico,
        potencia_por_fv_w=p_por_fv,
        potencia_nominal_recomendada_w=p_nominal,
        potencia_surto_requerida_w=p_surto,
        margem=p.margem_inversor,
        faixa_fdi=(p.fdi_min, p.fdi_max),
        tensao_banco_v=p.tensao_banco_v,
    )
