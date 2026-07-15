from collections import deque
from pathlib import Path

from PIL import Image

entrada = Path(
    "incoming/sprites/10_dust_3_limpo_final.png"
)

referencia = Path(
    "assets/reference/miguel/10_dust_3_reference.png"
)

saida = Path(
    "incoming/sprites/10_dust_3.png"
)

preview_path = Path(
    "artifacts/frame-validation/"
    "10_dust_3_normalization/"
    "10_dust_3_normalized_preview.png"
)

relatorio_path = Path(
    "artifacts/frame-validation/"
    "10_dust_3_normalization/"
    "relatorio.txt"
)


def obter_componentes(imagem):
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

        componentes.append(
            {
                "pixels": pixels,
                "bbox": (
                    min_x,
                    min_y,
                    max_x + 1,
                    max_y + 1,
                ),
            }
        )

    componentes.sort(
        key=lambda componente: componente["pixels"],
        reverse=True,
    )

    return componentes


for arquivo in (entrada, referencia):
    if not arquivo.exists():
        raise SystemExit(
            f"ERRO: arquivo não encontrado: {arquivo}"
        )

imagem = Image.open(entrada).convert("RGBA")
ref = Image.open(referencia).convert("RGBA")

if ref.size != (256, 256):
    raise SystemExit(
        f"ERRO: referência com dimensão incorreta: {ref.size}"
    )

bbox_total = imagem.getchannel("A").getbbox()
bbox_ref_total = ref.getchannel("A").getbbox()

if bbox_total is None:
    raise SystemExit(
        "ERRO: imagem limpa sem conteúdo visível."
    )

if bbox_ref_total is None:
    raise SystemExit(
        "ERRO: referência sem conteúdo visível."
    )

componentes = obter_componentes(imagem)
componentes_ref = obter_componentes(ref)

if not componentes or not componentes_ref:
    raise SystemExit(
        "ERRO: nenhum componente encontrado."
    )

principal = componentes[0]
principal_ref = componentes_ref[0]

src_left, src_top, src_right, src_bottom = principal["bbox"]
ref_left, ref_top, ref_right, ref_bottom = principal_ref["bbox"]

altura_principal = src_bottom - src_top
altura_principal_ref = ref_bottom - ref_top

if altura_principal <= 0 or altura_principal_ref <= 0:
    raise SystemExit(
        "ERRO: altura inválida no componente principal."
    )

escala = altura_principal_ref / altura_principal

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

conteudo_redimensionado = conteudo.resize(
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

centro_principal_ref = (
    ref_left + ref_right
) / 2

x = round(
    centro_principal_ref - centro_principal_rel
)

y = round(
    ref_bottom - principal_rel_bottom
)

if (
    x < 0
    or y < 0
    or x + nova_largura > 256
    or y + nova_altura > 256
):
    raise SystemExit(
        "ERRO: conteúdo normalizado não cabe no canvas. "
        f"posição=({x}, {y}), "
        f"tamanho={nova_largura}x{nova_altura}"
    )

canvas = Image.new(
    "RGBA",
    (256, 256),
    (0, 0, 0, 0),
)

canvas.alpha_composite(
    conteudo_redimensionado,
    (x, y),
)

bbox_final = canvas.getchannel("A").getbbox()

if bbox_final is None:
    raise SystemExit(
        "ERRO: resultado final transparente."
    )

margens = {
    "esquerda": bbox_final[0],
    "topo": bbox_final[1],
    "direita": 256 - bbox_final[2],
    "inferior": 256 - bbox_final[3],
}

if min(margens.values()) < 8:
    raise SystemExit(
        "ERRO: margem inferior a 8 pixels: "
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
    f"Referência: {referencia}",
    f"Saída: {saida}",
    f"Bounding box original total: {bbox_total}",
    f"Bounding box da referência: {bbox_ref_total}",
    f"Componente principal original: {principal['bbox']}",
    f"Componente principal da referência: {principal_ref['bbox']}",
    (
        "Altura do componente principal: "
        f"{altura_principal} -> {altura_principal_ref}"
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

print("\n".join(linhas))
