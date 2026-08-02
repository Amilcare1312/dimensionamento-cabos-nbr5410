"""Modelos de dados (dataclasses) usados nas entradas e saídas do dimensionamento.

Manter as estruturas aqui deixa as assinaturas das funções de cálculo estáveis e
facilita a escrita de testes com casos conhecidos.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import Optional


class TipoBateria(str, Enum):
    LITIO = "litio"          # LiFePO4
    CHUMBO = "chumbo"        # chumbo-ácido


# Valores de referência por tecnologia de bateria.
# DoD = profundidade de descarga admissível; eficiência de ida-e-volta (round-trip).
PARAMETROS_BATERIA = {
    TipoBateria.LITIO: {"dod": 0.80, "eficiencia": 0.95, "vida_ciclos": 6000},
    TipoBateria.CHUMBO: {"dod": 0.50, "eficiencia": 0.85, "vida_ciclos": 1200},
}


class CriterioHSP(str, Enum):
    MES_CRITICO = "mes_critico"   # dimensionamento conservador (menor HSP do ano)
    MEDIA_ANUAL = "media_anual"   # dimensionamento pela média anual


class CriterioFV(str, Enum):
    CONSUMO_TOTAL = "consumo_total"                 # FV cobre o consumo total da fatura
    CONSUMO_MAIS_RECARGA = "consumo_mais_recarga"   # + energia diária para recarregar o banco


@dataclass
class Carga:
    """Uma linha da lista de cargas prioritárias."""
    nome: str
    potencia_w: float                 # potência ativa (em regime) por unidade
    horas_dia: float                  # horas de uso por dia
    quantidade: int = 1
    critica: bool = True              # True = deve ser atendida no blackout (entra no banco)
    potencia_surto_w: Optional[float] = None  # potência de partida/surto por unidade (motores etc.)

    @property
    def potencia_total_w(self) -> float:
        return self.potencia_w * self.quantidade

    @property
    def surto_total_w(self) -> float:
        """Surto total do grupo. Se não informado, assume o próprio valor de regime."""
        base = self.potencia_surto_w if self.potencia_surto_w else self.potencia_w
        return base * self.quantidade

    @property
    def energia_dia_wh(self) -> float:
        return self.potencia_total_w * self.horas_dia


@dataclass
class ParametrosProjeto:
    """Parâmetros de projeto com padrões editáveis."""
    autonomia_dias: float = 1.0                     # dias sem geração/rede
    tipo_bateria: TipoBateria = TipoBateria.LITIO
    dod: Optional[float] = None                     # sobrepõe o padrão da tecnologia se informado
    eficiencia_bateria: Optional[float] = None      # idem
    tensao_banco_v: int = 48                        # 12 / 24 / 48 V
    eficiencia_sistema: float = 0.92                # inversor + cabeamento + perdas (0,90–0,95)
    fator_simultaneidade: float = 0.7               # nem tudo liga ao mesmo tempo
    performance_ratio: float = 0.78                 # PR do gerador FV (0,75–0,80)
    potencia_modulo_wp: float = 550.0               # módulo FV de referência
    eficiencia_modulo: float = 0.21                 # ~21% (usado para estimar área)
    margem_inversor: float = 0.25                   # margem de segurança sobre a carga (20–25%)
    fdi_min: float = 1.10                           # fator de dimensionamento inversor (Pfv/Pinv)
    fdi_max: float = 1.30
    criterio_hsp: CriterioHSP = CriterioHSP.MES_CRITICO
    criterio_fv: CriterioFV = CriterioFV.CONSUMO_TOTAL
    capacidade_unidade_bateria_wh: float = 5120.0   # unidade comercial de referência (5,12 kWh)
    tensao_unidade_bateria_v: float = 51.2          # tensão nominal da unidade comercial
    area_disponivel_m2: Optional[float] = None      # opcional, para validação de telhado/solo

    def dod_efetivo(self) -> float:
        return self.dod if self.dod is not None else PARAMETROS_BATERIA[self.tipo_bateria]["dod"]

    def eficiencia_bateria_efetiva(self) -> float:
        if self.eficiencia_bateria is not None:
            return self.eficiencia_bateria
        return PARAMETROS_BATERIA[self.tipo_bateria]["eficiencia"]


@dataclass
class DadosFatura:
    """Dados extraídos da fatura (ou preenchidos manualmente)."""
    distribuidora: str = ""
    classe_tarifaria: str = "B"                     # grupo B ou A
    cidade: str = ""
    uf: str = ""
    tensao_fornecimento: str = ""                   # ex.: "Bifásico 220V"
    consumos_mensais_kwh: list[float] = field(default_factory=list)  # idealmente 12 meses

    @property
    def consumo_medio_mensal_kwh(self) -> float:
        if not self.consumos_mensais_kwh:
            return 0.0
        return sum(self.consumos_mensais_kwh) / len(self.consumos_mensais_kwh)

    @property
    def consumo_medio_diario_kwh(self) -> float:
        # Base de 30 dias/mês (convenção usual em faturas).
        return self.consumo_medio_mensal_kwh / 30.0


@dataclass
class Irradiacao:
    """Resultado da consulta de irradiação (HSP em kWh/m²/dia)."""
    hsp_mensal: list[float]        # 12 valores, jan..dez
    hsp_media_anual: float
    fonte: str                     # "PVGIS", "NASA POWER", "Tabela local (fallback)"
    latitude: Optional[float] = None
    longitude: Optional[float] = None

    @property
    def hsp_mes_critico(self) -> float:
        return min(self.hsp_mensal) if self.hsp_mensal else self.hsp_media_anual

    def hsp_para_criterio(self, criterio: CriterioHSP) -> float:
        if criterio == CriterioHSP.MES_CRITICO:
            return self.hsp_mes_critico
        return self.hsp_media_anual
