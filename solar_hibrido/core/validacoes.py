"""Alertas de inconsistência do dimensionamento.

Cada função retorna uma lista de mensagens (nível, texto) para exibir ao usuário.
Nível: "erro" (impede/compromete o dimensionamento), "aviso" (revisar) ou "info".
"""
from __future__ import annotations

from dataclasses import dataclass

from .modelos import Carga, DadosFatura, ParametrosProjeto
from .calculo_baterias import ResultadoBaterias
from .calculo_fv import ResultadoFV


@dataclass
class Alerta:
    nivel: str   # "erro" | "aviso" | "info"
    texto: str


def validar_entradas(
    fatura: DadosFatura,
    cargas: list[Carga],
    p: ParametrosProjeto,
) -> list[Alerta]:
    alertas: list[Alerta] = []

    if not cargas:
        alertas.append(Alerta("erro", "Nenhuma carga prioritária foi cadastrada."))
    if not any(c.critica for c in cargas):
        alertas.append(
            Alerta("aviso", "Nenhuma carga foi marcada como crítica — o banco de "
                            "baterias ficará dimensionado em zero.")
        )
    if fatura.consumo_medio_mensal_kwh <= 0:
        alertas.append(
            Alerta("erro", "Consumo mensal da fatura não informado (ou zero) — o "
                           "gerador FV não pode ser dimensionado.")
        )

    if not (0 < p.eficiencia_sistema <= 1):
        alertas.append(Alerta("erro", "Eficiência do sistema deve estar entre 0 e 1."))
    if not (0 < p.dod_efetivo() <= 1):
        alertas.append(Alerta("erro", "DoD (profundidade de descarga) deve estar entre 0 e 1."))
    if not (0 < p.fator_simultaneidade <= 1):
        alertas.append(Alerta("aviso", "Fator de simultaneidade fora do intervalo (0, 1]."))
    if p.tensao_banco_v not in (12, 24, 48):
        alertas.append(Alerta("aviso", f"Tensão de banco incomum: {p.tensao_banco_v} V "
                                       "(usual: 12, 24 ou 48 V)."))
    if p.autonomia_dias <= 0:
        alertas.append(Alerta("erro", "Autonomia deve ser maior que zero."))
    elif p.autonomia_dias > 5:
        alertas.append(Alerta("aviso", f"Autonomia de {p.autonomia_dias:.1f} dias é "
                                       "elevada e encarece muito o banco — revise se é realista."))
    return alertas


def validar_resultados(
    fatura: DadosFatura,
    baterias: ResultadoBaterias,
    fv: ResultadoFV,
) -> list[Alerta]:
    alertas: list[Alerta] = []

    consumo_diario_wh = fatura.consumo_medio_diario_kwh * 1000.0

    # Cargas críticas maiores que o próprio consumo total da fatura.
    if consumo_diario_wh > 0 and baterias.energia_diaria_wh > consumo_diario_wh:
        alertas.append(
            Alerta(
                "aviso",
                f"A energia diária das cargas críticas "
                f"({baterias.energia_diaria_kwh:.1f} kWh/dia) é MAIOR que o consumo "
                f"médio diário da fatura ({consumo_diario_wh/1000:.1f} kWh/dia). "
                "Verifique as potências/horas informadas.",
            )
        )

    # Geração instalada muito abaixo da necessária.
    if fv.geracao_diaria_estimada_wh < 0.9 * fv.geracao_diaria_necessaria_wh:
        alertas.append(
            Alerta(
                "info",
                "A geração estimada da usina ficou abaixo da necessidade calculada — "
                "considere um módulo de maior potência ou revise o performance ratio.",
            )
        )

    return alertas


def validar_area(
    fv: ResultadoFV,
    area_disponivel_m2: float | None,
) -> list[Alerta]:
    alertas: list[Alerta] = []
    if area_disponivel_m2 and area_disponivel_m2 > 0:
        if fv.area_estimada_m2 > area_disponivel_m2:
            alertas.append(
                Alerta(
                    "aviso",
                    f"A área estimada dos módulos ({fv.area_estimada_m2:.1f} m²) excede "
                    f"a área disponível informada ({area_disponivel_m2:.1f} m²).",
                )
            )
    return alertas
