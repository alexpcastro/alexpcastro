#!/usr/bin/env python3
"""Bake a reversible, high-color editorial treatment into portfolio JPEGs.

Uses locally installed OpenCV, NumPy and Pillow. Never overwrites source images.
Run from the repository root: python3 scripts/style_career_artwork.py
"""
import argparse
import json
from pathlib import Path
import cv2
import numpy as np
from PIL import Image, ImageDraw

COOL = np.array([[9, 23, 65], [24, 54, 137], [49, 89, 186], [128, 108, 195], [250, 157, 178]], dtype=float)
WARM = np.array([[16, 20, 61], [64, 46, 129], [178, 43, 137], [250, 63, 86], [255, 146, 46], [255, 236, 91]], dtype=float)

def stylize(path):
    source = cv2.imread(str(path))
    if source is None:
        raise ValueError(f"Cannot read image: {path}")
    height, width = source.shape[:2]
    image = cv2.resize(source, (1280, round(height * 1280 / width)), interpolation=cv2.INTER_AREA)
    # Flatten texture while keeping the silhouettes, faces and central objects.
    image = cv2.edgePreservingFilter(image, flags=1, sigma_s=55, sigma_r=.3)
    image = cv2.pyrMeanShiftFiltering(image, sp=7, sr=16, maxLevel=1)
    rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB).astype(float) / 255
    luminance = rgb @ np.array([.2126, .7152, .0722])
    low, high = np.percentile(luminance, [.5, 99])
    tone = np.clip((luminance - low) / max(high - low, 1e-6), 0, 1) ** .7
    # Soft posterization avoids harsh contour bands and retains modeled depth.
    tone = .75 * tone + .25 * np.round(tone * 10) / 10
    warmth = np.clip((rgb[:, :, 0] - rgb[:, :, 2] + .10) / .4, 0, 1)[..., None]
    def ramp(palette):
        value = tone * (len(palette) - 1)
        index = np.minimum(value.astype(int), len(palette) - 2)
        blend = (value - index)[..., None]
        return palette[index] * (1 - blend) + palette[index + 1] * blend
    mapped = ramp(COOL) * (1 - warmth) + ramp(WARM) * warmth
    return Image.fromarray(np.uint8(np.clip(mapped, 0, 255)))

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source-dir', type=Path, default=Path('.review-input/career-scenes'))
    parser.add_argument('--output-dir', type=Path, default=Path('public/artwork'))
    parser.add_argument('--sheet', type=Path, default=Path('.review-input/color-tests/career-neon-sheet.jpg'))
    args = parser.parse_args()
    manifest = json.loads(Path('scripts/portfolio-career-artwork.json').read_text())
    args.output_dir.mkdir(parents=True, exist_ok=True)
    previews = []
    for asset in manifest['assets']:
        image = stylize(args.source_dir / asset['source_file'])
        for width in (640, 1280):
            variant = image.resize((width, round(image.height * width / image.width)), Image.Resampling.LANCZOS)
            path = args.output_dir / f"{asset['id']}-neon-{width}.jpg"
            variant.save(path, quality=88, optimize=True, progressive=True, subsampling=0)
            print(f"{path}: {path.stat().st_size:,} bytes")
        previews.append((asset['id'], image))
    sheet = Image.new('RGB', (1280, 1152), '#14142a')
    draw = ImageDraw.Draw(sheet)
    for i, (name, image) in enumerate(previews):
        x, y = (i % 2) * 640, (i // 2) * 384
        draw.text((x + 12, y + 6), name.upper(), fill='#fff5d5')
        sheet.paste(image.resize((640, 360), Image.Resampling.LANCZOS), (x, y + 24))
    args.sheet.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(args.sheet, quality=91)

if __name__ == '__main__':
    main()
