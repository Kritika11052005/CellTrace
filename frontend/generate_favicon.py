from PIL import Image, ImageDraw

def create_celltrace_favicon(size=512):
    # Create high-res image RGBA
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Base background: rounded rectangle in #deff00 (Cyber Lime)
    margin = int(size * 0.05)
    corner_radius = int(size * 0.22)
    bg_box = [margin, margin, size - margin, size - margin]
    draw.rounded_rectangle(bg_box, radius=corner_radius, fill="#deff00")

    # Dark foreground color for battery icon
    fg_color = "#070709"

    # Scale math relative to size
    # 1. Top Terminal Nub
    nub_w = int(size * 0.24)
    nub_h = int(size * 0.07)
    nub_left = (size - nub_w) // 2
    nub_top = int(size * 0.16)
    draw.rounded_rectangle([nub_left, nub_top, nub_left + nub_w, nub_top + nub_h], radius=int(nub_h * 0.4), fill=fg_color)

    # 2. Battery Outer Casing Box
    case_margin_x = int(size * 0.22)
    case_top = int(size * 0.24)
    case_bottom = int(size * 0.82)
    case_box = [case_margin_x, case_top, size - case_margin_x, case_bottom]
    stroke_w = int(size * 0.055)
    draw.rounded_rectangle(case_box, radius=int(size * 0.08), outline=fg_color, width=stroke_w)

    # 3. Telemetry ECG Pulse Waveform Line
    # Path coordinates scaled to container
    # From left to right: (28%, 53%) -> (38%, 53%) -> (44%, 39%) -> (52%, 67%) -> (59%, 53%) -> (72%, 53%)
    points = [
        (int(size * 0.28), int(size * 0.53)),
        (int(size * 0.38), int(size * 0.53)),
        (int(size * 0.44), int(size * 0.38)),
        (int(size * 0.52), int(size * 0.67)),
        (int(size * 0.59), int(size * 0.53)),
        (int(size * 0.72), int(size * 0.53)),
    ]
    
    pulse_stroke = int(size * 0.055)
    for i in range(len(points) - 1):
        draw.line([points[i], points[i+1]], fill=fg_color, width=pulse_stroke, joint="round")

    return img

if __name__ == "__main__":
    img512 = create_celltrace_favicon(512)
    
    # Save PNG formats for Next.js App Router
    img512.save("src/app/icon.png", "PNG")
    img512.save("src/app/apple-icon.png", "PNG")
    img512.save("public/icon.png", "PNG")

    # Save ICO format (with 16x16, 32x32, 48x48, 64x64)
    img16 = img512.resize((16, 16), Image.Resampling.LANCZOS)
    img32 = img512.resize((32, 32), Image.Resampling.LANCZOS)
    img48 = img512.resize((48, 48), Image.Resampling.LANCZOS)
    img64 = img512.resize((64, 64), Image.Resampling.LANCZOS)
    
    img32.save(
        "src/app/favicon.ico",
        format="ICO",
        sizes=[(16, 16), (32, 32), (48, 48), (64, 64)],
        append_images=[img16, img48, img64]
    )
    img32.save(
        "public/favicon.ico",
        format="ICO",
        sizes=[(16, 16), (32, 32), (48, 48), (64, 64)],
        append_images=[img16, img48, img64]
    )
    print("Favicon files generated successfully!")
