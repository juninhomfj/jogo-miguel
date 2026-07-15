from pathlib import Path
from PIL import Image, ImageDraw

entrada = Path("incoming/sprites/12_hurt.png")
referencia = Path("assets/frames/miguel/00_idle.png")

saida = Path(
    "incoming/sprites/12_hurt_hair_fixed_candidate.png"
)

pasta = Path(
    "artifacts/frame-validation/12_hurt_hair_fix"
)

mascara_path = pasta / "pixels_corrigidos.png"
comparacao_path = pasta / "comparacao_ampliada.png"
relatorio_path = pasta / "relatorio.txt"

for arquivo in (entrada, referencia):
    if not arquivo.exists():
        raise SystemExit(
            f"ERRO: arquivo não encontrado: {arquivo}"
        )

original = Image.open(entrada).convert("RGBA")
resultado = original.copy()
ref = Image.open(referencia).convert("RGBA")

bbox = original.getchannel("A").getbbox()
ref_bbox = ref.getchannel("A").getbbox()

if bbox is None or ref_bbox is None:
    raise SystemExit("ERRO: imagem sem conteúdo visível.")

left, top, right, bottom = bbox
ref_left, ref_top, ref_right, ref_bottom = ref_bbox

# Limita a correção à área superior esquerda do sprite:
# cabelo, sem alcançar a estrela de impacto.
regiao_direita = left + round((right - left) * 0.68)
regiao_inferior = top + round((bottom - top) * 0.45)


def cor_de_cabelo(r, g, b, a):
    if a == 0:
        return False

    # Contornos muito escuros.
    if max(r, g, b) <= 55:
        return True

    # Marrons utilizados no cabelo aprovado.
    return (
        r >= 40
        and g <= 90
        and b <= 70
        and r >= g * 1.25
        and r >= b * 1.50
    )


def magenta_residual(r, g, b, a):
    if a == 0:
        return False

    # Inclui também roxos escuros que escaparam
    # do filtro anterior.
    return (
        r >= 45
        and b >= 35
        and g <= 75
        and b >= r * 0.42
        and r >= b * 0.70
        and min(r, b) - g >= 25
    )


# Obtém a paleta aprovada diretamente do cabelo do idle.
paleta = set()
ref_pixels = ref.load()

ref_hair_bottom = (
    ref_top + round((ref_bottom - ref_top) * 0.45)
)

for y in range(ref_top, ref_hair_bottom + 1):
    for x in range(ref_left, ref_right):
        cor = ref_pixels[x, y]

        if cor_de_cabelo(*cor):
            paleta.add(cor)

if not paleta:
    raise SystemExit(
        "ERRO: não foi possível obter a paleta do cabelo."
    )

paleta = sorted(paleta)
origem = original.load()
destino = resultado.load()

suspeitos = []

for y in range(top, min(regiao_inferior + 1, bottom)):
    for x in range(left, min(regiao_direita + 1, right)):
        cor = origem[x, y]

        if magenta_residual(*cor):
            suspeitos.append((x, y, cor))

if not suspeitos:
    raise SystemExit(
        "ERRO: nenhum pixel magenta foi detectado "
        "pelo filtro refinado."
    )


def distancia_quadrada(cor_a, cor_b):
    return (
        (cor_a[0] - cor_b[0]) ** 2
        + (cor_a[1] - cor_b[1]) ** 2
        + (cor_a[2] - cor_b[2]) ** 2
    )


alteracoes = []

for x, y, cor_original in suspeitos:
    cor_substituta = min(
        paleta,
        key=lambda cor: distancia_quadrada(
            cor_original,
            cor,
        ),
    )

    destino[x, y] = cor_substituta

    alteracoes.append(
        (x, y, cor_original, cor_substituta)
    )

resultado.save(saida)

bbox_final = resultado.getchannel("A").getbbox()

if bbox_final != bbox:
    raise SystemExit(
        "ERRO: a correção alterou o bounding box: "
        f"{bbox} -> {bbox_final}"
    )

pixels_originais = sum(
    1
    for alpha in original.getchannel("A").tobytes()
    if alpha > 0
)

pixels_finais = sum(
    1
    for alpha in resultado.getchannel("A").tobytes()
    if alpha > 0
)

if pixels_originais != pixels_finais:
    raise SystemExit(
        "ERRO: a quantidade de pixels visíveis mudou: "
        f"{pixels_originais} -> {pixels_finais}"
    )

# Confirma que o filtro não encontra mais resíduos.
restantes = []

for y in range(top, min(regiao_inferior + 1, bottom)):
    for x in range(left, min(regiao_direita + 1, right)):
        cor = destino[x, y]

        if magenta_residual(*cor):
            restantes.append((x, y, cor))

if restantes:
    raise SystemExit(
        "ERRO: ainda existem pixels suspeitos: "
        f"{len(restantes)}"
    )

# Máscara com os pixels realmente modificados.
mascara = Image.new(
    "RGBA",
    original.size,
    (0, 0, 0, 0),
)
mascara_pixels = mascara.load()

for x, y, _, _ in alteracoes:
    mascara_pixels[x, y] = (0, 255, 255, 255)

mascara.save(mascara_path)

# Comparação ampliada da região do personagem.
margem = 6
crop_box = (
    max(0, left - margem),
    max(0, top - margem),
    min(original.width, right + margem),
    min(original.height, bottom + margem),
)

crop_original = original.crop(crop_box)
crop_corrigido = resultado.crop(crop_box)

escala_preview = 6

crop_original = crop_original.resize(
    (
        crop_original.width * escala_preview,
        crop_original.height * escala_preview,
    ),
    Image.Resampling.NEAREST,
)

crop_corrigido = crop_corrigido.resize(
    (
        crop_corrigido.width * escala_preview,
        crop_corrigido.height * escala_preview,
    ),
    Image.Resampling.NEAREST,
)

espaco = 24

comparacao = Image.new(
    "RGBA",
    (
        crop_original.width * 2 + espaco,
        crop_original.height,
    ),
    (20, 20, 20, 255),
)

comparacao.alpha_composite(crop_original, (0, 0))
comparacao.alpha_composite(
    crop_corrigido,
    (crop_original.width + espaco, 0),
)

draw = ImageDraw.Draw(comparacao)
draw.text((8, 8), "ANTES", fill=(255, 255, 255, 255))
draw.text(
    (crop_original.width + espaco + 8, 8),
    "DEPOIS",
    fill=(255, 255, 255, 255),
)

comparacao.save(comparacao_path)

linhas = [
    f"Entrada: {entrada}",
    f"Saída candidata: {saida}",
    f"Bounding box: {bbox}",
    (
        "Região analisada: "
        f"({left}, {top}, "
        f"{regiao_direita}, {regiao_inferior})"
    ),
    f"Cores na paleta de cabelo: {len(paleta)}",
    f"Pixels magenta encontrados: {len(alteracoes)}",
    "Pixels magenta restantes: 0",
    f"Pixels visíveis: {pixels_finais}",
    "",
    "ALTERAÇÕES:",
]

for x, y, antiga, nova in alteracoes:
    linhas.append(
        f"({x}, {y}) | {antiga} -> {nova}"
    )

relatorio_path.write_text(
    "\n".join(linhas) + "\n",
    encoding="utf-8",
)

print("\n".join(linhas))
print()
print("Máscara:", mascara_path)
print("Comparação:", comparacao_path)
