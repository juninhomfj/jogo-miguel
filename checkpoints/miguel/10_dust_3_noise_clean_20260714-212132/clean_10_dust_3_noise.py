from pathlib import Path
from PIL import Image

src = Path("incoming/sprites/10_dust_3_limpo.png")
dst = Path("incoming/sprites/10_dust_3_noise_clean.png")

img = Image.open(src).convert("RGBA")
px = img.load()
w, h = img.size

def opaque_neighbors(x, y):
    total = 0
    for ny in range(max(0, y - 1), min(h, y + 2)):
        for nx in range(max(0, x - 1), min(w, x + 2)):
            if nx == x and ny == y:
                continue
            if px[nx, ny][3] > 0:
                total += 1
    return total

remove = []

for y in range(h):
    for x in range(w):
        r, g, b, a = px[x, y]
        if a == 0:
            continue

        avg = (r + g + b) // 3
        spread = max(r, g, b) - min(r, g, b)
        viz = opaque_neighbors(x, y)

        bright = avg >= 200
        light_gray = avg >= 155 and spread <= 30

        if (bright and viz <= 2) or (light_gray and viz <= 1):
            remove.append((x, y))

for x, y in remove:
    px[x, y] = (0, 0, 0, 0)

img.save(dst)

bbox = img.getchannel("A").getbbox()
print("Entrada:", src)
print("Saída:", dst)
print("Pixels removidos:", len(remove))
print("Bounding box final:", bbox)
