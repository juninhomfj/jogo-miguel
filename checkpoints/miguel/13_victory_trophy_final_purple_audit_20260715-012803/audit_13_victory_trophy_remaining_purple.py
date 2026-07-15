from collections import deque
from pathlib import Path
import colorsys

from PIL import Image, ImageDraw

entrada = Path(
    "incoming/sprites/"
    "13_victory_trophy_dark_purple_fixed_candidate.png"
)

pasta = Path(
    "artifacts/frame-validation/"
    "13_victory_trophy_final_purple_audit"
)

relatorio_path = pasta / "relatorio.txt"
mascara_estrita_path = pasta / "mascara_estrita.png"
mascara_ampla_path = pasta / "mascara_ampla.png"
overlay_path = pasta / "suspeitos_destacados.png"
preview_path = pasta / "candidato_preview.png"

if not entrada.exists():
    raise SystemExit(
        f"ERRO: arquivo não encontrado: {entrada}"
    )

imagem = Image.open(entrada).convert("RGBA")
largura, altura = imagem.size
pixels = imagem.load()

bbox = imagem.getchannel("A").getbbox()

if bbox is None:
    raise SystemExit(
        "ERRO: candidato sem conteúdo visível."
    )

left, top, right, bottom = bbox


def hsv_da_cor(r, g, b):
    h, s, v = colorsys.rgb_to_hsv(
        r / 255,
        g / 255,
        b / 255,
    )

    return h * 360, s, v


def parece_vermelho_legitimo(r, g, b):
    return (
        r >= 80
        and r >= g * 1.50
        and r >= b * 1.75
    )


def parece_azul_legitimo(r, g, b):
    return (
        b >= 65
        and b >= r * 1.55
        and b >= g * 1.25
    )


def parece_marrom_legitimo(r, g, b):
    return (
        r >= 35
        and r >= g * 1.20
        and g >= b * 1.15
    )


def suspeito_estrito(r, g, b, a):
    if a == 0:
        return False

    h, s, v = hsv_da_cor(r, g, b)

    return (
        275 <= h <= 345
        and s >= 0.34
        and v >= 0.055
        and r >= 12
        and b >= 12
        and min(r, b) >= g + 5
        and not parece_vermelho_legitimo(r, g, b)
        and not parece_azul_legitimo(r, g, b)
        and not parece_marrom_legitimo(r, g, b)
    )


def suspeito_amplo(r, g, b, a):
    if a == 0:
        return False

    h, s, v = hsv_da_cor(r, g, b)

    return (
        250 <= h <= 355
        and s >= 0.22
        and v >= 0.045
        and r >= 9
        and b >= 9
        and min(r, b) >= g + 3
        and not parece_vermelho_legitimo(r, g, b)
        and not parece_azul_legitimo(r, g, b)
        and not parece_marrom_legitimo(r, g, b)
    )


estritos = set()
amplos = set()

for y in range(top, bottom):
    for x in range(left, right):
        r, g, b, a = pixels[x, y]

        if suspeito_estrito(r, g, b, a):
            estritos.add((x, y))

        if suspeito_amplo(r, g, b, a):
            amplos.add((x, y))


def componentes_da_mascara(coordenadas):
    restantes = set(coordenadas)
    componentes = []

    while restantes:
        inicio = restantes.pop()
        fila = deque([inicio])
        coords = [inicio]

        min_x = max_x = inicio[0]
        min_y = max_y = inicio[1]

        while fila:
            x, y = fila.popleft()

            for ny in range(y - 1, y + 2):
                for nx in range(x - 1, x + 2):
                    if nx == x and ny == y:
                        continue

                    vizinho = (nx, ny)

                    if vizinho not in restantes:
                        continue

                    restantes.remove(vizinho)
                    fila.append(vizinho)
                    coords.append(vizinho)

                    min_x = min(min_x, nx)
                    max_x = max(max_x, nx)
                    min_y = min(min_y, ny)
                    max_y = max(max_y, ny)

        componentes.append({
            "pixels": len(coords),
            "bbox": (
                min_x,
                min_y,
                max_x + 1,
                max_y + 1,
            ),
            "coords": coords,
        })

    componentes.sort(
        key=lambda item: item["pixels"],
        reverse=True,
    )

    return componentes


