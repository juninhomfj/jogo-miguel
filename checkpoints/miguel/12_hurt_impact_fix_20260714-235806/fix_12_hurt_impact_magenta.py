from collections import deque
from pathlib import Path

from PIL import Image, ImageDraw

entrada = Path(
    "incoming/sprites/"
    "12_hurt_full_magenta_fixed_candidate.png"
)

saida = Path(
    "incoming/sprites/"
    "12_hurt_final_clean_candidate.png"
)

pasta = Path(
    "artifacts/frame-validation/"
    "12_hurt_impact_fix"
)

relatorio_path = pasta / "relatorio.txt"
mascara_path = pasta / "pixels_corrigidos.png"
comparacao_path = pasta / "comparacao_ampliada.png"
preview_path = pasta / "candidato_preview.png"

if not entrada.exists():
    raise SystemExit(
        f"ERRO: candidato anterior não encontrado: {entrada}"
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

        componentes.append(
            {
                "pixels": len(coordenadas),
                "coords": coordenadas,
                "bbox": (
                    min_x,
                    min_y,
                    max_x + 1,
                    max_y + 1,
                ),
            }
        )

    componentes.sort(
        key=lambda item: item["pixels"],
        reverse=True,
    )

    return componentes


componentes = obter_componentes(original)

if len(componentes) < 2:
    raise SystemExit(
        "ERRO: não foi possível separar Miguel "
        "do efeito de impacto."
    )

# O maior componente é Miguel.
principal = componentes[0]

# Todos os demais componentes pertencem ao impacto.
componentes_impacto = componentes[1:]

pixels_impacto = {
    coordenada
    for componente in componentes_impacto
    for coordenada in componente["coords"]
}

print("Componentes encontrados:", len(componentes))
print(
    "Componente do Miguel:",
    principal["bbox"],
    principal["pixels"],
)
print("Componentes do impacto:")

for indice, componente in enumerate(
    componentes_impacto,
    start=1,
):
    print(
        f"C{indice:02d} | "
        f"pixels={componente['pixels']} | "
        f"bbox={componente['bbox']}"
    )


def magenta_residual(cor):
    r, g, b, a = cor

    if a == 0:
        return False

    # Detecta rosa/magenta no impacto.
    # Não classifica vermelho, laranja, amarelo ou branco.
    return (
        r >= 180
        and g <= 120
        and b >= 75
        and b >= g + 20
    )


def cor_valida_do_impacto(cor):
    r, g, b, a = cor

    if a == 0 or magenta_residual(cor):
        return False

    branco = (
        r >= 190
        and g >= 190
        and b >= 170
    )

    amarelo_ou_laranja = (
        r >= 180
        and g >= 70
        and b <= 150
        and r >= g
    )

    vermelho_quente = (
        r >= 170
        and g <= 110
        and b <= 74
    )

    return (
        branco
        or amarelo_ou_laranja
        or vermelho_quente
    )


suspeitos = []

for x, y in pixels_impacto:
    cor = origem[x, y]

    if magenta_residual(cor):
        suspeitos.append((x, y, cor))

if not suspeitos:
    raise SystemExit(
        "ERRO: nenhum pixel magenta foi localizado "
        "nos componentes do impacto."
    )

suspeitos_xy = {
    (x, y)
    for x, y, _ in suspeitos
}

paleta_global = {
    origem[x, y]
    for x, y in pixels_impacto
    if cor_valida_do_impacto(origem[x, y])
}

if not paleta_global:
    raise SystemExit(
        "ERRO: não foi possível construir "
        "a paleta válida do impacto."
    )


def distancia_quadrada(cor_a, cor_b):
    return (
        (cor_a[0] - cor_b[0]) ** 2
        + (cor_a[1] - cor_b[1]) ** 2
        + (cor_a[2] - cor_b[2]) ** 2
    )


def vizinhos_validos(x, y):
    for raio in (1, 2, 3, 4):
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

                if (nx, ny) not in pixels_impacto:
                    continue

                if (nx, ny) in suspeitos_xy:
                    continue

                cor = origem[nx, ny]

                if cor_valida_do_impacto(cor):
                    cores.append(cor)

        if cores:
            return cores

    return []


alteracoes = []

for x, y, cor_original in suspeitos:
    candidatos = vizinhos_validos(x, y)

    if not candidatos:
        candidatos = list(paleta_global)

    substituta = min(
        candidatos,
        key=lambda cor: distancia_quadrada(
            cor_original,
            cor,
        ),
    )

    destino[x, y] = substituta

    alteracoes.append(
        {
            "x": x,
            "y": y,
            "antes": cor_original,
            "depois": substituta,
        }
    )

bbox_antes = original.getchannel("A").getbbox()
bbox_depois = resultado.getchannel("A").getbbox()

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

if bbox_depois != bbox_antes:
    raise SystemExit(
        "ERRO: o bounding box foi alterado: "
        f"{bbox_antes} -> {bbox_depois}"
    )

if visiveis_depois != visiveis_antes:
    raise SystemExit(
        "ERRO: a silhueta foi alterada: "
        f"{visiveis_antes} -> {visiveis_depois}"
    )

restantes = []

for x, y in pixels_impacto:
    cor = destino[x, y]

    if magenta_residual(cor):
        restantes.append((x, y, cor))

if restantes:
    raise SystemExit(
        "ERRO: ainda existem pixels magenta "
        f"no impacto: {len(restantes)}"
    )

resultado.save(saida)

# Máscara dos pixels alterados.
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

# Prévia em fundo escuro.
preview = Image.new(
    "RGBA",
    resultado.size,
    (20, 20, 20, 255),
)

preview.alpha_composite(resultado)
preview.save(preview_path)

# Comparação ampliada.
left, top, right, bottom = bbox_antes
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

linhas = [
    f"Entrada: {entrada}",
    f"Saída candidata: {saida}",
    f"Bounding box: {bbox_antes}",
    f"Componentes encontrados: {len(componentes)}",
    (
        "Componentes do impacto analisados: "
        f"{len(componentes_impacto)}"
    ),
    (
        "Pixels pertencentes ao impacto: "
        f"{len(pixels_impacto)}"
    ),
    (
        "Pixels magenta encontrados no impacto: "
        f"{len(alteracoes)}"
    ),
    "Pixels magenta restantes no impacto: 0",
    f"Pixels visíveis: {visiveis_depois}",
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
        f"{item['antes']} -> {item['depois']}"
    )

relatorio_path.write_text(
    "\n".join(linhas) + "\n",
    encoding="utf-8",
)

print()
print("\n".join(linhas[:9]))
print()
print("Relatório:", relatorio_path)
print("Máscara:", mascara_path)
print("Comparação:", comparacao_path)
print("Prévia:", preview_path)
