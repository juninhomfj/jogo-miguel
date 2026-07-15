from collections import Counter, deque
from pathlib import Path
import colorsys

from PIL import Image, ImageDraw

entrada = Path(
    "incoming/sprites/"
    "13_victory_trophy_dark_purple_fixed_candidate.png"
)

saida = Path(
    "incoming/sprites/"
    "13_victory_trophy_edge_fringe_fixed_candidate.png"
)

pasta = Path(
    "artifacts/frame-validation/"
    "13_victory_trophy_edge_fringe_fix"
)

relatorio_path = pasta / "relatorio.txt"
mascara_path = pasta / "pixels_corrigidos.png"
overlay_path = pasta / "pixels_corrigidos_destacados.png"
preview_path = pasta / "candidato_preview.png"
comparacao_path = pasta / "comparacao_ampliada.png"
comparacao_superior_path = pasta / "comparacao_superior.png"

referencias = [
    Path("assets/frames/miguel/00_idle.png"),
    Path("assets/frames/miguel/01_walk_1.png"),
    Path("assets/frames/miguel/02_walk_2.png"),
    Path("assets/frames/miguel/03_walk_3.png"),
    Path("assets/frames/miguel/06_punch.png"),
    Path("assets/frames/miguel/07_power_cast.png"),
    Path("assets/frames/miguel/12_hurt.png"),
]

for arquivo in [entrada, *referencias]:
    if not arquivo.exists():
        raise SystemExit(
            f"ERRO: arquivo não encontrado: {arquivo}"
        )

original = Image.open(entrada).convert("RGBA")
resultado = original.copy()

largura, altura = original.size
origem = original.load()
destino = resultado.load()

alpha_antes = original.getchannel("A")
bbox_antes = alpha_antes.getbbox()

if bbox_antes is None:
    raise SystemExit(
        "ERRO: candidato sem conteúdo visível."
    )

left, top, right, bottom = bbox_antes


def hsv_da_cor(cor):
    r, g, b, _ = cor

    h, s, v = colorsys.rgb_to_hsv(
        r / 255,
        g / 255,
        b / 255,
    )

    return h * 360, s, v


def parece_vermelho_legitimo(cor):
    r, g, b, _ = cor

    return (
        r >= 80
        and r >= g * 1.50
        and r >= b * 1.75
    )


def parece_azul_legitimo(cor):
    r, g, b, _ = cor

    return (
        b >= 65
        and b >= r * 1.55
        and b >= g * 1.25
    )


def parece_marrom_legitimo(cor):
    r, g, b, _ = cor

    return (
        r >= 35
        and r >= g * 1.20
        and g >= b * 1.15
    )


def suspeito_estrito(cor):
    r, g, b, a = cor

    if a == 0:
        return False

    h, s, v = hsv_da_cor(cor)

    return (
        275 <= h <= 345
        and s >= 0.34
        and v >= 0.055
        and r >= 12
        and b >= 12
        and min(r, b) >= g + 5
        and not parece_vermelho_legitimo(cor)
        and not parece_azul_legitimo(cor)
        and not parece_marrom_legitimo(cor)
    )


def perto_da_transparencia(x, y, raio=2):
    for ny in range(
        max(0, y - raio),
        min(altura, y + raio + 1),
    ):
        for nx in range(
            max(0, x - raio),
            min(largura, x + raio + 1),
        ):
            if nx == x and ny == y:
                continue

            if origem[nx, ny][3] == 0:
                return True

    return False


def luminancia(cor):
    r, g, b, _ = cor

    return (
        0.2126 * r
        + 0.7152 * g
        + 0.0722 * b
    )


def distancia_quadrada(cor_a, cor_b):
    return (
        (cor_a[0] - cor_b[0]) ** 2
        + (cor_a[1] - cor_b[1]) ** 2
        + (cor_a[2] - cor_b[2]) ** 2
    )


# --------------------------------------------------
# Paleta dos frames aprovados
# --------------------------------------------------
contagem_paleta = Counter()
paleta_aprovada_exata = set()

for referencia in referencias:
    imagem_ref = Image.open(referencia).convert("RGBA")

    for cor in imagem_ref.getdata():
        if cor[3] == 0:
            continue

        paleta_aprovada_exata.add(cor)
        contagem_paleta[cor] += 1


# Também incorpora cores legítimas deste próprio frame,
# como os dourados exclusivos do troféu.
for y in range(top, bottom):
    for x in range(left, right):
        cor = origem[x, y]

        if cor[3] == 0:
            continue

        if suspeito_estrito(cor):
            continue

        contagem_paleta[cor] += 1


paleta = {
    cor
    for cor, _ in contagem_paleta.most_common(2200)
}

# Preserva também cores escuras importantes de contorno.
cores_escuras = sorted(
    contagem_paleta,
    key=lambda cor: (
        luminancia(cor),
        -contagem_paleta[cor],
    ),
)[:450]

paleta.update(cores_escuras)

