#!/usr/bin/env python3

import json
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[2]

MIGUEL_SOURCE = (
    ROOT
    / "assets"
    / "legacy"
    / "sprites-invalidos-2026-07-13"
    / "miguel_sprites_original.png"
)

ROBO_SOURCE = (
    ROOT
    / "assets"
    / "legacy"
    / "sprites-invalidos-2026-07-13"
    / "robo_sprites_original.png"
)

MIGUEL_OUT = ROOT / "assets" / "reference" / "miguel"
ROBO_OUT = ROOT / "assets" / "reference" / "robo"
AUDIT_OUT = ROOT / "artifacts" / "sprite-audit"

MIGUEL_OUT.mkdir(parents=True, exist_ok=True)
ROBO_OUT.mkdir(parents=True, exist_ok=True)
AUDIT_OUT.mkdir(parents=True, exist_ok=True)

FRAME_NAMES = [
    "00_idle_reference.png",
    "01_walk_1_reference.png",
    "02_walk_2_reference.png",
    "03_walk_3_reference.png",
    "04_jump_reference.png",
    "05_double_jump_reference.png",
    "06_punch_reference.png",
    "07_power_cast_reference.png",
    "08_dust_1_reference.png",
    "09_dust_2_reference.png",
    "10_dust_3_reference.png",
    "11_reserved_reference.png",
]

FRAME_WIDTH = 144
FRAME_HEIGHT = 144
SOURCE_MARGIN_X = 1

TARGET_WIDTH = 256
TARGET_HEIGHT = 256
TARGET_BASELINE_Y = 224

RESAMPLE_NEAREST = getattr(
    Image,
    "Resampling",
    Image,
).NEAREST


def checkerboard(width: int, height: int, block: int = 16) -> Image.Image:
    image = Image.new("RGBA", (width, height), (238, 238, 238, 255))
    draw = ImageDraw.Draw(image)

    for y in range(0, height, block):
        for x in range(0, width, block):
            if ((x // block) + (y // block)) % 2:
                draw.rectangle(
                    (
                        x,
                        y,
                        min(x + block - 1, width - 1),
                        min(y + block - 1, height - 1),
                    ),
                    fill=(190, 190, 190, 255),
                )

    return image


def alpha_bbox(image: Image.Image):
    return image.getchannel("A").getbbox()


def normalize_reference(frame: Image.Image):
    bbox = alpha_bbox(frame)

    target = Image.new(
        "RGBA",
        (TARGET_WIDTH, TARGET_HEIGHT),
        (0, 0, 0, 0),
    )

    if bbox is None:
        return target, None, None

    content = frame.crop(bbox)
    width, height = content.size

    target_x = (TARGET_WIDTH - width) // 2
    target_y = TARGET_BASELINE_Y - height

    if target_y < 8:
        available_height = TARGET_BASELINE_Y - 8
        scale = min(1.0, available_height / height)

        width = max(1, round(width * scale))
        height = max(1, round(height * scale))

        content = content.resize(
            (width, height),
            RESAMPLE_NEAREST,
        )

        target_x = (TARGET_WIDTH - width) // 2
        target_y = TARGET_BASELINE_Y - height

    target.alpha_composite(
        content,
        (target_x, target_y),
    )

    normalized_bbox = alpha_bbox(target)

    return target, bbox, normalized_bbox


def build_contact_sheet(frames):
    preview_size = 128
    columns = 6
    rows = 2
    label_height = 26

    sheet = checkerboard(
        columns * preview_size,
        rows * (preview_size + label_height),
        block=12,
    )

    draw = ImageDraw.Draw(sheet)
    font = ImageFont.load_default()

    for index, frame in enumerate(frames):
        row = index // columns
        column = index % columns

        preview = frame.resize(
            (preview_size, preview_size),
            RESAMPLE_NEAREST,
        )

        x = column * preview_size
        y = row * (preview_size + label_height)

        sheet.alpha_composite(preview, (x, y))

        draw.rectangle(
            (
                x,
                y + preview_size,
                x + preview_size - 1,
                y + preview_size + label_height - 1,
            ),
            fill=(20, 20, 20, 255),
        )

        draw.text(
            (x + 6, y + preview_size + 8),
            f"FRAME {index:02d}",
            fill=(255, 255, 255, 255),
            font=font,
        )

    return sheet


def main():
    miguel = Image.open(MIGUEL_SOURCE).convert("RGBA")

    if miguel.size != (866, 288):
        raise RuntimeError(
            f"Dimensão inesperada do Miguel: {miguel.size}"
        )

    analysis = {
        "source": str(MIGUEL_SOURCE.relative_to(ROOT)),
        "source_size": list(miguel.size),
        "grid_hypothesis": {
            "columns": 6,
            "rows": 2,
            "frame_width": FRAME_WIDTH,
            "frame_height": FRAME_HEIGHT,
            "margin_x": SOURCE_MARGIN_X,
        },
        "warning": (
            "Estas imagens são apenas referências. "
            "Frames com poder e poeira contêm invasões laterais."
        ),
        "frames": [],
    }

    normalized_frames = []

    for index, filename in enumerate(FRAME_NAMES):
        row = index // 6
        column = index % 6

        x1 = SOURCE_MARGIN_X + column * FRAME_WIDTH
        y1 = row * FRAME_HEIGHT
        x2 = x1 + FRAME_WIDTH
        y2 = y1 + FRAME_HEIGHT

        frame = miguel.crop((x1, y1, x2, y2))

        normalized, original_bbox, normalized_bbox = (
            normalize_reference(frame)
        )

        output_path = MIGUEL_OUT / filename
        normalized.save(output_path)

        normalized_frames.append(normalized)

        touches = []

        if original_bbox:
            left, top, right, bottom = original_bbox

            if left == 0:
                touches.append("left")

            if right == FRAME_WIDTH:
                touches.append("right")

            if top == 0:
                touches.append("top")

            if bottom == FRAME_HEIGHT:
                touches.append("bottom")

        analysis["frames"].append(
            {
                "index": index,
                "source_crop": [x1, y1, x2, y2],
                "source_bbox": original_bbox,
                "normalized_bbox": normalized_bbox,
                "touches_source_edges": touches,
                "reference_file": str(
                    output_path.relative_to(ROOT)
                ),
                "reference_only": True,
            }
        )

    contact_sheet = build_contact_sheet(normalized_frames)

    contact_sheet.save(
        MIGUEL_OUT / "miguel_legacy_reference_contact.png"
    )

    robo = Image.open(ROBO_SOURCE).convert("RGBA")

    robo.save(
        ROBO_OUT / "robo_original_design_reference.png"
    )

    analysis_path = (
        AUDIT_OUT
        / "legacy_reference_analysis.json"
    )

    analysis_path.write_text(
        json.dumps(
            analysis,
            indent=2,
            ensure_ascii=False,
        ),
        encoding="utf-8",
    )

    print("Referências do Miguel:")
    for item in analysis["frames"]:
        print(
            f"F{item['index']:02d} | "
            f"bbox={item['source_bbox']} | "
            f"bordas={item['touches_source_edges']} | "
            f"{item['reference_file']}"
        )

    print()
    print(
        "Contato:",
        MIGUEL_OUT / "miguel_legacy_reference_contact.png",
    )

    print(
        "Referência do robô:",
        ROBO_OUT / "robo_original_design_reference.png",
    )

    print(
        "Relatório:",
        analysis_path,
    )


if __name__ == "__main__":
    main()