componentes_estritos = componentes_da_mascara(estritos)
componentes_amplos = componentes_da_mascara(amplos)

mascara_estrita = Image.new(
    "RGBA",
    imagem.size,
    (0, 0, 0, 255),
)

mascara_ampla = Image.new(
    "RGBA",
    imagem.size,
    (0, 0, 0, 255),
)

pix_estrita = mascara_estrita.load()
pix_ampla = mascara_ampla.load()

for x, y in estritos:
    pix_estrita[x, y] = (255, 255, 255, 255)

for x, y in amplos:
    pix_ampla[x, y] = (255, 255, 255, 255)

mascara_estrita.save(mascara_estrita_path)
mascara_ampla.save(mascara_ampla_path)

# Prévia normal do candidato.
preview = Image.new(
    "RGBA",
    imagem.size,
    (18, 18, 18, 255),
)

preview.alpha_composite(imagem)
preview.save(preview_path)

# Overlay:
# ciano = seleção estrita
# laranja = seleção ampla adicional
overlay = preview.copy()
draw = ImageDraw.Draw(overlay)

for x, y in amplos - estritos:
    draw.rectangle(
        (x - 1, y - 1, x + 1, y + 1),
        fill=(255, 145, 0, 255),
    )

for x, y in estritos:
    draw.rectangle(
        (x - 1, y - 1, x + 1, y + 1),
        fill=(0, 255, 255, 255),
    )

overlay.save(overlay_path)

linhas = [
    f"Entrada: {entrada}",
    f"Dimensão: {imagem.size}",
    f"Bounding box: {bbox}",
    f"Pixels suspeitos — filtro estrito: {len(estritos)}",
    f"Pixels suspeitos — filtro amplo: {len(amplos)}",
    (
        "Componentes suspeitos — filtro estrito: "
        f"{len(componentes_estritos)}"
    ),
    (
        "Componentes suspeitos — filtro amplo: "
        f"{len(componentes_amplos)}"
    ),
    "",
    "LEGENDA DO OVERLAY:",
    "ciano = suspeito estrito",
    "laranja = suspeito apenas no filtro amplo",
    "",
    "MAIORES COMPONENTES ESTRITOS:",
]

for indice, componente in enumerate(
    componentes_estritos[:30]
):
    linhas.append(
        f"E{indice:02d} | "
        f"pixels={componente['pixels']} | "
        f"bbox={componente['bbox']}"
    )

linhas.extend([
    "",
    "MAIORES COMPONENTES AMPLOS:",
])

for indice, componente in enumerate(
    componentes_amplos[:40]
):
    linhas.append(
        f"A{indice:02d} | "
        f"pixels={componente['pixels']} | "
        f"bbox={componente['bbox']}"
    )

linhas.extend([
    "",
    "CORES ESTRITAS MAIS COMUNS:",
])

contagem_cores = {}

for x, y in estritos:
    cor = pixels[x, y]
    contagem_cores[cor] = contagem_cores.get(cor, 0) + 1

for cor, quantidade in sorted(
    contagem_cores.items(),
    key=lambda item: item[1],
    reverse=True,
)[:50]:
    linhas.append(
        f"{cor} | pixels={quantidade}"
    )

relatorio_path.write_text(
    "\n".join(linhas) + "\n",
    encoding="utf-8",
)

print("\n".join(linhas[:12]))
print()
print("Relatório:", relatorio_path)
print("Máscara estrita:", mascara_estrita_path)
print("Máscara ampla:", mascara_ampla_path)
print("Overlay:", overlay_path)
print("Prévia:", preview_path)
