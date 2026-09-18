from pathlib import Path
import re
import requests
import hashlib
import mimetypes
import base64
import shutil
import zipfile
import time
from urllib.parse import urlparse, unquote

root = Path(".")
index = root / "index.html"
s = index.read_text(encoding="utf-8")

# Use the recreated full Japan map with city names only.
s = s.replace("assets/japan-worldatlas.jpg", "assets/maps/japan-major-cities.svg")
s = s.replace(
    "<b>Map used exactly as supplied.</b> No extra text, dots, city markers or overlays have been added. Source shown on the map: WorldAtlas.com.",
    "<b>Recreated map:</b> full Japan map with only the six major historical city names used by the city slider. No dots, terrain labels, sea labels, legend or other annotations."
)
s = s.replace(
    "Use the <b>city slider</b> to explore historical significance. Nothing is added on top of the map.",
    "Use the <b>city slider</b> to explore historical significance. The recreated map itself contains only the major city names."
)

# Consolidate existing locally stored era images.
era_dir = root / "assets/eras"
target_era = root / "assets/images/eras"
if era_dir.exists():
    target_era.mkdir(parents=True, exist_ok=True)
    for f in era_dir.iterdir():
        if f.is_file():
            dest = target_era / f.name
            shutil.copy2(f, dest)
            s = s.replace("assets/eras/" + f.name, "assets/images/eras/" + f.name)

# Download every remaining remote image used by the page.
session = requests.Session()
session.headers.update({"User-Agent": "Mozilla/5.0 Japan-history-classroom/1.0"})
remote_urls = []
for m in re.finditer(r'<img\b[^>]*\bsrc="(https?://[^"]+)"', s, re.I):
    if m.group(1) not in remote_urls:
        remote_urls.append(m.group(1))

image_dir = root / "assets/images/content"
image_dir.mkdir(parents=True, exist_ok=True)
source_lines = [
    "# Image sources",
    "",
    "These images are stored locally in the project. The original public source URL is recorded beside each asset.",
    "",
]
for i, url in enumerate(remote_urls, 1):
    resp = None
    for attempt in range(7):
        resp = session.get(url, timeout=60, allow_redirects=True)
        if resp.status_code == 200:
            break
        if resp.status_code in (429, 403, 502, 503, 504):
            time.sleep(5 + attempt * 6)
            continue
        resp.raise_for_status()
    if resp is None or resp.status_code != 200:
        raise RuntimeError("Could not download image after retries: " + url)
    time.sleep(1.5)
    ctype = (resp.headers.get("content-type") or "").split(";")[0].strip()
    ext = mimetypes.guess_extension(ctype) or Path(urlparse(resp.url).path).suffix or ".jpg"
    if ext == ".jpe":
        ext = ".jpg"
    name = Path(unquote(urlparse(resp.url).path)).name
    base_name = re.sub(r"[^A-Za-z0-9._-]+", "-", name).strip("-") or ("image-" + str(i))
    if not Path(base_name).suffix:
        base_name += ext
    digest = hashlib.sha1(url.encode()).hexdigest()[:8]
    stem = Path(base_name).stem[:70]
    filename = stem + "-" + digest + Path(base_name).suffix.lower()
    dest = image_dir / filename
    dest.write_bytes(resp.content)
    local = "assets/images/content/" + filename
    s = s.replace(url, local)
    source_lines.append("- " + local + " — " + url)

(root / "assets/SOURCES.md").write_text("\n".join(source_lines) + "\n", encoding="utf-8")

# Split inline CSS and JS into clean GitHub-ready files.
had_external_css = "assets/css/site.css" in s
had_external_js = "assets/js/site.js" in s

css_parts = re.findall(r"<style(?:\s[^>]*)?>([\s\S]*?)</style>", s, re.I)
s = re.sub(r"<style(?:\s[^>]*)?>[\s\S]*?</style>\s*", "", s, flags=re.I)

js_parts = []
def pull_script(m):
    attrs = m.group(1) or ""
    body = m.group(2)
    if re.search(r"\bsrc\s*=", attrs, re.I):
        return m.group(0)
    js_parts.append(body)
    return ""

s = re.sub(r"<script([^>]*)>([\s\S]*?)</script>\s*", pull_script, s, flags=re.I)

(root / "assets/css").mkdir(parents=True, exist_ok=True)
(root / "assets/js").mkdir(parents=True, exist_ok=True)
css_path = root / "assets/css/site.css"
js_path = root / "assets/js/site.js"

