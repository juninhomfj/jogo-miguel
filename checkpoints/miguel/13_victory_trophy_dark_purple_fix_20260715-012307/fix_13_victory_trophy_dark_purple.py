from collections import Counter
from pathlib import Path
import colorsys

from PIL import Image, ImageDraw

entrada = Path(
    "incoming/sprites/"
    "13_victory_trophy_cavities_clean_candidate.png"
)

saida = Path(
    "incoming/sprites/"
    "13_victory_trophy_dark_purple_fixed_candidate.png"
)

pasta = Path(
    "artifacts/frame-validation/"
    "13_victory_trophy_dark_purple_fix"
)

relatorio_path = pasta / "relatorio.txt"
mascara_path = pasta / "pixels_corrigidos.png"
preview_path = pasta / "candidato_preview.png"
comparacao_path = pasta / "comparacao_ampliada.png"
comparacao_superior_path = pasta / "comparacao_superior.png"

if not entrada.exists():
    raise SystemExit(
        f"ERRO: arquivo não encontrado: {entrada}"
    )

original = Image.open(entrada).convert("RGBA")
resultado = original.copy()

largura, altura = original.size
origem = original.load()
destino = resultado.load()

bbox_antes = original.getchannel("A").getbbox()

if bbox_antes is None:
    raise SystemExit(
        "ERRO: a imagem não possui conteúdo visível."
    )

left, top, right, bottom = bbox_antes


def eh_roxo_residual(cor):
    r, g, b, a = cor

    if a == 0:
        return False

    # Evita classificar preto e cinzas quase neutros.
    maior = max(r, g, b)
    menor = min(r, g, b)

    if maior < 28:
        return False

    if maior - menor < 12:
        return False

    h, s, v = colorsys.rgb_to_hsv(
        r / 255,
        g / 255,
        b / 255,
    )

    matiz = h * 360

    # Faixa de violeta, roxo, magenta e rosa escuro.
    return (
        275 <= matiz <= 345
        and s >= 0.34
        and v >= 0.09
        and r >= 18
        and b >= 18
        and min(r, b) >= g + 7
    )


suspeitos = []

for y in range(top, bottom):
    for x in range(left, right):
        cor = origem[x, y]

        if eh_roxo_residual(cor):
            suspeitos.append(
                {
                    "x": x,
                    "y": y,
                    "antes": cor,
                }
            )

if not suspeitos:
    raise SystemExit(
        "ERRO: nenhum resíduo roxo foi encontrado."
    )

if len(suspeitos) > 6000:
    raise SystemExit(
        "ERRO: o filtro selecionou pixels demais: "
        f"{len(suspeitos)}"
    )

suspeitos_xy = {
    (item["x"], item["y"])
    for item in suspeitos
}


def toca_transparencia(x, y):
    for ny in range(
        max(0, y - 1),
        min(altura, y + 2),
    ):
        for nx in range(
            max(0, x - 1),
            min(largura, x + 2),
        ):
            if nx == x and ny == y:
                continue

            if origem[nx, ny][3] == 0:
                return True

    return False


def brilho(cor):
    r, g, b, _ = cor
    return (
        0.2126 * r
        + 0.7152 * g
        + 0.0722 * b
    )


def distancia_quadrada(cor_a, cor_b):
    return (
        (cor_a[0] - cor_b[0]) ** 2
        + (cor_a[1] - cor_b[1]) ** 2
        + (cor_a[2] - cor_b[2]) ** 2
    )


def obter_candidatos_vizinhos(x, y):
    for raio in (1, 2, 3, 4, 5):
        candidatos = []

        for ny in range(
            max(0, y - raio),
            min(altura, y + raio + 1),
        ):
            for nx in range(
                max(0, x - raio),
                min(largura, x + raio + 1),
            ):
                if nx == x and ny == y:
                    continue

                if (nx, ny) in suspeitos_xy:
                    continue

                cor = origem[nx, ny]

                if cor[3] == 0:
                    continue

                if eh_roxo_residual(cor):
                    continue

                candidatos.append(cor)

        if candidatos:
            return candidatos

    return []


alteracoes = []
nao_resolvidos = []

for item in suspeitos:
    x = item["x"]
    y = item["y"]
    cor_original = item["antes"]

    candidatos = obter_candidatos_vizinhos(x, y)

    if not candidatos:
        nao_resolvidos.append(item)
        continue

    borda = toca_transparencia(x, y)

    # Em contornos externos, prefere cores escuras locais.
    if borda:
        candidatos_escuros = [
            cor
            for cor in candidatos
            if brilho(cor) <= 105
        ]

        if candidatos_escuros:
            candidatos = candidatos_escuros

    contagem = Counter(candidatos)
    maior_frequencia = max(contagem.values())

    frequentes = [
        cor
        for cor, quantidade in contagem.items()
        if quantidade == maior_frequencia
    ]

    substituta = min(
        frequentes,
        key=lambda cor: distancia_quadrada(
            cor_original,
            cor,
        ),
    )

    destino[x, y] = substituta

    alteracoes.append(
        {
            "x": x,
            "y": y,
            "antes": cor_original,
            "depois": substituta,
            "borda": borda,
        }
    )

