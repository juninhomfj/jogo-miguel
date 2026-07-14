from collections import Counter
from pathlib import Path

from PIL import Image

entrada = Path(
    "incoming/sprites/12_hurt_chroma_bruto.png"
)

pasta = Path(
    "artifacts/frame-validation/"
    "12_hurt_chroma_diagnostic"
)

relatorio = pasta / "relatorio_chroma.txt"
mascara_path = pasta / "mascara_chroma_candidata.png"
preview_path = pasta / "preview_candidatos.png"

if not entrada.exists():
    raise SystemExit(
        f"ERRO: arquivo não encontrado: {entrada}"
    )

imagem = Image.open(entrada).convert("RGBA")
largura, altura = imagem.size
pixels = imagem.load()

faixa = min(
    100,
    largura // 8,
    altura // 8,
)

cores_borda = Counter()
alphas = Counter()

for y in range(altura):
    for x in range(largura):
        r, g, b, a = pixels[x, y]
        alphas[a] += 1

        if (
            x < faixa
            or y < faixa
            or x >= largura - faixa
            or y >= altura - faixa
        ):
            cores_borda[(r, g, b, a)] += 1


def eh_chroma(r, g, b, a):
    return (
        a > 0
        and r >= 130
        and b >= 130
        and g <= 155
        and r >= g + 45
        and b >= g + 45
    )


mascara = Image.new(
    "RGBA",
    imagem.size,
    (0, 0, 0, 0),
)

preview = Image.new(
    "RGBA",
    imagem.size,
    (20, 20, 20, 255),
)

preview.alpha_composite(imagem)

mascara_pixels = mascara.load()
preview_pixels = preview.load()

candidatos = 0

for y in range(altura):
    for x in range(largura):
        r, g, b, a = pixels[x, y]

        if eh_chroma(r, g, b, a):
            mascara_pixels[x, y] = (
                255, 255, 255, 255
            )

            preview_pixels[x, y] = (
                255, 255, 255, 255
            )

            candidatos += 1
        elif a > 0:
            preview_pixels[x, y] = (
                15, 15, 15, 255
            )

mascara.save(mascara_path)
preview.save(preview_path)

cantos = {
    "superior_esquerdo": pixels[0, 0],
    "superior_direito": pixels[largura - 1, 0],
    "inferior_esquerdo": pixels[0, altura - 1],
    "inferior_direito": pixels[largura - 1, altura - 1],
    "centro_superior": pixels[largura // 2, 0],
    "centro_inferior": pixels[largura // 2, altura - 1],
}

linhas = [
    f"Arquivo: {entrada}",
    f"Dimensão: {largura}x{altura}",
    f"Faixa externa analisada: {faixa}px",
    f"Pixels candidatos a chroma: {candidatos}",
    (
        "Bounding box da máscara: "
        f"{mascara.getchannel('A').getbbox()}"
    ),
    "",
    "PIXELS DOS CANTOS:",
]

for nome, cor in cantos.items():
    linhas.append(
        f"{nome}: {cor}"
    )

linhas.extend([
    "",
    "VALORES DE ALPHA MAIS COMUNS:",
])

for alpha, quantidade in alphas.most_common(10):
    linhas.append(
        f"alpha={alpha} | pixels={quantidade}"
    )

linhas.extend([
    "",
    "CORES MAIS COMUNS NA BORDA:",
])

for cor, quantidade in cores_borda.most_common(40):
    linhas.append(
        f"{cor} | pixels={quantidade}"
    )

relatorio.write_text(
    "\n".join(linhas) + "\n",
    encoding="utf-8",
)

print("\n".join(linhas))
print()
print("Relatório:", relatorio)
print("Máscara:", mascara_path)
print("Prévia:", preview_path)
