"""Base local de irradiação (HSP) por estado brasileiro — usada como *fallback*.

Valores de HSP médio anual (kWh/m²/dia, plano horizontal) aproximados a partir do
Atlas Brasileiro de Energia Solar / CRESESB. Servem apenas quando as APIs de
irradiação (PVGIS / NASA POWER) estão indisponíveis. Para maior precisão o app
consulta a API pela latitude/longitude geocodificada da cidade.

O perfil mensal é estimado aplicando uma forma sazonal normalizada (média = 1) ao
valor anual, diferenciando estados equatoriais (perfil mais plano) dos estados a
sul (verão do Hemisfério Sul, dez–fev, mais ensolarado).
"""
from __future__ import annotations

# HSP médio anual aproximado por UF (kWh/m²/dia).
HSP_ANUAL_UF: dict[str, float] = {
    "AC": 4.6, "AL": 5.6, "AP": 5.0, "AM": 4.5, "BA": 5.6, "CE": 5.8,
    "DF": 5.4, "ES": 5.2, "GO": 5.4, "MA": 5.4, "MT": 5.3, "MS": 5.3,
    "MG": 5.4, "PA": 4.9, "PB": 5.7, "PR": 4.8, "PE": 5.6, "PI": 5.7,
    "RJ": 5.1, "RN": 5.9, "RS": 4.9, "RO": 4.8, "RR": 4.9, "SC": 4.6,
    "SP": 5.0, "SE": 5.6, "TO": 5.4,
}

# Capital de cada UF (para exibição / geocodificação de reserva).
CAPITAL_UF: dict[str, str] = {
    "AC": "Rio Branco", "AL": "Maceió", "AP": "Macapá", "AM": "Manaus",
    "BA": "Salvador", "CE": "Fortaleza", "DF": "Brasília", "ES": "Vitória",
    "GO": "Goiânia", "MA": "São Luís", "MT": "Cuiabá", "MS": "Campo Grande",
    "MG": "Belo Horizonte", "PA": "Belém", "PB": "João Pessoa", "PR": "Curitiba",
    "PE": "Recife", "PI": "Teresina", "RJ": "Rio de Janeiro", "RN": "Natal",
    "RS": "Porto Alegre", "RO": "Porto Velho", "RR": "Boa Vista",
    "SC": "Florianópolis", "SP": "São Paulo", "SE": "Aracaju", "TO": "Palmas",
}

# Estados equatoriais / próximos à linha do Equador (sazonalidade mais plana).
UF_EQUATORIAIS = {"AC", "AM", "AP", "PA", "RR", "RO", "MA", "PI", "CE", "RN",
                  "PB", "PE", "AL", "SE", "BA", "TO"}

# Formas sazonais normalizadas (serão renormalizadas para média 1 no código).
_FORMA_SUL = [1.20, 1.15, 1.10, 1.00, 0.85, 0.78, 0.82, 0.95, 1.00, 1.10, 1.15, 1.20]
_FORMA_EQUATORIAL = [0.95, 0.92, 0.95, 0.95, 1.00, 1.03, 1.08, 1.10, 1.08, 1.05, 1.00, 0.95]


def _normalizar(forma: list[float]) -> list[float]:
    media = sum(forma) / len(forma)
    return [v / media for v in forma]


def perfil_mensal(uf: str) -> list[float]:
    """Retorna os 12 valores de HSP (jan..dez) estimados para a UF."""
    uf = uf.upper().strip()
    anual = HSP_ANUAL_UF.get(uf)
    if anual is None:
        # Média nacional aproximada como último recurso.
        anual = sum(HSP_ANUAL_UF.values()) / len(HSP_ANUAL_UF)
    forma = _FORMA_EQUATORIAL if uf in UF_EQUATORIAIS else _FORMA_SUL
    forma_norm = _normalizar(forma)
    return [round(anual * f, 3) for f in forma_norm]


def hsp_anual(uf: str) -> float:
    uf = uf.upper().strip()
    return HSP_ANUAL_UF.get(uf, sum(HSP_ANUAL_UF.values()) / len(HSP_ANUAL_UF))
