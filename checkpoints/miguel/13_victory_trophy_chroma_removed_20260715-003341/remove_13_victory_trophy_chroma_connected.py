from collections import deque
from pathlib import Path

from PIL import Image

entrada = Path(
    "incoming/sprites/"
    "13_victory_trophy_chroma_bruto.png"
)

saida = Path(
    "incoming/sprites/"
    "13_victory_trophy_chroma_sem_fundo_conectado.png"
)

pasta = Path(
    "artifacts/frame-validation/"
    "13_victory_trophy_chroma_removal"
)

preview_path = pasta / "13_victory_trophy_chroma_preview.png"
relatorio_path = pasta / "relatorio.txt"

if not entrada.exists():
    raise SystemExit(
        f"ERRO: arquivo não encontrado: {entrada}"
    )

imagem = Image.open(entrada).convert("RGBA")
largura, altura = imagem.size
pixels = imagem.load()
total = largura * altura


def eh_chroma(r, g, b, a):
    # Mesmo critério utilizado no diagnóstico aprovado.
    return (
        a > 0
        and r >= 150
        and b >= 120
        and g <= 110
        and r - g >= 70
        and b - g >= 40
    )


candidatos = bytearray(total)
quantidade_candidatos = 0

print("Mapeando pixels candidatos a chroma...")

for y in range(altura):
    base = y * largura

    for x in range(largura):
        r, g, b, a = pixels[x, y]

        if eh_chroma(r, g, b, a):
            candidatos[base + x] = 1
            quantidade_candidatos += 1

print(
    "Pixels candidatos a chroma:",
    quantidade_candidatos,
)

visitados = bytearray(total)
fila = deque()


def adicionar_semente(x, y):
    indice = y * largura + x

    if (
        candidatos[indice]
        and not visitados[indice]
    ):
        visitados[indice] = 1
        fila.append(indice)


# Usa todas as bordas como sementes.
for x in range(largura):
    adicionar_semente(x, 0)
    adicionar_semente(x, altura - 1)

for y in range(altura):
    adicionar_semente(0, y)
    adicionar_semente(largura - 1, y)

print(
    "Sementes encontradas nas bordas:",
    len(fila),
)

if not fila:
    raise SystemExit(
        "ERRO: nenhum chroma foi encontrado nas bordas."
    )

print("Percorrendo o fundo conectado...")

processados = 0
proximo_aviso = 250000

while fila:
    indice = fila.popleft()
    y, x = divmod(indice, largura)

    processados += 1

    if processados >= proximo_aviso:
        print(
            f"  {processados} pixels "
            "conectados processados..."
        )
        proximo_aviso += 250000

    if x > 0:
        vizinho = indice - 1

        if (
            candidatos[vizinho]
            and not visitados[vizinho]
        ):
            visitados[vizinho] = 1
            fila.append(vizinho)

    if x + 1 < largura:
        vizinho = indice + 1

        if (
            candidatos[vizinho]
            and not visitados[vizinho]
        ):
            visitados[vizinho] = 1
            fila.append(vizinho)

    if y > 0:
        vizinho = indice - largura

        if (
            candidatos[vizinho]
            and not visitados[vizinho]
        ):
            visitados[vizinho] = 1
            fila.append(vizinho)

    if y + 1 < altura:
        vizinho = indice + largura

        if (
            candidatos[vizinho]
            and not visitados[vizinho]
        ):
            visitados[vizinho] = 1
            fila.append(vizinho)

print("Removendo o fundo conectado...")

removidos = 0

for indice, conectado in enumerate(visitados):
    if not conectado:
        continue

    y, x = divmod(indice, largura)
    r, g, b, _ = pixels[x, y]

    pixels[x, y] = (r, g, b, 0)
    removidos += 1

candidatos_restantes = (
    quantidade_candidatos - removidos
)

imagem.save(saida)

alpha = imagem.getchannel("A")
bbox = alpha.getbbox()

pixels_visiveis = sum(
    1
    for valor in alpha.tobytes()
    if valor > 0
)

if bbox is None:
    raise SystemExit(
        "ERRO: o resultado ficou totalmente transparente."
    )

preview = Image.new(
    "RGBA",
    imagem.size,
    (20, 20, 20, 255),
)

preview.alpha_composite(imagem)
preview.save(preview_path)

linhas = [
    f"Entrada: {entrada}",
    f"Saída: {saida}",
    f"Dimensão: {largura}x{altura}",
    (
        "Pixels candidatos a chroma: "
        f"{quantidade_candidatos}"
    ),
    (
        "Pixels conectados às bordas removidos: "
        f"{removidos}"
    ),
    (
        "Candidatos não conectados preservados: "
        f"{candidatos_restantes}"
    ),
    (
        "Pixels visíveis restantes: "
        f"{pixels_visiveis}"
    ),
    f"Bounding box final: {bbox}",
    f"Prévia: {preview_path}",
]

relatorio_path.write_text(
    "\n".join(linhas) + "\n",
    encoding="utf-8",
)

print()
print("\n".join(linhas))
