from collections import deque
from pathlib import Path

from PIL import Image

entrada = Path(
    "incoming/sprites/"
    "10_dust_3_chroma_sem_fundo_conectado.png"
)

saida = Path(
    "incoming/sprites/"
    "10_dust_3_limpo_final.png"
)

preview_path = Path(
    "artifacts/frame-validation/"
    "10_dust_3_final_cleanup/"
    "10_dust_3_limpo_final_preview.png"
)

relatorio_path = Path(
    "artifacts/frame-validation/"
    "10_dust_3_final_cleanup/"
    "relatorio.txt"
)

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

# C00 a C11 possuem pelo menos 100 pixels.
# C12 possui somente 2 pixels e será descartado.
selecionados = [
    componente
    for componente in componentes
    if (
        componente["pixels"] >= 100
        and not componente["toca_borda"]
    )
]

if len(selecionados) != 12:
    raise SystemExit(
        "ERRO: eram esperados 12 componentes válidos, "
        f"mas foram selecionados {len(selecionados)}."
    )


def eh_chroma_restante(r, g, b, a):
    return (
        a > 0
        and r >= 130
        and b >= 130
        and g <= 150
        and r >= g + 45
        and b >= g + 45
    )


resultado = Image.new(
    "RGBA",
    imagem.size,
    (0, 0, 0, 0),
)

origem = imagem.load()
destino = resultado.load()

pixels_preservados = 0
chroma_removido = 0

print("Componentes preservados:")

for indice, componente in enumerate(selecionados):
    print(
        f"C{indice:02d} | "
        f"pixels={componente['pixels']} | "
        f"bbox={componente['bbox']}"
    )

    for x, y in componente["coords"]:
        r, g, b, a = origem[x, y]

        if eh_chroma_restante(r, g, b, a):
            chroma_removido += 1
            continue

        destino[x, y] = (r, g, b, a)
        pixels_preservados += 1

bbox_final = resultado.getchannel("A").getbbox()

if bbox_final is None:
    raise SystemExit(
        "ERRO: o resultado ficou transparente."
    )

chroma_restante = 0

for r, g, b, a in resultado.getdata():
    if eh_chroma_restante(r, g, b, a):
        chroma_restante += 1

if chroma_restante != 0:
    raise SystemExit(
        "ERRO: ainda existem pixels de chroma: "
        f"{chroma_restante}"
    )

resultado.save(saida)

preview = Image.new(
    "RGBA",
    resultado.size,
    (20, 20, 20, 255),
)

preview.alpha_composite(resultado)
preview.save(preview_path)

linhas = [
    f"Entrada: {entrada}",
    f"Saída: {saida}",
    f"Dimensão: {largura}x{altura}",
    f"Componentes encontrados inicialmente: {len(componentes)}",
    f"Componentes preservados: {len(selecionados)}",
    (
        "Componentes descartados: "
        f"{len(componentes) - len(selecionados)}"
    ),
    f"Pixels de chroma removidos: {chroma_removido}",
    f"Pixels de chroma restantes: {chroma_restante}",
    f"Pixels visíveis preservados: {pixels_preservados}",
    f"Bounding box final: {bbox_final}",
    f"Prévia: {preview_path}",
]

relatorio_path.write_text(
    "\n".join(linhas) + "\n",
    encoding="utf-8",
)

print()
print("\n".join(linhas))