# Acrescenta cores muito frequentes por faixa visual.
for cor, quantidade in contagem_paleta.items():
    r, g, b, _ = cor

    if quantidade < 2:
        continue

    if (
        max(r, g, b) <= 55
        or (
            r >= 120
            and r >= g * 1.35
            and r >= b * 1.45
        )
        or (
            b >= 90
            and b >= r * 1.40
            and b >= g * 1.15
        )
        or (
            r >= 150
            and g >= 75
            and b <= 130
        )
    ):
        paleta.add(cor)

paleta = sorted(paleta)

if not paleta:
    raise SystemExit(
        "ERRO: não foi possível construir a paleta."
    )


# --------------------------------------------------
# Seleção controlada
# --------------------------------------------------
suspeitos_estritos = []
selecionados = []

for y in range(top, bottom):
    for x in range(left, right):
        cor = origem[x, y]

        if not suspeito_estrito(cor):
            continue

        suspeitos_estritos.append((x, y, cor))

        if cor in paleta_aprovada_exata:
            continue

        if not perto_da_transparencia(x, y, raio=2):
            continue

        selecionados.append((x, y, cor))


if not selecionados:
    raise SystemExit(
        "ERRO: nenhum pixel cumpriu todos "
        "os critérios controlados."
    )

if len(selecionados) > 2400:
    raise SystemExit(
        "ERRO: seleção acima do limite de segurança: "
        f"{len(selecionados)}"
    )

selecionados_xy = {
    (x, y)
    for x, y, _ in selecionados
}


# --------------------------------------------------
# Contexto cromático local
# --------------------------------------------------
def media_local(x, y):
    """
    Busca cores legítimas dentro do mesmo componente
    visível.

    A busca pode atravessar pixels selecionados, mas
    nunca atravessa transparência. Isso resolve grupos
    violetas maiores que o antigo raio de quatro pixels.
    """
    fila = deque([(x, y, 0)])
    visitados = {(x, y)}

    cores = []
    primeira_distancia_segura = None
    distancia_maxima = 24

    while fila:
        cx, cy, distancia = fila.popleft()

        if distancia > distancia_maxima:
            break

        if (cx, cy) != (x, y):
            cor = origem[cx, cy]

            if (
                cor[3] > 0
                and (cx, cy) not in selecionados_xy
                and not suspeito_estrito(cor)
            ):
                if primeira_distancia_segura is None:
                    primeira_distancia_segura = distancia

                if distancia <= primeira_distancia_segura + 2:
                    cores.append(cor)

                elif len(cores) >= 8:
                    break

        if distancia >= distancia_maxima:
            continue

        for ny in range(
            max(0, cy - 1),
            min(altura, cy + 2),
        ):
            for nx in range(
                max(0, cx - 1),
                min(largura, cx + 2),
            ):
                if nx == cx and ny == cy:
                    continue

                if (nx, ny) in visitados:
                    continue

                # Não atravessa transparência e, portanto,
                # permanece no mesmo componente visual.
                if origem[nx, ny][3] == 0:
                    continue

                visitados.add((nx, ny))
                fila.append(
                    (nx, ny, distancia + 1)
                )

    if cores:
        quantidade = len(cores)

        return (
            round(
                sum(cor[0] for cor in cores)
                / quantidade
            ),
            round(
                sum(cor[1] for cor in cores)
                / quantidade
            ),
            round(
                sum(cor[2] for cor in cores)
                / quantidade
            ),
            255,
        )

    # Salvaguarda final: escolhe a cor válida da
    # paleta mais próxima do pixel original.
    cor_original = origem[x, y]

    return min(
        paleta,
        key=lambda cor: distancia_quadrada(
            cor_original,
            cor,
        ),
    )


alteracoes = []

for x, y, cor_original in selecionados:
    contexto = media_local(x, y)

    if contexto is None:
        raise SystemExit(
            "ERRO: não foi encontrado contexto local "
            f"para o pixel ({x}, {y})."
        )

    brilho_contexto = luminancia(contexto)

    candidatos = [
        cor
        for cor in paleta
        if abs(
            luminancia(cor) - brilho_contexto
        ) <= 85
    ]

    if not candidatos:
        candidatos = paleta

    substituta = min(
        candidatos,
        key=lambda cor: (
            distancia_quadrada(cor, cor_original)
            + 0.85
            * distancia_quadrada(cor, contexto)
        ),
    )

    destino[x, y] = substituta

    alteracoes.append({
        "x": x,
        "y": y,
        "antes": cor_original,
        "depois": substituta,
        "contexto": contexto,
    })


# --------------------------------------------------
# Verificações estruturais
# --------------------------------------------------
alpha_depois = resultado.getchannel("A")
bbox_depois = alpha_depois.getbbox()

if alpha_antes.tobytes() != alpha_depois.tobytes():
    raise SystemExit(
        "ERRO: a camada alfa foi alterada."
    )

if bbox_depois != bbox_antes:
    raise SystemExit(
        "ERRO: o bounding box foi alterado: "
        f"{bbox_antes} -> {bbox_depois}"
    )

