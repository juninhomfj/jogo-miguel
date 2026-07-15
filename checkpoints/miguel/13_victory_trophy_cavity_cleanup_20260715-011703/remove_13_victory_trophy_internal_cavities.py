from pathlib import Path

from PIL import Image, ImageDraw

entrada = Path(
    "incoming/sprites/"
    "13_victory_trophy_internal_magenta_fixed_candidate.png"
)

saida = Path(
    "incoming/sprites/"
    "13_victory_trophy_cavities_clean_candidate.png"
)

pasta = Path(
    "artifacts/frame-validation/"
    "13_victory_trophy_cavity_cleanup"
)

relatorio_path = pasta / "relatorio.txt"
mascara_path = pasta / "pixels_removidos.png"
overlay_path = pasta / "pixels_removidos_destacados.png"
comparacao_path = pasta / "comparacao_ampliada.png"
preview_path = pasta / "candidato_preview.png"

if not entrada.exists():
    raise SystemExit(
        f"ERRO: arquivo não encontrado: {entrada}"
    )

original = Image.open(entrada).convert("RGBA")
resultado = original.copy()

largura, altura = original.size
origem = original.load()
destino = resultado.load()

bbox_antes = original.getchannel("A").getbbox()

if bbox_antes is None:
    raise SystemExit(
        "ERRO: imagem sem conteúdo visível."
    )


# Mesmo critério que identificou os 521 pixels
# não resolvidos na etapa anterior.
def eh_magenta_residual(r, g, b, a):
    if a == 0:
        return False

    return (
        r >= 90
        and b >= 70
        and g <= 170
        and (r - g) >= 15
        and (b - g) >= 10
        and (r + b - 2 * g) >= 40
    )


suspeitos = []

for y in range(altura):
    for x in range(largura):
        r, g, b, a = origem[x, y]

        if eh_magenta_residual(r, g, b, a):
            suspeitos.append(
                {
                    "x": x,
                    "y": y,
                    "cor": (r, g, b, a),
                }
            )

if not suspeitos:
    raise SystemExit(
        "ERRO: nenhum magenta residual foi encontrado."
    )

if len(suspeitos) > 2000:
    raise SystemExit(
        "ERRO: quantidade de pixels suspeitos acima "
        f"do limite de segurança: {len(suspeitos)}"
    )

print(
    "Pixels magenta residuais encontrados:",
    len(suspeitos),
)

# Esses pixels permaneceram sem substituição na etapa
# anterior porque formam cavidades do fundo. Portanto,
# devem ser transparentes.
for item in suspeitos:
    x = item["x"]
    y = item["y"]

    destino[x, y] = (0, 0, 0, 0)

bbox_depois = resultado.getchannel("A").getbbox()

if bbox_depois != bbox_antes:
    raise SystemExit(
        "ERRO: a remoção alterou o bounding box: "
        f"{bbox_antes} -> {bbox_depois}"
    )

visiveis_antes = sum(
    1
    for valor in original.getchannel("A").tobytes()
    if valor > 0
)

visiveis_depois = sum(
    1
    for valor in resultado.getchannel("A").tobytes()
    if valor > 0
)

diferenca_visiveis = (
    visiveis_antes - visiveis_depois
)

if diferenca_visiveis != len(suspeitos):
    raise SystemExit(
        "ERRO: redução inesperada de pixels visíveis: "
        f"{diferenca_visiveis}; "
        f"esperado {len(suspeitos)}"
    )

restantes = []

for y in range(altura):
    for x in range(largura):
        r, g, b, a = destino[x, y]

        if eh_magenta_residual(r, g, b, a):
            restantes.append((x, y, (r, g, b, a)))

if restantes:
    raise SystemExit(
        "ERRO: ainda restaram pixels magenta: "
        f"{len(restantes)}"
    )

resultado.save(saida)


# Máscara simples dos pixels transformados
# em transparência.
mascara = Image.new(
    "RGBA",
    original.size,
    (0, 0, 0, 0),
)

mascara_pixels = mascara.load()

for item in suspeitos:
    mascara_pixels[
        item["x"],
        item["y"],
    ] = (0, 255, 255, 255)

mascara.save(mascara_path)


# Sobreposição mostrando as áreas removidas.
overlay = Image.new(
    "RGBA",
    original.size,
    (18, 18, 18, 255),
)

overlay.alpha_composite(original)
overlay_pixels = overlay.load()

for item in suspeitos:
    overlay_pixels[
        item["x"],
        item["y"],
    ] = (0, 255, 255, 255)

overlay.save(overlay_path)


# Prévia do novo candidato.
preview = Image.new(
    "RGBA",
    resultado.size,
    (18, 18, 18, 255),
)

preview.alpha_composite(resultado)
preview.save(preview_path)


# Comparação ampliada.
left, top, right, bottom = bbox_antes
margem = 10

crop_box = (
    max(0, left - margem),
    max(0, top - margem),
    min(largura, right + margem),
    min(altura, bottom + margem),
)

antes = original.crop(crop_box)
depois = resultado.crop(crop_box)

zoom = 3

antes = antes.resize(
    (
        antes.width * zoom,
        antes.height * zoom,
    ),
    Image.Resampling.NEAREST,
)

depois = depois.resize(
    (
        depois.width * zoom,
        depois.height * zoom,
    ),
    Image.Resampling.NEAREST,
)

espaco = 30
topo_legenda = 35

comparacao = Image.new(
    "RGBA",
    (
        antes.width * 2 + espaco,
        antes.height + topo_legenda,
    ),
    (18, 18, 18, 255),
)

comparacao.alpha_composite(
    antes,
    (0, topo_legenda),
)

comparacao.alpha_composite(
    depois,
    (antes.width + espaco, topo_legenda),
)

draw = ImageDraw.Draw(comparacao)

draw.text(
    (8, 8),
    "ANTES",
    fill=(255, 255, 255, 255),
)

draw.text(
    (antes.width + espaco + 8, 8),
    "DEPOIS",
    fill=(255, 255, 255, 255),
)

comparacao.save(comparacao_path)


xs = [item["x"] for item in suspeitos]
ys = [item["y"] for item in suspeitos]

bbox_removidos = (
    min(xs),
    min(ys),
    max(xs) + 1,
    max(ys) + 1,
)

linhas = [
    f"Entrada: {entrada}",
    f"Saída candidata: {saida}",
    f"Dimensão: {original.size}",
    f"Bounding box antes: {bbox_antes}",
    f"Bounding box depois: {bbox_depois}",
    (
        "Pixels magenta residuais encontrados: "
        f"{len(suspeitos)}"
    ),
    (
        "Pixels convertidos em transparência: "
        f"{len(suspeitos)}"
    ),
    "Pixels magenta restantes: 0",
    f"Pixels visíveis antes: {visiveis_antes}",
    f"Pixels visíveis depois: {visiveis_depois}",
    f"Bounding box dos pixels removidos: {bbox_removidos}",
    f"Máscara: {mascara_path}",
    f"Overlay: {overlay_path}",
    f"Comparação: {comparacao_path}",
    f"Prévia: {preview_path}",
    "",
    "PRIMEIROS PIXELS REMOVIDOS:",
]

for item in suspeitos[:100]:
    linhas.append(
        f"({item['x']}, {item['y']}) | "
        f"{item['cor']} -> transparente"
    )

relatorio_path.write_text(
    "\n".join(linhas) + "\n",
    encoding="utf-8",
)

print()
print("\n".join(linhas[:15]))