existing_css = css_path.read_text(encoding="utf-8") if css_path.exists() else ""
inline_css = "\n\n".join(css_parts).strip()
if had_external_css and existing_css:
    css = existing_css.rstrip() + (("\n\n" + inline_css) if inline_css else "") + "\n"
elif inline_css:
    css = inline_css + "\n"
else:
    css = existing_css
if css:
    css_path.write_text(css, encoding="utf-8")

existing_js = js_path.read_text(encoding="utf-8") if js_path.exists() else ""
inline_js = "\n\n".join(js_parts).strip()
if had_external_js and existing_js:
    js = existing_js.rstrip() + (("\n\n" + inline_js) if inline_js else "") + "\n"
elif inline_js:
    js = inline_js + "\n"
else:
    js = existing_js
if js:
    js_path.write_text(js, encoding="utf-8")

if "assets/css/site.css" not in s:
    s = s.replace("</head>", '<link rel="stylesheet" href="assets/css/site.css">\n</head>', 1)
if "assets/js/site.js" not in s:
    s = s.replace("</body>", '<script src="assets/js/site.js" defer></script>\n</body>', 1)

index.write_text(s, encoding="utf-8")

readme = """# Japan Under the Shoguns

Interactive Year 8 history experience.

## Clean project structure

index.html
assets/css/site.css
assets/js/site.js
assets/maps/japan-major-cities.svg
assets/images/content/
assets/images/eras/
assets/SOURCES.md
dist/Japan_Under_the_Shoguns_OFFLINE.html
dist/Japan_GitHub_Ready.zip

The repository root is ready for GitHub Pages.
"""
(root / "README.md").write_text(readme, encoding="utf-8")

# Build a single-file fully offline version.
offline = s
css_text = (root / "assets/css/site.css").read_text(encoding="utf-8")
js_text = (root / "assets/js/site.js").read_text(encoding="utf-8")
offline = offline.replace(
    '<link rel="stylesheet" href="assets/css/site.css">',
    "<style>\n" + css_text + "\n</style>"
)
offline = offline.replace(
    '<script src="assets/js/site.js" defer></script>',
    "<script>\n" + js_text + "\n</script>"
)

refs = sorted(set(re.findall(r'(?:src|href)="(assets/[^"]+\.(?:jpg|jpeg|png|gif|webp|svg))"', offline, re.I)))
for ref in refs:
    fp = root / ref
    if not fp.exists():
        continue
    ext = fp.suffix.lower()
    mime = {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".gif": "image/gif",
        ".webp": "image/webp",
        ".svg": "image/svg+xml",
    }[ext]
    data = base64.b64encode(fp.read_bytes()).decode("ascii")
    offline = offline.replace(ref, "data:" + mime + ";base64," + data)

(root / "dist").mkdir(parents=True, exist_ok=True)
offline_path = root / "dist/Japan_Under_the_Shoguns_OFFLINE.html"
offline_path.write_text(offline, encoding="utf-8")

# Package a clean GitHub-ready project.
clean_files = [
    "index.html",
    "README.md",
    ".nojekyll",
    "assets/css/site.css",
    "assets/js/site.js",
    "assets/maps/japan-major-cities.svg",
    "assets/SOURCES.md",
]
with zipfile.ZipFile(root / "dist/Japan_GitHub_Ready.zip", "w", zipfile.ZIP_DEFLATED) as z:
    for rel in clean_files:
        fp = root / rel
        if fp.exists():
            z.write(fp, rel)
    for folder in [root / "assets/images/content", root / "assets/images/eras"]:
        if folder.exists():
            for fp in folder.rglob("*"):
                if fp.is_file():
                    z.write(fp, fp.as_posix())

with zipfile.ZipFile(root / "dist/Japan_Offline.zip", "w", zipfile.ZIP_DEFLATED) as z:
    z.write(offline_path, "Japan_Under_the_Shoguns_OFFLINE.html")

# Remove old assets replaced by the clean structure.
for old in [root / "assets/japan-worldatlas.jpg", root / "assets/japan_line_map.png"]:
    if old.exists():
        old.unlink()
if era_dir.exists():
    shutil.rmtree(era_dir)
# rebuild trigger after stylesheet restore

# final package rebuild

# rebuild packages after era dark styling
