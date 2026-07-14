from pathlib import Path
from collections import Counter
from PIL import Image

SRC = Path("incoming/sprites/12_hurt_pre_magenta_fix_backup.png")
DST = Path("incoming/sprites/12_hurt.png")
REPORT = Path("artifacts/frame-validation/12_hurt_magenta_fix/relatorio_correcao.txt")

if not SRC.exists():
    raise SystemExit(f"ERRO: arquivo de origem não encontrado: {SRC}")

img = Image.open(SRC).convert("RGBA")
out = img.copy()

spix = img.load()
dpix = out.load()

w, h = img.size

def is_suspect(x, y, r, g, b, a):
    if a == 0:
        return False
    # restringe a análise ao topo do sprite, onde ficaram os artefatos no cabelo
    if y > 150:
        return False
    # padrão de magenta/roxo residual
    if r >= 150 and b >= 120 and g <= 90 and (r + b) >= 300:
        return True
    return False

suspects = []
for y in range(h):
    for x in range(w):
        r, g, b, a = spix[x, y]
        if is_suspect(x, y, r, g, b, a):
            suspects.append((x, y, (r, g, b, a)))

def get_replacement(x, y):
    for radius in (1, 2, 3, 4):
        colors = []
        for ny in range(max(0, y - radius), min(h, y + radius + 1)):
            for nx in range(max(0, x - radius), min(w, x + radius + 1)):
                if nx == x and ny == y:
                    continue
                r, g, b, a = spix[nx, ny]
                if a == 0:
                    continue
                if is_suspect(nx, ny, r, g, b, a):
                    continue
                colors.append((r, g, b, a))
        if colors:
            return Counter(colors).most_common(1)[0][0]
    return None

replaced = 0
unresolved = []

for x, y, rgba in suspects:
    replacement = get_replacement(x, y)
    if replacement is None:
        unresolved.append((x, y, rgba))
        continue
    dpix[x, y] = replacement
    replaced += 1

out.save(DST)

# checagem final
final = Image.open(DST).convert("RGBA")
fpix = final.load()

remaining = []
for y in range(h):
    for x in range(w):
        r, g, b, a = fpix[x, y]
        if is_suspect(x, y, r, g, b, a):
            remaining.append((x, y, (r, g, b, a)))

REPORT.parent.mkdir(parents=True, exist_ok=True)
with REPORT.open("w", encoding="utf-8") as f:
    f.write("CORREÇÃO DE PIXELS MAGENTA — 12_hurt\n")
    f.write("=" * 60 + "\n")
    f.write(f"Entrada: {SRC}\n")
    f.write(f"Saída: {DST}\n")
    f.write(f"Dimensão: {w}x{h}\n")
    f.write(f"Pixels suspeitos encontrados: {len(suspects)}\n")
    f.write(f"Pixels substituídos: {replaced}\n")
    f.write(f"Pixels não resolvidos: {len(unresolved)}\n")
    f.write(f"Pixels suspeitos remanescentes: {len(remaining)}\n\n")

    if suspects:
        f.write("PIXELS SUSPEITOS ORIGINAIS:\n")
        for x, y, rgba in suspects:
            f.write(f"- ({x}, {y}) -> {rgba}\n")
        f.write("\n")

    if unresolved:
        f.write("PIXELS NÃO RESOLVIDOS:\n")
        for x, y, rgba in unresolved:
            f.write(f"- ({x}, {y}) -> {rgba}\n")
        f.write("\n")

    if remaining:
        f.write("PIXELS SUSPEITOS REMANESCENTES APÓS A CORREÇÃO:\n")
        for x, y, rgba in remaining:
            f.write(f"- ({x}, {y}) -> {rgba}\n")
        f.write("\n")

bbox = final.getchannel("A").getbbox()

print(f"Entrada: {SRC}")
print(f"Saída: {DST}")
print(f"Dimensão: {w}x{h}")
print(f"Pixels suspeitos encontrados: {len(suspects)}")
print(f"Pixels substituídos: {replaced}")
print(f"Pixels não resolvidos: {len(unresolved)}")
print(f"Pixels suspeitos remanescentes: {len(remaining)}")
print(f"Bounding box final: {bbox}")
print(f"Relatório: {REPORT}")
