"""Self-host official Google Fonts Poppins Latin/Latin Extended subsets."""
from pathlib import Path
import re
import urllib.request

assets = Path(__file__).resolve().parent.parent / "assets"
url = "https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap"
request = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36"})
css = urllib.request.urlopen(request, timeout=30).read().decode()
faces = []
for subset, block in re.findall(r"/\* ([^*]+) \*/\s*(@font-face\s*\{[^}]+\})", css):
    if subset not in ("latin", "latin-ext"):
        continue
    weight = re.search(r"font-weight:\s*(\d+)", block)[1]
    remote = re.search(r"url\(([^)]+)\)", block)[1]
    name = f"brand-poppins-{weight}-{subset}.woff2"
    data = urllib.request.urlopen(remote, timeout=30).read()
    assert data[:4] == b"wOF2", name
    (assets / name).write_bytes(data)
    faces.append(f"/* {subset} */\n" + block.replace(remote, "./" + name))
assert len(faces) == 10
(assets / "brand-fonts.css").write_text("/* Poppins, SIL Open Font License. See brand-poppins-license.txt. */\n" + "\n".join(faces) + "\n")
license_url = "https://raw.githubusercontent.com/google/fonts/main/ofl/poppins/OFL.txt"
(assets / "brand-poppins-license.txt").write_bytes(urllib.request.urlopen(license_url, timeout=30).read())
print("Imported 10 official Poppins webfont subsets and their OFL license.")
