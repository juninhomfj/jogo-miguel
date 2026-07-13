#!/usr/bin/env python3

import argparse
import json
import sys
from pathlib import Path

from PIL import Image, ImageDraw


EXPECTED_SIZE = (256, 256)
SAFE_MARGIN = 8
BASELINE_Y = 224
BASELINE_TOLERANCE = 10


def parse_args():
    parser = argparse.ArgumentParser(
        description="Valida um frame individual do jogo."
    )

    parser.add_argument(
        "image",
        type=Path,
        help="Arquivo PNG que será validado.",
    )

    parser.add_argument(
        "--kind",
        required=True,
        choices=("character", "robot", "effect", "empty"),
        help="Tipo de conteúdo esperado.",
    )

    parser.add_argument(
        "--report-dir",
        type=Path,
        default=Path("artifacts/frame-validation"),
        help="Diretório dos relatórios.",
    )

    return parser.parse_args()


def count_visible_pixels(image):
    alpha = image.getchannel("A")
    histogram = alpha.histogram()

    transparent = histogram[0]
    opaque = histogram[255]
    semitransparent = sum(histogram[1:255])

    return {
        "transparent": transparent,
        "opaque": opaque,
        "semitransparent": semitransparent,
        "visible": opaque + semitransparent,
        "total": image.width * image.height,
    }


def safe_margin_violations(image):
    alpha = image.getchannel("A")
    width, height = image.size

    areas = {
        "left": alpha.crop(
            (0, 0, SAFE_MARGIN, height)
        ),
        "right": alpha.crop(
            (width - SAFE_MARGIN, 0, width, height)
        ),
        "top": alpha.crop(
            (0, 0, width, SAFE_MARGIN)
        ),
        "bottom": alpha.crop(
            (0, height - SAFE_MARGIN, width, height)
        ),
    }

    result = {}

    for name, area in areas.items():
        result[name] = sum(
            1 for value in area.tobytes() if value > 0
        )

    return result


