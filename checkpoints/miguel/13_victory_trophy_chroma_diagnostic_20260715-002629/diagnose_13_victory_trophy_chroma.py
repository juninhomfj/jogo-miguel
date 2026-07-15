from pathlib import Path
from collections import Counter
from PIL import Image

entrada = Path("incoming/sprites/13_victory_trophy_chroma_bruto.png")
saida_dir = Path("artifacts/frame-validation/13_victory_trophy_chroma_diagnostic")
saida_dir.mkdir(parents=True, exist_ok=True)

if not entrada.exists():
    raise SystemExit(f"ERRO: arquivo não encontrado: {entrada}")

img = Image.open(entrada).convert("RGBA")
w, h = img.size
px = img.load()

faixa = 100

def eh_candidato(r, g, b, a):
    if a == 0:
        return False
    return (
        r >= 150 and
        b >= 120 and
        g <= 110 and
        (r - g) >= 70 and
        (b - g) >= 40
    )

borda_counter = Counter()
alpha_counter = Counter()
candidatos = []

for y in range(h):
    for x in range(w):
        r, g, b, a = px[x, y]
        alpha_counter[a] += 1

        if x < faixa or x >= w-faixa or y < faixa or y >= h-faixa:
            borda_counter[(r, g, b, a)] += 1

        if eh_candidato(r, g, b, a):
            candidatos.append((x, y, r, g, b, a))

mascara = Image.new("RGBA", (w, h), (0, 0, 0, 255))
mascara_px = mascara.load()

preview = img.copy()
preview_px = preview.load()

min_x = min((c[0] for c in candidatos), default=None)
min_y = min((c[1] for c in candidatos), default=None)
max_x = max((c[0] for c in candidatos), default=None)
max_y = max((c[1] for c in candidatos), default=None)

for x, y, r, g, b, a in candidatos:
    mascara_px[x, y] = (255, 255, 255, 255)
    preview_px[x, y] = (0, 255, 255, 255)

bbox = None
if candidatos:
    bbox = (min_x, min_y, max_x + 1, max_y + 1)

mascara_path = saida_dir / "mascara_chroma_candidata.png"
preview_path = saida_dir / "preview_candidatos.png"
relatorio_path = saida_dir / "relatorio_chroma.txt"

mascara.save(mascara_path)
preview.save(preview_path)

cantos = {
    "superior_esquerdo": px[0, 0],
    "superior_direito": px[w-1, 0],
    "inferior_esquerdo": px[0, h-1],
    "inferior_direito": px[w-1, h-1],
    "centro_superior": px[w//2, 0],
    "centro_inferior": px[w//2, h-1],
}

with relatorio_path.open("w", encoding="utf-8") as f:
    f.write(f"Arquivo: {entrada}\n")
    f.write(f"Dimensão: {w}x{h}\n")
    f.write(f"Faixa externa analisada: {faixa}px\n")
    f.write(f"Pixels candidatos a chroma: {len(candidatos)}\n")
    f.write(f"Bounding box da máscara: {bbox}\n\n")

    f.write("PIXELS DOS CANTOS:\n")
    for nome, cor in cantos.items():
        f.write(f"{nome}: {cor}\n")

    f.write("\nVALORES DE ALPHA MAIS COMUNS:\n")
    for alpha, qtd in alpha_counter.most_common(10):
        f.write(f"alpha={alpha} | pixels={qtd}\n")

    f.write("\nCORES MAIS COMUNS NA BORDA:\n")
    for cor, qtd in borda_counter.most_common(40):
        f.write(f"{cor} | pixels={qtd}\n")

print(f"Arquivo: {entrada}")
print(f"Dimensão: {w}x{h}")
print(f"Faixa externa analisada: {faixa}px")
print(f"Pixels candidatos a chroma: {len(candidatos)}")
print(f"Bounding box da máscara: {bbox}")
print()
print("PIXELS DOS CANTOS:")
for nome, cor in cantos.items():
    print(f"{nome}: {cor}")
print()
print("VALORES DE ALPHA MAIS COMUNS:")
for alpha, qtd in alpha_counter.most_common(10):
    print(f"alpha={alpha} | pixels={qtd}")
print()
print("CORES MAIS COMUNS NA BORDA:")
for cor, qtd in borda_counter.most_common(40):
    print(f"{cor} | pixels={qtd}")
print()
print(f"Relatório: {relatorio_path}")
print(f"Máscara: {mascara_path}")
print(f"Prévia: {preview_path}")
