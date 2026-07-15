from pathlib import Path

from PIL import Image

entrada = Path(
    "incoming/sprites/"
    "13_victory_trophy_limpo_final.png"
)

saida = Path(
    "incoming/sprites/"
    "13_victory_trophy.png"
)

pasta = Path(
    "artifacts/frame-validation/"
    "13_victory_trophy_normalization"
)

preview_path = pasta / "13_victory_trophy_normalized_preview.png"
relatorio_path = pasta / "relatorio.txt"

if not entrada.exists():
    raise SystemExit(
        f"ERRO: arquivo não encontrado: {entrada}"
    )

imagem = Image.open(entrada).convert("RGBA")

# Valores confirmados pela auditoria anterior.
bbox_total_esperado = (418, 308, 916, 938)
bbox_corpo_esperado = (418, 398, 711, 938)
bbox_inferior_esperado = (456, 765, 711, 938)

centro_apoio_original = 583.50
altura_alvo_corpo = 122
centro_apoio_final = 128
linha_base_final = 224

bbox_total = imagem.getchannel("A").getbbox()

if imagem.size != (1254, 1254):
    raise SystemExit(
        "ERRO: dimensão original inesperada: "
        f"{imagem.size}"
    )

if bbox_total != bbox_total_esperado:
    raise SystemExit(
        "ERRO: bounding box diferente da auditoria: "
        f"{bbox_total}; esperado {bbox_total_esperado}"
    )

total_left, total_top, total_right, total_bottom = (
    bbox_total_esperado
)

body_left, body_top, body_right, body_bottom = (
    bbox_corpo_esperado
)

lower_left, lower_top, lower_right, lower_bottom = (
    bbox_inferior_esperado
)

altura_corpo = body_bottom - body_top

if altura_corpo != 540:
    raise SystemExit(
        "ERRO: altura do corpo inesperada: "
        f"{altura_corpo}"
    )

escala = altura_alvo_corpo / altura_corpo

recorte = imagem.crop(bbox_total_esperado)

largura_redimensionada = round(
    recorte.width * escala
)

altura_redimensionada = round(
    recorte.height * escala
)

if (
    largura_redimensionada <= 0
    or altura_redimensionada <= 0
):
    raise SystemExit(
        "ERRO: dimensão de redimensionamento inválida."
    )

redimensionado = recorte.resize(
    (
        largura_redimensionada,
        altura_redimensionada,
    ),
    Image.Resampling.NEAREST,
)

posicao_x = round(
    centro_apoio_final
    - (
        centro_apoio_original
        - total_left
    ) * escala
)

posicao_y = round(
    linha_base_final
    - (
        body_bottom
        - total_top
    ) * escala
)

canvas = Image.new(
    "RGBA",
    (256, 256),
    (0, 0, 0, 0),
)

canvas.alpha_composite(
    redimensionado,
    (posicao_x, posicao_y),
)

bbox_final = canvas.getchannel("A").getbbox()

if bbox_final is None:
    raise SystemExit(
        "ERRO: resultado totalmente transparente."
    )

margens = {
    "esquerda": bbox_final[0],
    "topo": bbox_final[1],
    "direita": 256 - bbox_final[2],
    "inferior": 256 - bbox_final[3],
}

if bbox_final[3] != linha_base_final:
    raise SystemExit(
        "ERRO: linha-base final incorreta: "
        f"y={bbox_final[3]}; esperado {linha_base_final}"
    )

if min(margens.values()) < 12:
    raise SystemExit(
        "ERRO: margem final abaixo de 12 px: "
        f"{margens}"
    )

alpha = canvas.getchannel("A")

pixels_visiveis = 0
pixels_semitransparentes = 0

for valor in alpha.tobytes():
    if valor > 0:
        pixels_visiveis += 1

    if 0 < valor < 255:
        pixels_semitransparentes += 1

if pixels_semitransparentes != 0:
    raise SystemExit(
        "ERRO: foram criados pixels semitransparentes: "
        f"{pixels_semitransparentes}"
    )

canvas.save(saida)

# Prévia em fundo escuro.
preview = Image.new(
    "RGBA",
    (256, 256),
    (18, 18, 18, 255),
)

preview.alpha_composite(canvas)
preview.save(preview_path)

linhas = [
    f"Entrada: {entrada}",
    f"Saída: {saida}",
    f"Dimensão original: {imagem.size}",
    f"Bounding box original: {bbox_total}",
    f"Bounding box do corpo usado: {bbox_corpo_esperado}",
    f"Bounding box inferior usado: {bbox_inferior_esperado}",
    f"Centro de apoio original: {centro_apoio_original:.2f}",
    f"Altura do corpo: {altura_corpo}",
    f"Altura-alvo do corpo: {altura_alvo_corpo}",
    f"Escala aplicada: {escala:.6f}",
    (
        "Conjunto redimensionado: "
        f"{largura_redimensionada}x"
        f"{altura_redimensionada}"
    ),
    f"Posição no canvas: x={posicao_x}, y={posicao_y}",
    f"Bounding box final: {bbox_final}",
    f"Margens finais: {margens}",
    f"Pixels visíveis: {pixels_visiveis}",
    (
        "Pixels semitransparentes: "
        f"{pixels_semitransparentes}"
    ),
    f"Prévia: {preview_path}",
]

relatorio_path.write_text(
    "\n".join(linhas) + "\n",
    encoding="utf-8",
)

print("\n".join(linhas))
