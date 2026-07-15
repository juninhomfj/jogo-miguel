from collections import Counter, deque
from pathlib import Path

from PIL import Image, ImageDraw

entrada = Path(
    "incoming/sprites/"
    "13_victory_trophy_chroma_sem_fundo_conectado.png"
)

saida = Path(
    "incoming/sprites/"
    "13_victory_trophy_internal_magenta_fixed_candidate.png"
)

pasta = Path(
    "artifacts/frame-validation/"
    "13_victory_trophy_internal_magenta_fix"
)

mask_path = pasta / "pixels_corrigidos.png"
comparacao_path = pasta / "comparacao_ampliada.png"
preview_path = pasta / "candidato_preview.png"
relatorio_path = pasta / "relatorio.txt"

if not entrada.exists():
    raise SystemExit(
        f"ERRO: arquivo não encontrado: {entrada}"
    )

imagem = Image.open(entrada).convert("RGBA")
resultado = imagem.copy()

largura, altura = imagem.size
pix_in = imagem.load()
pix_out = resultado.load()

alpha = imagem.getchannel("A")
bbox = alpha.getbbox()

if bbox is None:
    raise SystemExit(
        "ERRO: a imagem está totalmente transparente."
    )

left, top, right, bottom = bbox

# -----------------------------------------
# Detecta componentes visíveis
# -----------------------------------------
visitado = [[False] * largura for _ in range(altura)]
componentes = []

for y in range(top, bottom):
    for x in range(left, right):
        if visitado[y][x]:
            continue
        if pix_in[x, y][3] == 0:
            continue

        fila = deque([(x, y)])
        visitado[y][x] = True
        coords = []
        min_x = max_x = x
        min_y = max_y = y

        while fila:
            cx, cy = fila.popleft()
            coords.append((cx, cy))

            if cx < min_x:
                min_x = cx
            if cx > max_x:
                max_x = cx
            if cy < min_y:
                min_y = cy
            if cy > max_y:
                max_y = cy

            for nx, ny in (
                (cx - 1, cy),
                (cx + 1, cy),
                (cx, cy - 1),
                (cx, cy + 1),
            ):
                if not (0 <= nx < largura and 0 <= ny < altura):
                    continue
                if visitado[ny][nx]:
                    continue
                if pix_in[nx, ny][3] == 0:
                    continue

                visitado[ny][nx] = True
                fila.append((nx, ny))

        componentes.append(
            {
                "pixels": len(coords),
                "bbox": (min_x, min_y, max_x + 1, max_y + 1),
                "coords": coords,
            }
        )

componentes.sort(key=lambda item: item["pixels"], reverse=True)

# -----------------------------------------
# Critério de magenta/roxo residual
# -----------------------------------------
def eh_magenta_residual(r, g, b, a):
    if a == 0:
        return False

    # magenta / roxo / pink residual típico de chroma
    return (
        r >= 90
        and b >= 70
        and g <= 170
        and (r - g) >= 15
        and (b - g) >= 10
        and (r + b - 2 * g) >= 40
    )

# -----------------------------------------
# Busca cor de substituição usando vizinhança
# -----------------------------------------
def melhor_cor_vizinha(x, y):
    for raio in range(1, 5):
        candidatos = []

        for ny in range(y - raio, y + raio + 1):
            for nx in range(x - raio, x + raio + 1):
                if not (0 <= nx < largura and 0 <= ny < altura):
                    continue
                if nx == x and ny == y:
                    continue

                r, g, b, a = pix_in[nx, ny]

                if a == 0:
                    continue
                if eh_magenta_residual(r, g, b, a):
                    continue

                candidatos.append((r, g, b, a))

        if candidatos:
            return Counter(candidatos).most_common(1)[0][0]

    return None

# -----------------------------------------
# Corrige somente pixels visíveis suspeitos
# -----------------------------------------
corrigidos = []
nao_resolvidos = []

for y in range(top, bottom):
    for x in range(left, right):
        r, g, b, a = pix_in[x, y]

        if a == 0:
            continue
        if not eh_magenta_residual(r, g, b, a):
            continue

        nova_cor = melhor_cor_vizinha(x, y)

        if nova_cor is None:
            nao_resolvidos.append((x, y, (r, g, b, a)))
            continue

        pix_out[x, y] = nova_cor
        corrigidos.append(
            {
                "pos": (x, y),
                "antes": (r, g, b, a),
                "depois": nova_cor,
            }
        )

resultado.save(saida)

# -----------------------------------------
# Conta resíduos restantes
# -----------------------------------------
restantes = 0
for y in range(top, bottom):
    for x in range(left, right):
        r, g, b, a = resultado.getpixel((x, y))
        if eh_magenta_residual(r, g, b, a):
            restantes += 1