if nao_resolvidos:
    raise SystemExit(
        "ERRO: alguns pixels não puderam ser corrigidos: "
        f"{len(nao_resolvidos)}"
    )

bbox_depois = resultado.getchannel("A").getbbox()

visiveis_antes = sum(
    1
    for valor in original.getchannel("A").tobytes()
    if valor > 0
)

visiveis_depois = sum(
    1
    for valor in resultado.getchannel("A").tobytes()
    if valor > 0
)

if bbox_depois != bbox_antes:
    raise SystemExit(
        "ERRO: o bounding box foi alterado: "
        f"{bbox_antes} -> {bbox_depois}"
    )

if visiveis_depois != visiveis_antes:
    raise SystemExit(
        "ERRO: a quantidade de pixels visíveis mudou: "
        f"{visiveis_antes} -> {visiveis_depois}"
    )

restantes = []

for y in range(top, bottom):
    for x in range(left, right):
        cor = destino[x, y]

        if eh_roxo_residual(cor):
            restantes.append((x, y, cor))

if restantes:
    raise SystemExit(
        "ERRO: ainda existem resíduos roxos: "
        f"{len(restantes)}"
    )

resultado.save(saida)

# Máscara dos pixels corrigidos.
mascara = Image.new(
    "RGBA",
    original.size,
    (0, 0, 0, 0),
)

mascara_pixels = mascara.load()

for item in alteracoes:
    mascara_pixels[
        item["x"],
        item["y"],
    ] = (0, 255, 255, 255)

mascara.save(mascara_path)

# Prévia em fundo escuro.
preview = Image.new(
    "RGBA",
    original.size,
    (18, 18, 18, 255),
)

preview.alpha_composite(resultado)
preview.save(preview_path)


def criar_comparacao(
    crop_box,
    destino_path,
    zoom,
):
    antes = original.crop(crop_box)
    depois = resultado.crop(crop_box)

    antes = antes.resize(
        (
            antes.width * zoom,
            antes.height * zoom,
        ),
        Image.Resampling.NEAREST,
    )

    depois = depois.resize(
        (
            depois.width * zoom,
            depois.height * zoom,
        ),
        Image.Resampling.NEAREST,
    )

    espaco = 30
    legenda = 36

    comparacao = Image.new(
        "RGBA",
        (
            antes.width * 2 + espaco,
            max(antes.height, depois.height) + legenda,
        ),
        (18, 18, 18, 255),
    )

    comparacao.alpha_composite(
        antes,
        (0, legenda),
    )

    comparacao.alpha_composite(
        depois,
        (antes.width + espaco, legenda),
    )

    draw = ImageDraw.Draw(comparacao)

    draw.text(
        (8, 9),
        "ANTES",
        fill=(255, 255, 255, 255),
    )

    draw.text(
        (antes.width + espaco + 8, 9),
        "DEPOIS",
        fill=(255, 255, 255, 255),
    )

    comparacao.save(destino_path)


margem = 10

crop_total = (
    max(0, left - margem),
    max(0, top - margem),
    min(largura, right + margem),
    min(altura, bottom + margem),
)

criar_comparacao(
    crop_total,
    comparacao_path,
    zoom=2,
)

altura_bbox = bottom - top

crop_superior = (
    max(0, left - margem),
    max(0, top - margem),
    min(largura, right + margem),
    min(
        altura,
        top + round(altura_bbox * 0.68) + margem,
    ),
)

criar_comparacao(
    crop_superior,
    comparacao_superior_path,
    zoom=3,
)

alteracoes_borda = sum(
    1
    for item in alteracoes
    if item["borda"]
)

alteracoes_internas = (
    len(alteracoes) - alteracoes_borda
)

xs = [item["x"] for item in alteracoes]
ys = [item["y"] for item in alteracoes]

bbox_corrigidos = (
    min(xs),
    min(ys),
    max(xs) + 1,
    max(ys) + 1,
)

linhas = [
    f"Entrada: {entrada}",
    f"Saída candidata: {saida}",
    f"Dimensão: {original.size}",
    f"Bounding box antes: {bbox_antes}",
    f"Bounding box depois: {bbox_depois}",
    f"Pixels visíveis: {visiveis_depois}",
    f"Pixels roxos encontrados: {len(alteracoes)}",
    f"Pixels corrigidos na borda: {alteracoes_borda}",
    f"Pixels corrigidos internamente: {alteracoes_internas}",
    "Pixels roxos restantes: 0",
    f"Bounding box das correções: {bbox_corrigidos}",
    f"Máscara: {mascara_path}",
    f"Prévia: {preview_path}",
    f"Comparação completa: {comparacao_path}",
    f"Comparação superior: {comparacao_superior_path}",
    "",
    "PRIMEIRAS CORREÇÕES:",
]

for item in sorted(
    alteracoes,
    key=lambda registro: (
        registro["y"],
        registro["x"],
    ),
)[:150]:
    linhas.append(
        f"({item['x']}, {item['y']}) | "
        f"{item['antes']} -> {item['depois']} | "
        f"borda={'sim' if item['borda'] else 'não'}"
    )

relatorio_path.write_text(
    "\n".join(linhas) + "\n",
    encoding="utf-8",
)

print("\n".join(linhas[:15]))
