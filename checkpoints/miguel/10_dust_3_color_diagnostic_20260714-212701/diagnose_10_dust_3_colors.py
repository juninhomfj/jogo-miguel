from collections import Counter
from pathlib import Path

from PIL import Image

bruto_path = Path(
    "incoming/sprites/10_dust_3_branco.png"
)
limpo_path = Path(
    "incoming/sprites/10_dust_3_noise_clean.png"
)

referencias = [
    Path("assets/frames/miguel/00_idle.png"),
    Path("assets/frames/miguel/08_dust_1.png"),
    Path("assets/frames/miguel/09_dust_2.png"),
    Path("assets/reference/miguel/10_dust_3_reference.png"),
]

pasta = Path(
    "artifacts/frame-validation/"
    "10_dust_3_color_diagnostic"
)

relatorio_path = pasta / "relatorio_cores.txt"
preview_path = pasta / "suspeitos_destacados.png"
mascara_path = pasta / "mascara_suspeitos.png"

for path in [bruto_path, limpo_path, *referencias]:
    if not path.exists():
        raise SystemExit(
            f"ERRO: arquivo não encontrado: {path}"
        )

bruto = Image.open(bruto_path).convert("RGB")
limpo = Image.open(limpo_path).convert("RGBA")

if bruto.size != limpo.size:
    raise SystemExit(
        "ERRO: bruto e limpo têm dimensões diferentes."
    )

paleta_aprovada = set()

for path in referencias:
    imagem = Image.open(path).convert("RGBA")

    for r, g, b, a in imagem.getdata():
        if a > 0:
            paleta_aprovada.add((r, g, b))

largura, altura = bruto.size
faixa = max(40, min(largura, altura) // 12)

cores_borda = Counter()

for y in range(altura):
    for x in range(largura):
        if (
            x < faixa
            or y < faixa
            or x >= largura - faixa
            or y >= altura - faixa
        ):
            cores_borda[bruto.getpixel((x, y))] += 1

cores_borda_principais = {
    cor
    for cor, _ in cores_borda.most_common(40)
}

cores_visiveis = Counter(
    (r, g, b)
    for r, g, b, a in limpo.getdata()
    if a > 0
)

cores_suspeitas = set()

for cor in cores_visiveis:
    r, g, b = cor
    media = (r + g + b) / 3
    variacao = max(cor) - min(cor)

    neutra = variacao <= 24
    clara_ou_escura = media >= 155 or media <= 100
    encontrada_na_borda = cor in cores_borda_principais
    desconhecida = cor not in paleta_aprovada

    if desconhecida and (
        encontrada_na_borda
        or (neutra and clara_ou_escura)
    ):
        cores_suspeitas.add(cor)

preview = Image.new(
    "RGBA",
    limpo.size,
    (20, 20, 20, 255),
)
preview.alpha_composite(limpo)

mascara = Image.new(
    "RGBA",
    limpo.size,
    (0, 0, 0, 0),
)

preview_pixels = preview.load()
mascara_pixels = mascara.load()
limpo_pixels = limpo.load()

pixels_suspeitos = 0

for y in range(altura):
    for x in range(largura):
        r, g, b, a = limpo_pixels[x, y]

        if a == 0:
            continue

        if (r, g, b) in cores_suspeitas:
            preview_pixels[x, y] = (
                255, 0, 255, 255
            )
            mascara_pixels[x, y] = (
                255, 255, 255, 255
            )
            pixels_suspeitos += 1

preview.save(preview_path)
mascara.save(mascara_path)

contagem_suspeita = Counter({
    cor: cores_visiveis[cor]
    for cor in cores_suspeitas
})

linhas = [
    f"Imagem bruta: {bruto_path}",
    f"Imagem analisada: {limpo_path}",
    f"Dimensão: {largura}x{altura}",
    f"Faixa externa analisada: {faixa}px",
    f"Cores na paleta aprovada: {len(paleta_aprovada)}",
    f"Cores suspeitas: {len(cores_suspeitas)}",
    f"Pixels suspeitos: {pixels_suspeitos}",
    f"Bounding box suspeita: "
    f"{mascara.getchannel('A').getbbox()}",
    "",
    "CORES MAIS COMUNS NA BORDA:",
]

for cor, quantidade in cores_borda.most_common(20):
    linhas.append(
        f"{cor} | borda={quantidade} | "
        f"visível={cores_visiveis.get(cor, 0)}"
    )

linhas.extend([
    "",
    "CORES SUSPEITAS MAIS FREQUENTES:",
])

for cor, quantidade in contagem_suspeita.most_common(40):
    linhas.append(
        f"{cor} | pixels={quantidade}"
    )

relatorio_path.write_text(
    "\n".join(linhas) + "\n",
    encoding="utf-8",
)

print("\n".join(linhas))
print()
print("Relatório:", relatorio_path)
print("Prévia:", preview_path)
print("Máscara:", mascara_path)
