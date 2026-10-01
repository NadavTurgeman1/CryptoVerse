#!/usr/bin/env python3
"""Draw the CryptoVerse icon, splash, and home-screen image."""

import random
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
PUBLIC = ROOT / "public"


def glow(base, cx, cy, radius, color, blur):
    layer = Image.new("RGBA", base.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    draw.ellipse((cx - radius, cy - radius, cx + radius, cy + radius), fill=color)
    base.alpha_composite(layer.filter(ImageFilter.GaussianBlur(blur)))


def stars(base, count, seed):
    rng = random.Random(seed)
    draw = ImageDraw.Draw(base)
    width, height = base.size
    for _ in range(count):
        x = rng.randrange(width)
        y = rng.randrange(height)
        radius = 1 if rng.random() < 0.82 else 2
        alpha = rng.randint(70, 170)
        draw.ellipse((x, y, x + radius, y + radius), fill=(220, 230, 255, alpha))


def mark(base, cx, cy, scale):
    draw_scale = max(scale, 0.2)
    for dx, dy, radius, alpha in (
        (-210, 150, 18, 50),
        (-158, 108, 28, 80),
        (-104, 66, 42, 120),
        (-54, 30, 58, 160),
    ):
        glow(
            base,
            cx + dx * draw_scale,
            cy + dy * draw_scale,
            radius * draw_scale,
            (255, 150, 40, alpha),
            max(1, int(7 * draw_scale)),
        )

    echo_x = cx + 78 * draw_scale
    echo_y = cy - 86 * draw_scale
    echo_r = 168 * draw_scale
    glow(base, echo_x, echo_y, echo_r + 30 * draw_scale, (61, 139, 255, 100), max(1, int(18 * draw_scale)))
    draw = ImageDraw.Draw(base)
    draw.ellipse(
        (echo_x - echo_r, echo_y - echo_r, echo_x + echo_r, echo_y + echo_r),
        fill=(61, 139, 255, 220),
    )
    draw.ellipse(
        (echo_x - echo_r * 0.72, echo_y - echo_r * 0.78, echo_x + echo_r * 0.42, echo_y + echo_r * 0.05),
        fill=(186, 214, 255, 80),
    )

    fire_x = cx - 50 * draw_scale
    fire_y = cy + 40 * draw_scale
    fire_r = 132 * draw_scale
    glow(base, fire_x, fire_y, fire_r + 40 * draw_scale, (255, 120, 20, 130), max(1, int(16 * draw_scale)))
    draw = ImageDraw.Draw(base)
    draw.ellipse((fire_x - fire_r, fire_y - fire_r, fire_x + fire_r, fire_y + fire_r), fill=(255, 122, 24, 255))
    draw.ellipse(
        (fire_x - fire_r * 0.62, fire_y - fire_r * 0.66, fire_x + fire_r * 0.12, fire_y + fire_r * 0.12),
        fill=(255, 196, 70, 255),
    )
    draw.ellipse(
        (fire_x - fire_r * 0.28, fire_y - fire_r * 0.32, fire_x + fire_r * 0.02, fire_y),
        fill=(255, 246, 214, 255),
    )

    eye = 14 * draw_scale
    pupil = 6 * draw_scale
    for dx, dy in ((18, 36), (62, 8)):
        eye_x = echo_x + dx * draw_scale
        eye_y = echo_y + dy * draw_scale
        draw.ellipse((eye_x - eye, eye_y - eye, eye_x + eye, eye_y + eye), fill=(255, 255, 255, 245))
        draw.ellipse(
            (eye_x - pupil + 2 * draw_scale, eye_y - pupil, eye_x + pupil + 2 * draw_scale, eye_y + pupil),
            fill=(12, 28, 70, 230),
        )


def canvas(size, color=(5, 6, 12, 255)):
    image = Image.new("RGBA", (size, size), color)
    stars(image, max(40, size // 14), seed=size)
    return image


def main():
    ASSETS.mkdir(parents=True, exist_ok=True)
    icon = canvas(1024)
    mark(icon, 512, 530, 1.65)
    rgb = icon.convert("RGB")
    rgb.save(ASSETS / "icon-only.png", "PNG")
    Image.new("RGB", (1024, 1024), (5, 6, 12)).save(ASSETS / "icon-background.png", "PNG")

    foreground = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
    mark(foreground, 512, 530, 1.2)
    foreground.save(ASSETS / "icon-foreground.png", "PNG")

    splash = canvas(2732)
    mark(splash, 1366, 1366, 4.2)
    splash_rgb = splash.convert("RGB")
    splash_rgb.save(ASSETS / "splash.png", "PNG")
    splash_rgb.save(ASSETS / "splash-dark.png", "PNG")

    icon.resize((180, 180), Image.Resampling.LANCZOS).convert("RGB").save(PUBLIC / "apple-touch-icon.png", "PNG")


if __name__ == "__main__":
    main()
