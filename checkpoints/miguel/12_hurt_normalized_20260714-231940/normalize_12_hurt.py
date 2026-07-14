from collections import deque
from pathlib import Path
from statistics import median

from PIL import Image

entrada = Path(
    "incoming/sprites/12_hurt_limpo_final.png"
)

saida = Path(
    "incoming/sprites/12_hurt.png"
)

preview_path = Path(
    "artifacts/frame-validation/"
    "12_hurt_normalization/"
    "12_hurt_normalized_preview.png"
)

relatorio_path = Path(
    "artifacts/frame-validation/"
    "12_hurt_normalization/"
    "relatorio.txt"
)

referencias = [
    Path("assets/frames/miguel/00_idle.png"),
    Path("assets/frames/miguel/01_walk_1.png"),
    Path("assets/frames/miguel/02_walk_2.png"),
    Path("assets/frames/miguel/03_walk_3.png"),
    Path("assets/frames/miguel/06_punch.png"),
]


def componentes_alpha(imagem):
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

        pixels = 0
        min_x = largura
        min_y = altura
        max_x = -1
        max_y = -1

        while fila:
            indice = fila.popleft()
            y, x = divmod(indice, largura)

            pixels += 1
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
            "pixels": pixels,
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

    return componentes


for arquivo in [entrada, *referencias]:
    if not arquivo.exists():
        raise SystemExit(
            f"ERRO: arquivo não encontrado: {arquivo}"
        )

imagem = Image.open(entrada).convert("RGBA")
bbox_total = imagem.getchannel("A").getbbox()

if bbox_total is None:
    raise SystemExit(
        "ERRO: frame limpo sem conteúdo visível."
    )

componentes = componentes_alpha(imagem)

if len(componentes) != 3:
    raise SystemExit(
        "ERRO: eram esperados 3 componentes no frame, "
        f"mas foram encontrados {len(componentes)}."
    )

principal = componentes[0]
principal_bbox = principal["bbox"]

alturas_referencia = []
centros_referencia = []
bases_referencia = []

print("Referências utilizadas:")

for referencia in referencias:
    ref = Image.open(referencia).convert("RGBA")
    componentes_ref = componentes_alpha(ref)

    if not componentes_ref:
        raise SystemExit(
            f"ERRO: referência vazia: {referencia}"
        )

    principal_ref = componentes_ref[0]
    left, top, right, bottom = principal_ref["bbox"]

    altura = bottom - top
    centro = (left + right) / 2

    alturas_referencia.append(altura)
    centros_referencia.append(centro)
    bases_referencia.append(bottom)

    print(
        f"- {referencia.name}: "
        f"bbox={principal_ref['bbox']} | "
        f"altura={altura} | "
        f"centro={centro:.2f} | "
        f"base={bottom}"
    )

altura_alvo = round(median(alturas_referencia))
centro_alvo = median(centros_referencia)

# Os frames terrestres aprovados utilizam linha-base y=224.
base_alvo = 224

src_left, src_top, src_right, src_bottom = principal_bbox
altura_principal = src_bottom - src_top

if altura_principal <= 0:
    raise SystemExit(
        "ERRO: altura inválida no componente principal."
    )

escala = altura_alvo / altura_principal

union_left, union_top, union_right, union_bottom = bbox_total
conteudo = imagem.crop(bbox_total)

nova_largura = max(
    1,
    round(conteudo.width * escala),
)

nova_altura = max(
    1,
    round(conteudo.height * escala),
)

conteudo = conteudo.resize(
    (nova_largura, nova_altura),
    Image.Resampling.NEAREST,
)

principal_rel_left = (
    src_left - union_left
) * escala

principal_rel_right = (
    src_right - union_left
) * escala

principal_rel_bottom = (
    src_bottom - union_top
) * escala

centro_principal_rel = (
    principal_rel_left + principal_rel_right
) / 2

x = round(
    centro_alvo - centro_principal_rel
)

y = round(
    base_alvo - principal_rel_bottom
)

if (
    x < 0
    or y < 0
    or x + nova_largura > 256
    or y + nova_altura > 256
):
    raise SystemExit(
        "ERRO: conteúdo não cabe no canvas. "
        f"posição=({x}, {y}), "
        f"tamanho={nova_largura}x{nova_altura}"
    )

canvas = Image.new(
    "RGBA",
    (256, 256),
    (0, 0, 0, 0),
)

canvas.alpha_composite(
    conteudo,
    (x, y),
)

bbox_final = canvas.getchannel("A").getbbox()

if bbox_final is None:
    raise SystemExit(
        "ERRO: resultado transparente."
    )

margens = {
    "esquerda": bbox_final[0],
    "topo": bbox_final[1],
    "direita": 256 - bbox_final[2],
    "inferior": 256 - bbox_final[3],
}

if min(margens.values()) < 8:
    raise SystemExit(
        "ERRO: margem técnica menor que 8 pixels: "
        f"{margens}"
    )

canvas.save(saida)

preview = Image.new(
    "RGBA",
    canvas.size,
    (20, 20, 20, 255),
)

preview.alpha_composite(canvas)
preview.save(preview_path)

linhas = [
    f"Entrada: {entrada}",
    f"Saída: {saida}",
    f"Bounding box original total: {bbox_total}",
    f"Componente principal original: {principal_bbox}",
    f"Alturas das referências: {alturas_referencia}",
    f"Altura-alvo pela mediana: {altura_alvo}",
    f"Centro-alvo pela mediana: {centro_alvo:.2f}",
    f"Linha-base alvo: {base_alvo}",
    (
        "Altura do Miguel: "
        f"{altura_principal} -> {altura_alvo}"
    ),
    f"Escala aplicada: {escala:.6f}",
    (
        "Conjunto redimensionado: "
        f"{nova_largura}x{nova_altura}"
    ),
    f"Posição no canvas: x={x}, y={y}",
    f"Bounding box final: {bbox_final}",
    f"Margens finais: {margens}",
    f"Prévia: {preview_path}",
]

relatorio_path.write_text(
    "\n".join(linhas) + "\n",
    encoding="utf-8",
)

print()
print("\n".join(linhas))
