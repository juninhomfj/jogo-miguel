from collections import deque
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

entrada = Path(
    "incoming/sprites/"
    "12_hurt_chroma_sem_fundo_conectado.png"
)

pasta = Path(
    "artifacts/frame-validation/"
    "12_hurt_component_audit"
)

relatorio = pasta / "relatorio_componentes.txt"
anotada_path = pasta / "componentes_anotados.png"
chroma_path = pasta / "chroma_restante_destacado.png"
folha_path = pasta / "folha_componentes.png"

if not entrada.exists():
    raise SystemExit(
        f"ERRO: arquivo não encontrado: {entrada}"
    )

imagem = Image.open(entrada).convert("RGBA")
largura, altura = imagem.size
alpha = imagem.getchannel("A")

visiveis = {
    indice
    for indice, valor in enumerate(alpha.tobytes())
    if valor > 0
}

componentes = []

while visiveis:
    inicio = visiveis.pop()
    fila = deque([inicio])

    coordenadas = []
    min_x = largura
    min_y = altura
    max_x = -1
    max_y = -1
    toca_borda = False

    while fila:
        indice = fila.popleft()
        y, x = divmod(indice, largura)

        coordenadas.append((x, y))

        min_x = min(min_x, x)
        min_y = min(min_y, y)
        max_x = max(max_x, x)
        max_y = max(max_y, y)

        if (
            x == 0
            or y == 0
            or x == largura - 1
            or y == altura - 1
        ):
            toca_borda = True

        for nx, ny in (
            (x - 1, y),
            (x + 1, y),
            (x, y - 1),
            (x, y + 1),
        ):
            if not (
                0 <= nx < largura
                and 0 <= ny < altura
            ):
                continue

            vizinho = ny * largura + nx

            if vizinho in visiveis:
                visiveis.remove(vizinho)
                fila.append(vizinho)

    componentes.append(
        {
            "pixels": len(coordenadas),
            "coords": coordenadas,
            "bbox": (
                min_x,
                min_y,
                max_x + 1,
                max_y + 1,
            ),
            "toca_borda": toca_borda,
        }
    )

componentes.sort(
    key=lambda item: item["pixels"],
    reverse=True,
)

bbox_total = imagem.getchannel("A").getbbox()
pixels_visiveis = sum(
    1
    for valor in alpha.tobytes()
    if valor > 0
)

linhas = [
    f"Arquivo: {entrada}",
    f"Dimensão: {largura}x{altura}",
    f"Bounding box total: {bbox_total}",
    f"Pixels visíveis: {pixels_visiveis}",
    f"Componentes encontrados: {len(componentes)}",
    "",
    "MAIORES COMPONENTES:",
]

for indice, componente in enumerate(componentes[:25]):
    left, top, right, bottom = componente["bbox"]

    linhas.append(
        f"C{indice:02d} | "
        f"pixels={componente['pixels']} | "
        f"bbox=({left}, {top}, {right}, {bottom}) | "
        f"tamanho={right-left}x{bottom-top} | "
        f"borda="
        f"{'sim' if componente['toca_borda'] else 'não'}"
    )

fonte = ImageFont.load_default()

anotada = Image.new(
    "RGBA",
    imagem.size,
    (20, 20, 20, 255),
)
anotada.alpha_composite(imagem)
draw = ImageDraw.Draw(anotada)

for indice, componente in enumerate(componentes[:25]):
    left, top, right, bottom = componente["bbox"]

    draw.rectangle(
        (left, top, right - 1, bottom - 1),
        outline=(0, 255, 0, 255),
        width=3,
    )

    draw.text(
        (left, max(0, top - 13)),
        f"C{indice:02d}",
        fill=(255, 255, 255, 255),
        font=fonte,
    )

anotada.save(anotada_path)


def eh_chroma(r, g, b, a):
    return (
        a > 0
        and r >= 130
        and b >= 130
        and g <= 155
        and r >= g + 45
        and b >= g + 45
    )


chroma_preview = Image.new(
    "RGBA",
    imagem.size,
    (20, 20, 20, 255),
)
chroma_preview.alpha_composite(imagem)

origem = imagem.load()
destino_chroma = chroma_preview.load()
chroma_restante = []

for y in range(altura):
    for x in range(largura):
        r, g, b, a = origem[x, y]

        if eh_chroma(r, g, b, a):
            destino_chroma[x, y] = (
                0, 255, 255, 255
            )
            chroma_restante.append(
                (x, y, r, g, b)
            )

chroma_preview.save(chroma_path)

linhas.extend([
    "",
    (
        "Pixels candidatos a chroma restantes: "
        f"{len(chroma_restante)}"
    ),
])

for indice, item in enumerate(chroma_restante[:50]):
    x, y, r, g, b = item

    linhas.append(
        f"M{indice:02d} | "
        f"posição=({x}, {y}) | "
        f"cor=({r}, {g}, {b})"
    )

relatorio.write_text(
    "\n".join(linhas) + "\n",
    encoding="utf-8",
)

# Folha dos maiores componentes.
quantidade = min(12, len(componentes))
colunas = 3
tile_w = 230
tile_h = 210
linhas_grid = max(
    1,
    (quantidade + colunas - 1) // colunas,
)

folha = Image.new(
    "RGBA",
    (colunas * tile_w, linhas_grid * tile_h),
    (25, 25, 25, 255),
)
draw_folha = ImageDraw.Draw(folha)

for indice, componente in enumerate(
    componentes[:quantidade]
):
    coluna = indice % colunas
    linha = indice // colunas

    ox = coluna * tile_w
    oy = linha * tile_h

    left, top, right, bottom = componente["bbox"]
    recorte = imagem.crop(
        (left, top, right, bottom)
    )

    escala = min(
        (tile_w - 35) / max(1, recorte.width),
        (tile_h - 70) / max(1, recorte.height),
        1,
    )

    novo_w = max(
        1,
        round(recorte.width * escala),
    )
    novo_h = max(
        1,
        round(recorte.height * escala),
    )

    recorte = recorte.resize(
        (novo_w, novo_h),
        Image.Resampling.NEAREST,
    )

    px = ox + (tile_w - novo_w) // 2
    py = oy + 35 + (
        tile_h - 70 - novo_h
    ) // 2

    folha.alpha_composite(recorte, (px, py))

    draw_folha.rectangle(
        (
            ox + 7,
            oy + 7,
            ox + tile_w - 7,
            oy + tile_h - 7,
        ),
        outline=(80, 140, 255, 255),
        width=2,
    )

    draw_folha.text(
        (ox + 12, oy + 12),
        (
            f"C{indice:02d} | "
            f"{componente['pixels']} px"
        ),
        fill=(255, 255, 255, 255),
        font=fonte,
    )

    draw_folha.text(
        (ox + 12, oy + tile_h - 24),
        f"{right-left}x{bottom-top}",
        fill=(190, 220, 255, 255),
        font=fonte,
    )

folha.save(folha_path)

print("\n".join(linhas))
print()
print("Relatório:", relatorio)
print("Componentes anotados:", anotada_path)
print("Chroma destacado:", chroma_path)
print("Folha:", folha_path)
