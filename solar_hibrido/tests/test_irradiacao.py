"""Testes da obtenção de irradiação, com fetch_json simulado (sem rede)."""
from solar_hibrido.core.irradiacao import (
    geocodificar,
    hsp_nasa_power,
    irradiacao_fallback,
    obter_irradiacao,
)


def _fetch_nasa_ok(url, params, headers):
    if "nominatim" in url:
        return [{"lat": "-27.5954", "lon": "-48.5480"}]
    if "power.larc.nasa.gov" in url:
        valores = {m: 5.0 for m in
                   ["JAN", "FEB", "MAR", "APR", "MAY", "JUN",
                    "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"]}
        valores["ANN"] = 5.0
        return {"properties": {"parameter": {"ALLSKY_SFC_SW_DWN": valores}}}
    raise RuntimeError("URL inesperada")


def _fetch_falha(url, params, headers):
    raise ConnectionError("offline")


def test_geocodificar_ok():
    assert geocodificar("Florianópolis", "SC", _fetch_nasa_ok) == (-27.5954, -48.5480)


def test_geocodificar_falha_retorna_none():
    assert geocodificar("Xyz", "SC", _fetch_falha) is None


def test_nasa_power_parse():
    irr = hsp_nasa_power(-27.6, -48.5, _fetch_nasa_ok)
    assert irr is not None
    assert irr.fonte == "NASA POWER"
    assert len(irr.hsp_mensal) == 12
    assert irr.hsp_media_anual == 5.0


def test_nasa_power_rejeita_valores_invalidos():
    def fetch(url, params, headers):
        valores = {m: -999 for m in
                   ["JAN", "FEB", "MAR", "APR", "MAY", "JUN",
                    "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"]}
        return {"properties": {"parameter": {"ALLSKY_SFC_SW_DWN": valores}}}

    assert hsp_nasa_power(0, 0, fetch) is None


def test_fallback_por_uf():
    irr = irradiacao_fallback("SC")
    assert irr.fonte == "Tabela local (fallback)"
    assert len(irr.hsp_mensal) == 12
    assert irr.hsp_media_anual > 0


def test_obter_irradiacao_cai_para_fallback_quando_offline():
    irr = obter_irradiacao("Cidade Qualquer", "BA", _fetch_falha, usar_api=True)
    assert irr.fonte == "Tabela local (fallback)"


def test_obter_irradiacao_usa_api_quando_disponivel():
    irr = obter_irradiacao("Florianópolis", "SC", _fetch_nasa_ok, usar_api=True)
    assert irr.fonte == "NASA POWER"
