from collections import deque
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

entrada = Path(
    "incoming/sprites/"
    "10_dust_3_chroma_sem_fundo_conectado.png"
)

pasta = Path(
    "artifacts/frame-validation/"
    "10_dust_3_component_audit"
)

relatorio_path = pasta / "relatorio_componentes.txt"
anotada_path = pasta / "componentes_anotados.png"
folha_path = pasta / "folha_componentes.png"
chroma_path = pasta / "chroma_restante_destacado.png"

if not entrada.exists():
    raise SystemExit(
        f"ERRO: arquivo não encontrado: {entrada}"
    )

imagem = Image.open(entrada).convert("RGBA")
largura, altura = imagem.size
alpha = imagem.getchannel("A")
dados_alpha = alpha.tobytes()

visiveis = {
    indice
    for indice, valor in enumerate(dados_alpha)
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

linhas = [
    f"Arquivo: {entrada}",
    f"Dimensão: {largura}x{altura}",
    (
        "Bounding box total: "
        f"{imagem.getchannel('A').getbbox()}"
    ),
    f"Pixels visíveis: {sum(dados_alpha)} / 255",
    f"Componentes encontrados: {len(componentes)}",
    "",
    "MAIORES COMPONENTES:",
]

for indice, componente in enumerate(componentes[:30]):
    left, top, right, bottom = componente["bbox"]

    linhas.append(
        f"C{indice:02d} | "
        f"pixels={componente['pixels']} | "
        f"bbox=({left}, {top}, {right}, {bottom}) | "
        f"tamanho={right-left}x{bottom-top} | "
        f"borda="
        f"{'sim' if componente['toca_borda'] else 'não'}"
    )

relatorio_path.write_text(
    "\n".join(linhas) + "\n",
    encoding="utf-8",
)

fonte = ImageFont.load_default()

anotada = Image.new(
    "RGBA",
    imagem.size,
    (20, 20, 20, 255),
)
anotada.alpha_composite(imagem)

draw = ImageDraw.Draw(anotada)

for indice, componente in enumerate(componentes[:30]):
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

quantidade_folha = min(15, len(componentes))
colunas = 3
tile_w = 240
tile_h = 220
linhas_grid = max(
    1,
    (quantidade_folha + colunas - 1) // colunas,
)

folha = Image.new(
    "RGBA",
    (
        colunas * tile_w,
        linhas_grid * tile_h,
    ),
    (25, 25, 25, 255),
)

draw_folha = ImageDraw.Draw(folha)

for indice, componente in enumerate(
    componentes[:quantidade_folha]
):
    coluna = indice % colunas
    linha = indice // colunas

    offset_x = coluna * tile_w
    offset_y = linha * tile_h

    left, top, right, bottom = componente["bbox"]
    recorte = imagem.crop((left, top, right, bottom))

    max_w = tile_w - 30
    max_h = tile_h - 70

    escala = min(
        max_w / max(1, recorte.width),
        max_h / max(1, recorte.height),
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

    destino_x = (
        offset_x + (tile_w - novo_w) // 2
    )
    destino_y = (
        offset_y + 35
        + (max_h - novo_h) // 2
    )

    folha.alpha_composite(
        recorte,
        (destino_x, destino_y),
    )

    draw_folha.rectangle(
        (
            offset_x + 7,
            offset_y + 7,
            offset_x + tile_w - 7,
            offset_y + tile_h - 7,
        ),
        outline=(90, 150, 255, 255),
        width=2,
    )

    draw_folha.text(
        (offset_x + 12, offset_y + 12),
        (
            f"C{indice:02d} | "
            f"{componente['pixels']} px"
        ),
        fill=(255, 255, 255, 255),
        font=fonte,
    )

    draw_folha.text(
        (offset_x + 12, offset_y + tile_h - 25),
        (
            f"{right-left}x{bottom-top} "
            f"@ ({left},{top})"
        ),
        fill=(190, 220, 255, 255),
        font=fonte,
    )

folha.save(folha_path)

# Localiza os candidatos magenta não removidos.
def eh_chroma(r, g, b, a):
    return (
        a > 0
        and r >= 130
        and b >= 130
        and g <= 150
        and r >= g + 45
        and b >= g + 45
    )

chroma_preview = Image.new(
    "RGBA",
    imagem.size,
    (20, 20, 20, 255),
)
chroma_preview.alpha_composite(imagem)
chroma_pixels = chroma_preview.load()
origem_pixels = imagem.load()

chroma_restante = []

for y in range(altura):
    for x in range(largura):
        r, g, b, a = origem_pixels[x, y]

        if eh_chroma(r, g, b, a):
            chroma_pixels[x, y] = (
                0, 255, 255, 255
            )
            chroma_restante.append((x, y, r, g, b))

chroma_preview.save(chroma_path)

print("\n".join(linhas))
print()
print(
    "Pixels candidatos a chroma restantes:",
    len(chroma_restante),
)

for indice, item in enumerate(chroma_restante[:30]):
    x, y, r, g, b = item
    print(
        f"M{indice:02d} | "
        f"posição=({x}, {y}) | "
        f"cor=({r}, {g}, {b})"
    )

print()
print("Relatório:", relatorio_path)
print("Componentes anotados:", anotada_path)
print("Folha:", folha_path)
print("Chroma restante:", chroma_path)
