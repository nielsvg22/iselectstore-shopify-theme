"""Import the supplied Studio Lef artwork without redrawing or recoloring it.

Usage: python scripts/import-brand-assets.py /directory/with/the/16-uploads
PyMuPDF reads the outlined vector paths from the supplied stylesheet. Only paths
inside each original logo's bounds are exported; no document text is published.
"""
from pathlib import Path
import sys
import shutil
import fitz

source = Path(sys.argv[1])
assets = Path(__file__).resolve().parent.parent / "assets"
page = fitz.open(source / "16-Stijlsheet-iSlectStore.pdf")[0]

def point(p):
    return f"{p.x:.5f} {p.y:.5f}"

def color(c):
    return "#" + "".join(f"{round(v * 255):02x}" for v in c[:3])

def export(name, bounds):
    paths = [d for d in page.get_drawings() if fitz.Rect(bounds).contains(d["rect"])]
    assert paths, name
    rect = fitz.Rect(paths[0]["rect"])
    for d in paths[1:]:
        rect |= d["rect"]
    elements = []
    for d in paths:
        commands = []
        current = None
        for item in d["items"]:
            kind = item[0]
            if kind in ("l", "c"):
                if current != item[1]:
                    commands.append("M" + point(item[1]))
                if kind == "l":
                    commands.append("L" + point(item[2]))
                else:
                    commands.append("C" + " ".join(point(p) for p in item[2:]))
                current = item[-1]
            elif kind == "re":
                r = item[1]
                commands.append(f"M{r.x0} {r.y0}H{r.x1}V{r.y1}H{r.x0}Z")
                current = None
            else:
                raise ValueError(f"Unexpected logo path command: {kind}")
        if d.get("closePath"):
            commands.append("Z")
        fill = color(d["fill"]) if d.get("fill") else "none"
        rule = "evenodd" if d.get("even_odd") else "nonzero"
        elements.append(f'<path fill="{fill}" fill-rule="{rule}" d="{" ".join(commands)}"/>')
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {rect.width:.5f} {rect.height:.5f}">'
           f'<g transform="translate({-rect.x0:.5f} {-rect.y0:.5f})">' + "".join(elements) + "</g></svg>\n")
    (assets / name).write_text(svg)
    print(name, len(paths), "original vector paths")

export("brand-logo-primary.svg", (175, 219, 286, 241))
export("brand-logo-white.svg", (310, 216, 424, 242))
export("brand-mark-coral.svg", (473, 200, 525, 253))
export("brand-mark-navy.svg", (473, 306, 525, 361))
for source_name, target in [
    ("5-Batterijconditie.svg", "battery"),
    ("7-gedetaileerde-fotos.svg", "photos"),
    ("8-Inruil.svg", "trade-in"),
    ("10-Prijs-kwaliteit.svg", "value"),
    ("13-Originele-Apple-Producten.svg", "original"),
    ("14-Garantie.svg", "warranty"),
]:
    shutil.copyfile(source / source_name, assets / f"brand-usp-{target}.svg")