def create_checkerboard(width, height, block=16):
    canvas = Image.new(
        "RGBA",
        (width, height),
        (235, 235, 235, 255),
    )

    draw = ImageDraw.Draw(canvas)

    for y in range(0, height, block):
        for x in range(0, width, block):
            is_dark = (
                ((x // block) + (y // block)) % 2
            )

            color = (
                (195, 195, 195, 255)
                if is_dark
                else (235, 235, 235, 255)
            )

            draw.rectangle(
                (
                    x,
                    y,
                    min(width - 1, x + block - 1),
                    min(height - 1, y + block - 1),
                ),
                fill=color,
            )

    return canvas


def create_preview(image, bbox, output_path):
    scale = 3

    preview = create_checkerboard(
        image.width * scale,
        image.height * scale,
    )

    enlarged = image.resize(
        (
            image.width * scale,
            image.height * scale,
        ),
        Image.Resampling.NEAREST,
    )

    preview.alpha_composite(enlarged)

    draw = ImageDraw.Draw(preview)

    safe = SAFE_MARGIN * scale

    draw.rectangle(
        (
            safe,
            safe,
            preview.width - safe - 1,
            preview.height - safe - 1,
        ),
        outline=(255, 170, 0, 255),
        width=2,
    )

    baseline = BASELINE_Y * scale

    draw.line(
        (
            0,
            baseline,
            preview.width,
            baseline,
        ),
        fill=(0, 160, 255, 255),
        width=2,
    )

    if bbox:
        left, top, right, bottom = bbox

        draw.rectangle(
            (
                left * scale,
                top * scale,
                right * scale - 1,
                bottom * scale - 1,
            ),
            outline=(255, 0, 0, 255),
            width=2,
        )

    output_path.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    preview.save(output_path)


def main():
    args = parse_args()

    errors = []
    warnings = []

    if not args.image.exists():
        print(
            f"ERRO: arquivo não encontrado: {args.image}"
        )
        return 2

    try:
        original = Image.open(args.image)
        original.load()
    except Exception as error:
        print(
            f"ERRO: não foi possível abrir a imagem: {error}"
        )
        return 2

    original_format = original.format
    original_mode = original.mode
    original_size = original.size

    if original_format != "PNG":
        errors.append(
            f"Formato inválido: {original_format}. Esperado: PNG."
        )

    if original_size != EXPECTED_SIZE:
        errors.append(
            f"Dimensão inválida: "
            f"{original_size[0]}x{original_size[1]}. "
            "Esperado: 256x256."
        )

    if original_mode != "RGBA":
        errors.append(
            f"Modo inválido: {original_mode}. Esperado: RGBA."
        )

    image = original.convert("RGBA")
    alpha = image.getchannel("A")

    bbox = alpha.getbbox()
    pixels = count_visible_pixels(image)
    margins = safe_margin_violations(image)

    if args.kind == "empty":
        if bbox is not None:
            errors.append(
                "O frame deveria ser totalmente transparente."
            )
    elif bbox is None:
        errors.append(
            "O frame não possui pixels visíveis."
        )

    violated_margins = {
        name: count
        for name, count in margins.items()
        if count > 0
    }

    if violated_margins:
        errors.append(
            "Existem pixels visíveis dentro da margem "
            "externa de segurança: "
            + ", ".join(
                f"{name}={count}"
                for name, count in violated_margins.items()
            )
        )

    visible = pixels["visible"]
    semitransparent = pixels["semitransparent"]

    semitransparent_ratio = (
        semitransparent / visible
        if visible
        else 0
    )

    if semitransparent_ratio > 0.08:
        warnings.append(
            f"{semitransparent_ratio:.1%} dos pixels "
            "visíveis são semitransparentes. "
            "Pode haver suavização ou antialiasing."
        )

    baseline_difference = None

    if (
        args.kind in ("character", "robot")
        and bbox is not None
    ):
        bottom = bbox[3]
        baseline_difference = bottom - BASELINE_Y

        if abs(baseline_difference) > BASELINE_TOLERANCE:
            warnings.append(
                f"A base do conteúdo está em y={bottom}; "
                f"o alvo é aproximadamente y={BASELINE_Y}."
            )

    if bbox:
        left, top, right, bottom = bbox

        content_width = right - left
        content_height = bottom - top

        if content_width < 40 or content_height < 40:
            warnings.append(
                f"Conteúdo possivelmente pequeno: "
                f"{content_width}x{content_height}px."
            )

        if content_width > 232 or content_height > 232:
            warnings.append(
                f"Conteúdo próximo demais dos limites: "
                f"{content_width}x{content_height}px."
            )

    args.report_dir.mkdir(
        parents=True,
        exist_ok=True,
    )

    safe_name = args.image.stem.replace(" ", "_")

    report_path = (
        args.report_dir / f"{safe_name}.json"
    )

    preview_path = (
        args.report_dir / f"{safe_name}_preview.png"
    )

    report = {
        "file": str(args.image),
        "kind": args.kind,
        "format": original_format,
        "mode": original_mode,
        "size": list(original_size),
        "expected_size": list(EXPECTED_SIZE),
        "safe_margin": SAFE_MARGIN,
        "bbox": list(bbox) if bbox else None,
        "pixels": pixels,
        "semitransparent_ratio": semitransparent_ratio,
        "safe_margin_violations": margins,
        "baseline_target": (
            BASELINE_Y
            if args.kind in ("character", "robot")
            else None
        ),
        "baseline_difference": baseline_difference,
        "errors": errors,
        "warnings": warnings,
        "approved_technically": not errors,
    }

    report_path.write_text(
        json.dumps(
            report,
            indent=2,
            ensure_ascii=False,
        ),
        encoding="utf-8",
    )

    create_preview(
        image,
        bbox,
        preview_path,
    )

    print()
    print("=" * 72)
    print("VALIDAÇÃO DE FRAME")
    print("=" * 72)
    print(f"Arquivo: {args.image}")
    print(f"Tipo: {args.kind}")
    print(f"Formato: {original_format}")
    print(f"Modo: {original_mode}")
    print(
        f"Dimensão: "
        f"{original_size[0]}x{original_size[1]}"
    )
    print(f"Bounding box: {bbox}")
    print(f"Pixels visíveis: {visible}")
    print(
        "Pixels semitransparentes: "
        f"{semitransparent} "
        f"({semitransparent_ratio:.2%})"
    )
    print(
        "Margens violadas: "
        f"{violated_margins or 'nenhuma'}"
    )

    if baseline_difference is not None:
        print(
            "Diferença para a linha-base: "
            f"{baseline_difference:+d}px"
        )

    if warnings:
        print()
        print("AVISOS:")

        for warning in warnings:
            print(f"- {warning}")

    if errors:
        print()
        print("ERROS:")

        for error in errors:
            print(f"- {error}")

    print()
    print(f"Relatório: {report_path}")
    print(f"Prévia: {preview_path}")

    if errors:
        print()
        print("RESULTADO: REPROVADO")
        return 1

    print()
    print("RESULTADO: APROVADO TECNICAMENTE")
    print(
        "Ainda é necessária aprovação visual."
    )

    return 0


if __name__ == "__main__":
    sys.exit(main())
