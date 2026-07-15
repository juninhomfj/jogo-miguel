from collections import deque
from pathlib import Path

from PIL import Image, ImageDraw

entrada = Path(
    "incoming/sprites/"
    "13_victory_trophy_limpo_final.png"
)

pasta = Path(
    "artifacts/frame-validation/"
    "13_victory_trophy_anchor_audit"
)

relatorio_path = pasta / "relatorio.txt"
anotada_path = pasta / "auditoria_ancoras.png"
preview_path = pasta / "preview_limpo.png"

if not entrada.exists():
    raise SystemExit(
        f"ERRO: arquivo não encontrado: {entrada}"
    )

imagem = Image.open(entrada).convert("RGBA")
largura, altura = imagem.size
alpha = imagem.getchannel("A")
bbox_total = alpha.getbbox()

if bbox_total is None:
    raise SystemExit(
        "ERRO: imagem sem conteúdo visível."
    )

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

    coords = []
    min_x = largura
    min_y = altura
    max_x = -1
    max_y = -1

    while fila:
        indice = fila.popleft()
        y, x = divmod(indice, largura)

        coords.append((x, y))

        min_x = min(min_x, x)
        min_y = min(min_y, y)
        max_x = max(max_x, x)
        max_y = max(max_y, y)

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

    componentes.append({
        "pixels": len(coords),
        "coords": coords,
        "bbox": (
            min_x,
            min_y,
            max_x + 1,
            max_y + 1,
        ),
    })

componentes.sort(
    key=lambda item: item["pixels"],
    reverse=True,
)

if not componentes:
    raise SystemExit(
        "ERRO: nenhum componente encontrado."
    )

principal = componentes[0]
principal_bbox = principal["bbox"]

main_left, main_top, main_right, main_bottom = principal_bbox
main_width = main_right - main_left
main_height = main_bottom - main_top

# O troféu fica à direita e acima.
# Esta faixa esquerda isola cabeça, tronco e pernas
# para estimar a altura real do Miguel.
limite_corpo_x = (
    main_left + round(main_width * 0.62)
)

coords_corpo = [
    (x, y)
    for x, y in principal["coords"]
    if x <= limite_corpo_x
]

if not coords_corpo:
    raise SystemExit(
        "ERRO: não foi possível localizar o corpo."
    )

body_left = min(x for x, _ in coords_corpo)
body_top = min(y for _, y in coords_corpo)
body_right = max(x for x, _ in coords_corpo) + 1
body_bottom = max(y for _, y in coords_corpo) + 1

bbox_corpo = (
    body_left,
    body_top,
    body_right,
    body_bottom,
)

altura_corpo = body_bottom - body_top

# Usa a parte inferior do personagem para determinar
# o centro de apoio, sem influência do braço ou troféu.
inicio_inferior = (
    body_top + round(altura_corpo * 0.68)
)

coords_inferiores = [
    (x, y)
    for x, y in coords_corpo
    if y >= inicio_inferior
]

if not coords_inferiores:
    raise SystemExit(
        "ERRO: região inferior do corpo não encontrada."
    )

lower_left = min(x for x, _ in coords_inferiores)
lower_top = min(y for _, y in coords_inferiores)
lower_right = max(x for x, _ in coords_inferiores) + 1
lower_bottom = max(y for _, y in coords_inferiores) + 1

bbox_inferior = (
    lower_left,
    lower_top,
    lower_right,
    lower_bottom,
)

centro_apoio_x = (
    lower_left + lower_right
) / 2

# Altura-padrão dos frames terrestres aprovados.
altura_alvo_corpo = 122
escala_sugerida = (
    altura_alvo_corpo / altura_corpo
)

total_left, total_top, total_right, total_bottom = bbox_total
total_width = total_right - total_left
total_height = total_bottom - total_top

largura_prevista = round(
    total_width * escala_sugerida
)

altura_prevista = round(
    total_height * escala_sugerida
)

# Âncoras finais:
# centro dos pés em x=128;
# base das botas em y=224.
x_previsto = round(
    128
    - (
        centro_apoio_x - total_left
    ) * escala_sugerida
)

y_previsto = round(
    224
    - (
        body_bottom - total_top
    ) * escala_sugerida
)

bbox_final_previsto = (
    x_previsto,
    y_previsto,
    x_previsto + largura_prevista,
    y_previsto + altura_prevista,
)

margens_previstas = {
    "esquerda": bbox_final_previsto[0],
    "topo": bbox_final_previsto[1],
    "direita": 256 - bbox_final_previsto[2],
    "inferior": 256 - bbox_final_previsto[3],
}

pixels_visiveis = sum(
    1
    for valor in dados_alpha
    if valor > 0
)

# Prévia em fundo escuro.
preview = Image.new(
    "RGBA",
    imagem.size,
    (18, 18, 18, 255),
)

preview.alpha_composite(imagem)
preview.save(preview_path)

# Auditoria com caixas:
# amarelo = conjunto total;
# verde = componente principal;
# ciano = corpo usado para escala;
# vermelho = região inferior usada para centralização.
anotada = preview.copy()
draw = ImageDraw.Draw(anotada)

draw.rectangle(
    bbox_total,
    outline=(255, 210, 0, 255),
    width=3,
)

draw.rectangle(
    principal_bbox,
    outline=(0, 255, 70, 255),
    width=3,
)

draw.rectangle(
    bbox_corpo,
    outline=(0, 255, 255, 255),
    width=3,
)

draw.rectangle(
    bbox_inferior,
    outline=(255, 70, 70, 255),
    width=3,
)

draw.line(
    (
        round(centro_apoio_x),
        lower_top,
        round(centro_apoio_x),
        lower_bottom,
    ),
    fill=(255, 255, 255, 255),
    width=2,
)

anotada.save(anotada_path)

linhas = [
    f"Entrada: {entrada}",
    f"Dimensão original: {imagem.size}",
    f"Bounding box total: {bbox_total}",
    f"Pixels visíveis: {pixels_visiveis}",
    f"Componentes encontrados: {len(componentes)}",
    f"Componente principal: {principal_bbox}",
    f"Pixels do componente principal: {principal['pixels']}",
    f"Limite lateral usado para o corpo: x={limite_corpo_x}",
    f"Bounding box estimado do corpo: {bbox_corpo}",
    f"Altura estimada do corpo: {altura_corpo}",
    f"Bounding box da região inferior: {bbox_inferior}",
    f"Centro de apoio horizontal: {centro_apoio_x:.2f}",
    f"Altura-alvo do corpo: {altura_alvo_corpo}",
    f"Escala sugerida: {escala_sugerida:.6f}",
    (
        "Conjunto final previsto: "
        f"{largura_prevista}x{altura_prevista}"
    ),
    f"Posição prevista: x={x_previsto}, y={y_previsto}",
    f"Bounding box final previsto: {bbox_final_previsto}",
    f"Margens finais previstas: {margens_previstas}",
    "",
    "COMPONENTES:",
]

for indice, componente in enumerate(componentes):
    linhas.append(
        f"C{indice:02d} | "
        f"pixels={componente['pixels']} | "
        f"bbox={componente['bbox']}"
    )

relatorio_path.write_text(
    "\n".join(linhas) + "\n",
    encoding="utf-8",
)

print("\n".join(linhas))
print()
print("Auditoria:", anotada_path)
print("Prévia:", preview_path)
