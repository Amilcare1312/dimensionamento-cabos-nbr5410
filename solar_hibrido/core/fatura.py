"""Extração de dados da fatura de energia (PDF) com fallback para input manual.

A extração usa `pdfplumber` quando disponível. O parsing de faturas brasileiras
varia muito entre distribuidoras, então a estratégia é heurística/best-effort:
extrai o texto, procura padrões comuns (consumo em kWh, UF, distribuidora) e
devolve o que conseguir. Qualquer campo não identificado deve ser confirmado
manualmente pelo usuário na interface.
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import Optional

from .modelos import DadosFatura


@dataclass
class ResultadoExtracao:
    dados: DadosFatura
    texto_bruto: str = ""
    campos_encontrados: list[str] = field(default_factory=list)
    erro: Optional[str] = None

    @property
    def sucesso(self) -> bool:
        return self.erro is None


# Siglas de UF para detecção no texto.
_UFS = [
    "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS",
    "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC",
    "SP", "SE", "TO",
]


def extrair_texto_pdf(caminho_ou_buffer) -> str:
    """Extrai o texto de um PDF usando pdfplumber. Lança ImportError se ausente."""
    import pdfplumber  # importado sob demanda para não ser dependência dura dos testes

    partes: list[str] = []
    with pdfplumber.open(caminho_ou_buffer) as pdf:
        for pagina in pdf.pages:
            texto = pagina.extract_text() or ""
            partes.append(texto)
    return "\n".join(partes)


def _achar_consumos_kwh(texto: str) -> list[float]:
    """Procura valores de consumo em kWh no histórico da fatura.

    Faturas costumam trazer uma tabela de histórico de consumo (12 meses). Aqui
    capturamos números seguidos de 'kWh' e retornamos os plausíveis (10–100000).
    """
    valores: list[float] = []
    for m in re.finditer(r"([\d.,]+)\s*kWh", texto, flags=re.IGNORECASE):
        bruto = m.group(1)
        # Normaliza formato brasileiro (1.234,56 -> 1234.56).
        normal = bruto.replace(".", "").replace(",", ".")
        try:
            v = float(normal)
        except ValueError:
            continue
        if 10 <= v <= 100000:
            valores.append(round(v, 2))
    return valores


def _achar_uf(texto: str) -> str:
    # Procura padrão "Cidade - UF" ou "/UF" isolado.
    for uf in _UFS:
        if re.search(rf"[-/\s]{uf}\b", texto):
            return uf
    return ""


def _achar_distribuidora(texto: str) -> str:
    conhecidas = [
        "CELESC", "CPFL", "ENEL", "LIGHT", "COPEL", "CEMIG", "COELBA", "ENERGISA",
        "EQUATORIAL", "NEOENERGIA", "EDP", "RGE", "ELEKTRO", "COSERN", "CELPE",
        "CEEE", "AMPLA", "COELCE",
    ]
    up = texto.upper()
    for d in conhecidas:
        if d in up:
            return d
    return ""


def parse_fatura_pdf(caminho_ou_buffer) -> ResultadoExtracao:
    """Tenta extrair dados de uma fatura em PDF. Nunca lança: retorna erro no objeto."""
    try:
        texto = extrair_texto_pdf(caminho_ou_buffer)
    except ImportError:
        return ResultadoExtracao(
            dados=DadosFatura(),
            erro="Biblioteca 'pdfplumber' não instalada — use o preenchimento manual.",
        )
    except Exception as exc:  # PDF ilegível / protegido / corrompido
        return ResultadoExtracao(
            dados=DadosFatura(),
            erro=f"Não foi possível ler o PDF ({exc}). Use o preenchimento manual.",
        )

    if not texto.strip():
        return ResultadoExtracao(
            dados=DadosFatura(),
            texto_bruto=texto,
            erro="PDF sem texto extraível (provavelmente digitalizado/imagem). "
                 "Use o preenchimento manual.",
        )

    consumos = _achar_consumos_kwh(texto)
    uf = _achar_uf(texto)
    distribuidora = _achar_distribuidora(texto)

    encontrados: list[str] = []
    if consumos:
        encontrados.append("consumo (kWh)")
    if uf:
        encontrados.append("UF")
    if distribuidora:
        encontrados.append("distribuidora")

    dados = DadosFatura(
        distribuidora=distribuidora,
        uf=uf,
        consumos_mensais_kwh=consumos[:12],  # no máximo 12 meses
    )
    return ResultadoExtracao(
        dados=dados,
        texto_bruto=texto,
        campos_encontrados=encontrados,
    )