visiveis_antes = sum(
    1
    for valor in alpha_antes.tobytes()
    if valor > 0
)

visiveis_depois = sum(
    1
    for valor in alpha_depois.tobytes()
    if valor > 0
)

if visiveis_depois != visiveis_antes:
    raise SystemExit(
        "ERRO: pixels visíveis alterados: "
        f"{visiveis_antes} -> {visiveis_depois}"
    )


restantes_controlados = []

for y in range(top, bottom):
    for x in range(left, right):
        cor = destino[x, y]

        if (
            suspeito_estrito(cor)
            and cor not in paleta_aprovada_exata
            and perto_da_transparencia(x, y, raio=2)
        ):
            restantes_controlados.append(
                (x, y, cor)
            )

if restantes_controlados:
    raise SystemExit(
        "ERRO: ainda restaram pixels do conjunto "
        f"controlado: {len(restantes_controlados)}"
    )

resultado.save(saida)


# --------------------------------------------------
# Artefatos visuais
# --------------------------------------------------
mascara = Image.new(
    "RGBA",
    original.size,
    (0, 0, 0, 0),
)

mascara_pixels = mascara.load()

for item in alteracoes:
    mascara_pixels[
        item["x"],
        item["y"],
    ] = (0, 255, 255, 255)

mascara.save(mascara_path)


preview = Image.new(
    "RGBA",
    original.size,
    (18, 18, 18, 255),
)

preview.alpha_composite(resultado)
preview.save(preview_path)


overlay = preview.copy()
overlay_pixels = overlay.load()

for item in alteracoes:
    overlay_pixels[
        item["x"],
        item["y"],
    ] = (0, 255, 255, 255)

overlay.save(overlay_path)


def criar_comparacao(
    crop_box,
    destino_path,
    zoom,
):
    antes = original.crop(crop_box)
    depois = resultado.crop(crop_box)

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
    legenda = 36

    canvas = Image.new(
        "RGBA",
        (
            antes.width * 2 + espaco,
            max(antes.height, depois.height)
            + legenda,
        ),
        (18, 18, 18, 255),
    )

    canvas.alpha_composite(
        antes,
        (0, legenda),
    )

    canvas.alpha_composite(
        depois,
        (antes.width + espaco, legenda),
    )

    draw = ImageDraw.Draw(canvas)

    draw.text(
        (8, 9),
        "ANTES",
        fill=(255, 255, 255, 255),
    )

    draw.text(
        (antes.width + espaco + 8, 9),
        "DEPOIS",
        fill=(255, 255, 255, 255),
    )

    canvas.save(destino_path)


margem = 10

crop_total = (
    max(0, left - margem),
    max(0, top - margem),
    min(largura, right + margem),
    min(altura, bottom + margem),
)

criar_comparacao(
    crop_total,
    comparacao_path,
    zoom=2,
)

altura_bbox = bottom - top

crop_superior = (
    max(0, left - margem),
    max(0, top - margem),
    min(largura, right + margem),
    min(
        altura,
        top + round(altura_bbox * 0.70)
        + margem,
    ),
)

criar_comparacao(
    crop_superior,
    comparacao_superior_path,
    zoom=3,
)


xs = [item["x"] for item in alteracoes]
ys = [item["y"] for item in alteracoes]

bbox_alteracoes = (
    min(xs),
    min(ys),
    max(xs) + 1,
    max(ys) + 1,
)

linhas = [
    f"Entrada: {entrada}",
    f"Saída candidata: {saida}",
    f"Dimensão: {original.size}",
    f"Bounding box: {bbox_antes}",
    f"Pixels visíveis: {visiveis_depois}",
    (
        "Suspeitos encontrados pelo filtro estrito: "
        f"{len(suspeitos_estritos)}"
    ),
    (
        "Pixels selecionados pela regra controlada: "
        f"{len(alteracoes)}"
    ),
    (
        "Pixels controlados restantes: "
        f"{len(restantes_controlados)}"
    ),
    f"Cores disponíveis na paleta: {len(paleta)}",
    f"Bounding box das alterações: {bbox_alteracoes}",
    "Camada alfa preservada: sim",
    "Silhueta preservada: sim",
    f"Máscara: {mascara_path}",
    f"Overlay: {overlay_path}",
    f"Prévia: {preview_path}",
    f"Comparação completa: {comparacao_path}",
    f"Comparação superior: {comparacao_superior_path}",
    "",
    "PRIMEIRAS ALTERAÇÕES:",
]

for item in sorted(
    alteracoes,
    key=lambda registro: (
        registro["y"],
        registro["x"],
    ),
)[:200]:
    linhas.append(
        f"({item['x']}, {item['y']}) | "
        f"{item['antes']} -> {item['depois']} | "
        f"contexto={item['contexto']}"
    )

relatorio_path.write_text(
    "\n".join(linhas) + "\n",
    encoding="utf-8",
)

print("\n".join(linhas[:18]))