# -----------------------------------------
# Máscara dos pixels corrigidos
# -----------------------------------------
mask = Image.new("RGBA", imagem.size, (0, 0, 0, 255))
mask_draw = ImageDraw.Draw(mask)

for item in corrigidos:
    x, y = item["pos"]
    mask_draw.point((x, y), fill=(0, 255, 255, 255))

mask.save(mask_path)

# -----------------------------------------
# Preview em fundo escuro
# -----------------------------------------
preview = Image.new(
    "RGBA",
    imagem.size,
    (18, 18, 18, 255),
)
preview.alpha_composite(resultado)
preview.save(preview_path)

# -----------------------------------------
# Comparação ampliada
# -----------------------------------------
margem = 8
crop_box = (
    max(0, left - margem),
    max(0, top - margem),
    min(largura, right + margem),
    min(altura, bottom + margem),
)

antes_crop = imagem.crop(crop_box)
depois_crop = resultado.crop(crop_box)

zoom = 8
antes_big = antes_crop.resize(
    (
        antes_crop.width * zoom,
        antes_crop.height * zoom,
    ),
    Image.Resampling.NEAREST,
)
depois_big = depois_crop.resize(
    (
        depois_crop.width * zoom,
        depois_crop.height * zoom,
    ),
    Image.Resampling.NEAREST,
)

canvas = Image.new(
    "RGBA",
    (
        antes_big.width * 2 + 80,
        max(antes_big.height, depois_big.height) + 80,
    ),
    (14, 14, 14, 255),
)

canvas.alpha_composite(antes_big, (20, 40))
canvas.alpha_composite(depois_big, (antes_big.width + 60, 40))

draw = ImageDraw.Draw(canvas)
draw.text((20, 12), "ANTES", fill=(255, 255, 255, 255))
draw.text(
    (antes_big.width + 60, 12),
    "DEPOIS",
    fill=(255, 255, 255, 255),
)

canvas.save(comparacao_path)

# -----------------------------------------
# Relatório
# -----------------------------------------
pixels_visiveis = sum(
    1
    for valor in resultado.getchannel("A").tobytes()
    if valor > 0
)

linhas = [
    f"Entrada: {entrada}",
    f"Saída candidata: {saida}",
    f"Bounding box: {bbox}",
    f"Componentes encontrados: {len(componentes)}",
    f"Pixels visíveis: {pixels_visiveis}",
    f"Pixels magenta encontrados: {len(corrigidos) + len(nao_resolvidos)}",
    f"Pixels corrigidos: {len(corrigidos)}",
    f"Pixels não resolvidos: {len(nao_resolvidos)}",
    f"Pixels magenta restantes: {restantes}",
    f"Máscara: {mask_path}",
    f"Comparação: {comparacao_path}",
    f"Prévia: {preview_path}",
    "",
    "MAIORES COMPONENTES:",
]

for i, comp in enumerate(componentes[:10]):
    x1, y1, x2, y2 = comp["bbox"]
    linhas.append(
        f"C{i:02d} | pixels={comp['pixels']} | "
        f"bbox=({x1}, {y1}, {x2}, {y2})"
    )

if corrigidos:
    linhas.append("")
    linhas.append("PRIMEIRAS CORREÇÕES:")

    for item in corrigidos[:80]:
        x, y = item["pos"]
        linhas.append(
            f"({x}, {y}) | "
            f"{item['antes']} -> {item['depois']}"
        )

if nao_resolvidos:
    linhas.append("")
    linhas.append("PIXELS NÃO RESOLVIDOS:")

    for x, y, cor in nao_resolvidos[:40]:
        linhas.append(f"({x}, {y}) | {cor}")

relatorio_path.write_text(
    "\n".join(linhas) + "\n",
    encoding="utf-8",
)

print("Componentes encontrados:", len(componentes))
if componentes:
    principal = componentes[0]
    print(
        "Componente principal:",
        principal["bbox"],
        principal["pixels"],
    )

print(f"Entrada: {entrada}")
print(f"Saída candidata: {saida}")
print(f"Bounding box: {bbox}")
print(f"Componentes encontrados: {len(componentes)}")
print(f"Pixels visíveis: {pixels_visiveis}")
print(
    "Pixels magenta encontrados:",
    len(corrigidos) + len(nao_resolvidos),
)
print("Pixels corrigidos:", len(corrigidos))
print("Pixels não resolvidos:", len(nao_resolvidos))
print("Pixels magenta restantes:", restantes)
print(f"Relatório: {relatorio_path}")
print(f"Máscara: {mask_path}")
print(f"Comparação: {comparacao_path}")
print(f"Prévia: {preview_path}")
