"""Obtenção da irradiação solar (HSP) da cidade informada.

Fluxo:
  1. Geocodifica a cidade (Nominatim / OpenStreetMap) -> lat/long.
  2. Consulta a irradiação por coordenadas (NASA POWER como primária; PVGIS como
     alternativa), retornando HSP mês a mês e média anual.
  3. Se qualquer etapa falhar (offline, cidade não encontrada, timeout), cai para
     a base local de HSP por UF (data/hsp_brasil.py).

As funções de rede recebem um `fetch_json` injetável para facilitar os testes
(sem depender de acesso à internet). O módulo NÃO depende de Streamlit; o cache
de chamadas fica na camada de UI (st.cache_data).
"""
from __future__ import annotations

import json
from typing import Callable, Optional
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from .modelos import Irradiacao
from ..data import hsp_brasil

FetchJson = Callable[[str, dict, dict], dict]

_USER_AGENT = "dimensionamento-fv-hibrido/1.0 (uso educacional)"
_TIMEOUT = 15


def _fetch_json_urllib(url: str, params: dict, headers: dict) -> dict:
    """Implementação padrão de requisição HTTP GET retornando JSON."""
    qs = urlencode(params)
    full = f"{url}?{qs}" if params else url
    req = Request(full, headers={"User-Agent": _USER_AGENT, **headers})
    with urlopen(req, timeout=_TIMEOUT) as resp:  # noqa: S310 (URLs fixas conhecidas)
        return json.loads(resp.read().decode("utf-8"))


def geocodificar(
    cidade: str,
    uf: str = "",
    fetch_json: FetchJson = _fetch_json_urllib,
) -> Optional[tuple[float, float]]:
    """Retorna (lat, lon) da cidade via Nominatim, ou None se não encontrada."""
    consulta = f"{cidade}, {uf}, Brasil" if uf else f"{cidade}, Brasil"
    try:
        dados = fetch_json(
            "https://nominatim.openstreetmap.org/search",
            {"q": consulta, "format": "json", "limit": 1, "countrycodes": "br"},
            {},
        )
    except Exception:
        return None
    if not dados:
        return None
    try:
        return float(dados[0]["lat"]), float(dados[0]["lon"])
    except (KeyError, IndexError, ValueError, TypeError):
        return None


def hsp_nasa_power(
    lat: float,
    lon: float,
    fetch_json: FetchJson = _fetch_json_urllib,
) -> Optional[Irradiacao]:
    """Consulta a NASA POWER (climatologia) — HSP em kWh/m²/dia mês a mês.

    Parâmetro ALLSKY_SFC_SW_DWN já vem em kWh/m²/dia, que é exatamente o HSP.
    """
    try:
        dados = fetch_json(
            "https://power.larc.nasa.gov/api/temporal/climatology/point",
            {
                "parameters": "ALLSKY_SFC_SW_DWN",
                "community": "RE",
                "latitude": lat,
                "longitude": lon,
                "format": "JSON",
            },
            {},
        )
        mensal_dict = dados["properties"]["parameter"]["ALLSKY_SFC_SW_DWN"]
    except Exception:
        return None

    meses = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN",
             "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"]
    try:
        hsp_mensal = [float(mensal_dict[m]) for m in meses]
    except (KeyError, ValueError, TypeError):
        return None

    # Valores inválidos (NASA usa -999 como preenchimento).
    if any(v < 0 for v in hsp_mensal):
        return None

    media = mensal_dict.get("ANN")
    media_anual = (
        float(media) if media not in (None, -999) else sum(hsp_mensal) / 12.0
    )
    return Irradiacao(
        hsp_mensal=[round(v, 3) for v in hsp_mensal],
        hsp_media_anual=round(media_anual, 3),
        fonte="NASA POWER",
        latitude=lat,
        longitude=lon,
    )


def hsp_pvgis(
    lat: float,
    lon: float,
    fetch_json: FetchJson = _fetch_json_urllib,
) -> Optional[Irradiacao]:
    """Consulta o PVGIS (MRcalc) — irradiação mensal no plano horizontal.

    O PVGIS retorna a irradiação mensal acumulada (kWh/m²/mês); dividindo pela
    quantidade de dias do mês obtém-se o HSP diário médio.
    """
    dias_mes = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
    try:
        dados = fetch_json(
            "https://re.jrc.ec.europa.eu/api/v5_2/MRcalc",
            {
                "lat": lat,
                "lon": lon,
                "horirrad": 1,
                "startyear": 2016,
                "endyear": 2020,
                "outputformat": "json",
            },
            {},
        )
        registros = dados["outputs"]["monthly"]
    except Exception:
        return None

    # Média de "H(h)_m" (kWh/m²/mês) por mês do calendário, ao longo dos anos.
    soma = [0.0] * 12
    contagem = [0] * 12
    try:
        for r in registros:
            m = int(r["month"]) - 1
            soma[m] += float(r["H(h)_m"])
            contagem[m] += 1
    except (KeyError, ValueError, TypeError):
        return None
    if any(c == 0 for c in contagem):
        return None

    hsp_mensal = [
        round((soma[m] / contagem[m]) / dias_mes[m], 3) for m in range(12)
    ]
    return Irradiacao(
        hsp_mensal=hsp_mensal,
        hsp_media_anual=round(sum(hsp_mensal) / 12.0, 3),
        fonte="PVGIS",
        latitude=lat,
        longitude=lon,
    )


def irradiacao_fallback(uf: str) -> Irradiacao:
    """Base local de HSP por UF (usada quando as APIs falham)."""
    mensal = hsp_brasil.perfil_mensal(uf)
    return Irradiacao(
        hsp_mensal=mensal,
        hsp_media_anual=round(sum(mensal) / 12.0, 3),
        fonte="Tabela local (fallback)",
    )


def obter_irradiacao(
    cidade: str,
    uf: str,
    fetch_json: FetchJson = _fetch_json_urllib,
    usar_api: bool = True,
) -> Irradiacao:
    """Ponto de entrada: tenta APIs e cai para a base local em caso de falha.

    Ordem: geocodificar -> NASA POWER -> PVGIS -> tabela local por UF.
    """
    if usar_api:
        coord = geocodificar(cidade, uf, fetch_json)
        if coord is not None:
            lat, lon = coord
            for consulta in (hsp_nasa_power, hsp_pvgis):
                resultado = consulta(lat, lon, fetch_json)
                if resultado is not None:
                    return resultado
    return irradiacao_fallback(uf)
