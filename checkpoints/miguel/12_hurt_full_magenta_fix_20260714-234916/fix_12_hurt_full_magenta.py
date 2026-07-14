from collections import Counter, deque
from pathlib import Path

from PIL import Image, ImageDraw

entrada = Path(
    "incoming/sprites/12_hurt.png"
)

saida = Path(
    "incoming/sprites/"
    "12_hurt_full_magenta_fixed_candidate.png"
)

pasta = Path(
    "artifacts/frame-validation/"
    "12_hurt_full_magenta_fix"
)

mascara_path = pasta / "pixels_corrigidos.png"
comparacao_path = pasta / "comparacao_ampliada.png"
preview_path = pasta / "candidato_preview.png"
relatorio_path = pasta / "relatorio.txt"

referencias = [
    Path("assets/frames/miguel/00_idle.png"),
    Path("assets/frames/miguel/01_walk_1.png"),
    Path("assets/frames/miguel/02_walk_2.png"),
    Path("assets/frames/miguel/03_walk_3.png"),
    Path("assets/frames/miguel/06_punch.png"),
    Path("assets/frames/miguel/07_power_cast.png"),
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


def obter_componentes(imagem):
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

        while fila:
            indice = fila.popleft()
            y, x = divmod(indice, largura)

            coordenadas.append((x, y))

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
            "pixels": len(coordenadas),
            "coords": coordenadas,
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


componentes = obter_componentes(original)

if len(componentes) < 2:
    raise SystemExit(
        "ERRO: eram esperados Miguel e o efeito de impacto."
    )

principal = componentes[0]
pixels_miguel = set(principal["coords"])

print("Componentes encontrados:", len(componentes))
print("Componente do Miguel:", principal["bbox"])
print("Pixels no componente do Miguel:", principal["pixels"])


# Paleta conhecida dos frames aprovados.
paleta_aprovada = set()

for referencia in referencias:
    imagem_ref = Image.open(referencia).convert("RGBA")

    for y in range(imagem_ref.height):
        for x in range(imagem_ref.width):
            r, g, b, a = imagem_ref.getpixel((x, y))

            if a > 0:
                paleta_aprovada.add((r, g, b, a))

paleta_aprovada = sorted(paleta_aprovada)

paleta_escura = [
    cor
    for cor in paleta_aprovada
    if max(cor[:3]) <= 100
]

if not paleta_aprovada or not paleta_escura:
    raise SystemExit(
        "ERRO: não foi possível montar a paleta aprovada."
    )


def magenta_residual(cor):
    r, g, b, a = cor

    if a == 0:
        return False

    # Vermelho legítimo: B muito menor que R.
    # Azul legítimo: R muito menor que B.
    # Roxo/magenta: R e B simultaneamente elevados.
    return (
        r >= 28
        and b >= 28
        and g <= 100
        and min(r, b) >= g + 18
        and b >= r * 0.34
        and r >= b * 0.34
    )


suspeitos = []

for x, y in pixels_miguel:
    cor = origem[x, y]

    if (
        cor not in paleta_aprovada
        and magenta_residual(cor)
    ):
        suspeitos.append((x, y, cor))

if not suspeitos:
    raise SystemExit(
        "ERRO: nenhum resíduo magenta foi localizado."
    )

suspeitos_xy = {
    (x, y)
    for x, y, _ in suspeitos
}


def distancia_quadrada(cor_a, cor_b):
    return (
        (cor_a[0] - cor_b[0]) ** 2
        + (cor_a[1] - cor_b[1]) ** 2
        + (cor_a[2] - cor_b[2]) ** 2
    )


def toca_transparencia(x, y):
    for ny in range(max(0, y - 1), min(altura, y + 2)):
        for nx in range(max(0, x - 1), min(largura, x + 2)):
            if nx == x and ny == y:
                continue

            if origem[nx, ny][3] == 0:
                return True

    return False


def obter_vizinhos_validos(x, y):
    for raio in (1, 2, 3):
        cores = []

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

                if (nx, ny) not in pixels_miguel:
                    continue

                if (nx, ny) in suspeitos_xy:
                    continue

                cor = origem[nx, ny]

                if cor[3] == 0:
                    continue

                cores.append(cor)

        if cores:
            return cores

    return []


alteracoes = []

for x, y, cor_original in suspeitos:
    vizinhos = obter_vizinhos_validos(x, y)
    borda = toca_transparencia(x, y)

    candidatos = []

    for cor_vizinha in vizinhos:
        mais_proxima = min(
            paleta_aprovada,
            key=lambda cor: distancia_quadrada(
                cor_vizinha,
                cor,
            ),
        )

        candidatos.append(mais_proxima)

    if borda:
        candidatos_escuros = [
            cor
            for cor in candidatos
            if max(cor[:3]) <= 110
        ]

        if candidatos_escuros:
            candidatos = candidatos_escuros
        else:
            candidatos = paleta_escura

    if candidatos:
        contagem = Counter(candidatos)

        maior_frequencia = max(contagem.values())

        mais_frequentes = [
            cor
            for cor, quantidade in contagem.items()
            if quantidade == maior_frequencia
        ]

        substituta = min(
            mais_frequentes,
            key=lambda cor: distancia_quadrada(
                cor_original,
                cor,
            ),
        )
    else:
        substituta = min(
            paleta_escura if borda else paleta_aprovada,
            key=lambda cor: distancia_quadrada(
                cor_original,
                cor,
            ),
        )

    destino[x, y] = substituta

    alteracoes.append({
        "x": x,
        "y": y,
        "antes": cor_original,
        "depois": substituta,
        "borda": borda,
    })


resultado.save(saida)

bbox_original = original.getchannel("A").getbbox()
bbox_final = resultado.getchannel("A").getbbox()

visiveis_originais = sum(
    1
    for valor in original.getchannel("A").tobytes()
    if valor > 0
)

visiveis_finais = sum(
    1
    for valor in resultado.getchannel("A").tobytes()
    if valor > 0
)

if bbox_final != bbox_original:
    raise SystemExit(
        "ERRO: bounding box alterado: "
        f"{bbox_original} -> {bbox_final}"
    )

if visiveis_finais != visiveis_originais:
    raise SystemExit(
        "ERRO: quantidade de pixels visíveis alterada: "
        f"{visiveis_originais} -> {visiveis_finais}"
    )

restantes = []

for x, y in pixels_miguel:
    cor = destino[x, y]

    if (
        cor not in paleta_aprovada
        and magenta_residual(cor)
    ):
        restantes.append((x, y, cor))

if restantes:
    raise SystemExit(
        "ERRO: resíduos magenta restantes: "
        f"{len(restantes)}"
    )


# Máscara dos pixels corrigidos.
mascara = Image.new(
    "RGBA",
    original.size,
    (0, 0, 0, 0),
)

mascara_pixels = mascara.load()

for item in alteracoes:
    mascara_pixels[item["x"], item["y"]] = (
        0, 255, 255, 255
    )

mascara.save(mascara_path)


# Prévia do candidato.
preview = Image.new(
    "RGBA",
    resultado.size,
    (20, 20, 20, 255),
)

preview.alpha_composite(resultado)
preview.save(preview_path)


# Comparação ampliada.
left, top, right, bottom = bbox_original
margem = 6

crop_box = (
    max(0, left - margem),
    max(0, top - margem),
    min(largura, right + margem),
    min(altura, bottom + margem),
)

antes = original.crop(crop_box)
depois = resultado.crop(crop_box)

escala = 6

antes = antes.resize(
    (
        antes.width * escala,
        antes.height * escala,
    ),
    Image.Resampling.NEAREST,
)

depois = depois.resize(
    (
        depois.width * escala,
        depois.height * escala,
    ),
    Image.Resampling.NEAREST,
)

espaco = 24

comparacao = Image.new(
    "RGBA",
    (
        antes.width * 2 + espaco,
        antes.height,
    ),
    (20, 20, 20, 255),
)

comparacao.alpha_composite(antes, (0, 0))
comparacao.alpha_composite(
    depois,
    (antes.width + espaco, 0),
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


alteracoes_borda = sum(
    1
    for item in alteracoes
    if item["borda"]
)

alteracoes_internas = (
    len(alteracoes) - alteracoes_borda
)

linhas = [
    f"Entrada: {entrada}",
    f"Saída candidata: {saida}",
    f"Bounding box: {bbox_original}",
    f"Componentes encontrados: {len(componentes)}",
    f"Pixels no componente do Miguel: {principal['pixels']}",
    f"Cores na paleta aprovada: {len(paleta_aprovada)}",
    f"Pixels magenta encontrados: {len(alteracoes)}",
    f"Pixels corrigidos na borda: {alteracoes_borda}",
    f"Pixels corrigidos internamente: {alteracoes_internas}",
    f"Pixels magenta restantes: {len(restantes)}",
    f"Pixels visíveis: {visiveis_finais}",
    "",
    "ALTERAÇÕES:",
]

for item in sorted(
    alteracoes,
    key=lambda registro: (
        registro["y"],
        registro["x"],
    ),
):
    linhas.append(
        f"({item['x']}, {item['y']}) | "
        f"{item['antes']} -> {item['depois']} | "
        f"borda={'sim' if item['borda'] else 'não'}"
    )

relatorio_path.write_text(
    "\n".join(linhas) + "\n",
    encoding="utf-8",
)

print("\n".join(linhas[:11]))
print()
print("Relatório:", relatorio_path)
print("Máscara:", mascara_path)
print("Comparação:", comparacao_path)
print("Prévia:", preview_path)
