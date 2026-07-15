from collections import deque
from pathlib import Path

from PIL import Image

entrada = Path(
    "incoming/sprites/"
    "12_hurt_chroma_sem_fundo_conectado.png"
)

saida = Path(
    "incoming/sprites/12_hurt_limpo_final.png"
)

preview_path = Path(
    "artifacts/frame-validation/"
    "12_hurt_final_cleanup/"
    "12_hurt_limpo_final_preview.png"
)

relatorio_path = Path(
    "artifacts/frame-validation/"
    "12_hurt_final_cleanup/"
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

# C00 = Miguel
# C01 = estrela principal
# C02 = pequeno fragmento do impacto
selecionados = [
    componente
    for componente in componentes
    if (
        componente["pixels"] >= 100
        and not componente["toca_borda"]
    )
]

if len(componentes) != 3:
    raise SystemExit(
        "ERRO: eram esperados exatamente 3 componentes, "
        f"mas foram encontrados {len(componentes)}."
    )

if len(selecionados) != 3:
    raise SystemExit(
        "ERRO: eram esperados 3 componentes válidos, "
        f"mas foram selecionados {len(selecionados)}."
    )


def eh_chroma(r, g, b, a):
    return (
        a > 0
        and r >= 130
        and b >= 130
        and g <= 155
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

        if eh_chroma(r, g, b, a):
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

for y in range(altura):
    for x in range(largura):
        r, g, b, a = destino[x, y]

        if eh_chroma(r, g, b, a):
            chroma_restante += 1

if chroma_removido != 32:
    raise SystemExit(
        "ERRO: eram esperados 32 pixels de chroma, "
        f"mas foram removidos {chroma_removido}."
    )

if chroma_restante != 0:
    raise SystemExit(
        "ERRO: ainda existem pixels de chroma: "
        f"{chroma_restante}"
    )

bbox_esperado = (437, 365, 812, 902)

if bbox_final != bbox_esperado:
    raise SystemExit(
        "ERRO: bounding box inesperado: "
        f"{bbox_final}; esperado {bbox_esperado}."
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
    (
        "Componentes encontrados inicialmente: "
        f"{len(componentes)}"
    ),
    (
        "Componentes preservados: "
        f"{len(selecionados)}"
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
