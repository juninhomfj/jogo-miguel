from collections import Counter
from pathlib import Path

from PIL import Image

entrada = Path(
    "incoming/sprites/10_dust_3_chroma_bruto.png"
)

pasta = Path(
    "artifacts/frame-validation/"
    "10_dust_3_chroma_diagnostic"
)

relatorio = pasta / "relatorio_chroma.txt"
mascara_path = pasta / "mascara_magenta_candidata.png"

imagem = Image.open(entrada).convert("RGBA")
largura, altura = imagem.size
faixa = min(100, largura // 8, altura // 8)

pixels = imagem.load()

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

mascara = Image.new(
    "RGBA",
    imagem.size,
    (0, 0, 0, 0),
)
mascara_pixels = mascara.load()

candidatos = 0

for y in range(altura):
    for x in range(largura):
        r, g, b, a = pixels[x, y]

        # Detecção propositalmente ampla.
        # Esta etapa apenas cria uma máscara para diagnóstico.
        magenta = (
            a > 0
            and r >= 130
            and b >= 130
            and g <= 150
            and r >= g + 45
            and b >= g + 45
        )

        if magenta:
            mascara_pixels[x, y] = (
                255, 255, 255, 255
            )
            candidatos += 1

mascara.save(mascara_path)

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
    f"Bounding box da máscara: "
    f"{mascara.getchannel('A').getbbox()}",
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
