#!/usr/bin/env python3
"""Build a scoped public Pages preview from the private Aptitud Labs site.

Does NOT change production, expose repository history, or copy internal docs.
All rooted asset/navigation links are rebased to /<repository>/ for project Pages.
"""
from __future__ import annotations

import argparse
import re
import shutil
from pathlib import Path

SITE_DIRS = (
    "assets", "proyectos", "servicios", "planes", "nfc-qr", "cotizar",
    "diseno-web-puno", "diseno-web-juliaca",
    "web-para-restaurantes", "web-para-barberias",
    "herramientas", "resources", "soluciones", "privacidad"
)
SITE_FILES = ("index.html", "favicon.svg", "site.webmanifest", "main.js", "styles.css")
TEXT_EXTENSIONS = {".html", ".css", ".js", ".json", ".webmanifest", ".svg"}
# Anchored first path component, never match absolute external https:// URLs.
SITE_SEGMENTS = tuple(SITE_DIRS) + ("favicon.svg", "site.webmanifest", "main.js", "styles.css")
FIRST_COMPONENT = "|".join(re.escape(s) for s in SITE_SEGMENTS)
ROOTED_LINK = re.compile(
    r"(?<![A-Za-z0-9:/])/(?=(?:" + FIRST_COMPONENT + r")(?:[/'\"?#]|$))"
)
ROOT_HOME_ATTR = re.compile(
    r'(?P<lead>\b(?:href|src|action)\s*=\s*["\'])/(?P<after>[#?]|(?=["\']))',
    re.IGNORECASE
)
CANONICAL = re.compile(
    r'\s*<link\b[^>]*\brel=["\']canonical["\'][^>]*>',
    re.IGNORECASE
)
ROBOTS = re.compile(
    r'<meta\b[^>]*\bname=["\']robots["\'][^>]*>',
    re.IGNORECASE
)


def rebase(text: str, prefix: str) -> str:
    # Replace absolute, first-party URLs, including srcset entries, CSS url(),
    # JavaScript asset paths, and route links. Keep external URLs unchanged.
    text = ROOTED_LINK.sub(prefix + "/", text)
    text = ROOT_HOME_ATTR.sub(
        lambda match: match.group("lead") + prefix + "/" + match.group("after"),
        text,
    )
    return text


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--repo", default="Aptitud-Labs")
    parser.add_argument("--output", default="_site")
    options = parser.parse_args()
    source = Path.cwd()
    output = (source / options.output).resolve()
    if not re.fullmatch(r"[A-Za-z0-9._-]+", options.repo):
        raise SystemExit("Invalid repository path")
    prefix = "/" + options.repo
    if output == source or source not in output.parents:
        raise SystemExit("Output must be a subdirectory of checkout")
    if output.exists():
        shutil.rmtree(output)
    output.mkdir(parents=True)
    for dirname in SITE_DIRS:
        src = source / dirname
        if src.is_dir():
            shutil.copytree(src, output / dirname, ignore=shutil.ignore_patterns(
                ".git", ".github", "node_modules", "__pycache__", "*.map", ".env*"
            ))
    for filename in SITE_FILES:
        src = source / filename
        if src.is_file():
            shutil.copy2(src, output / filename)
    (output / ".nojekyll").write_text("", encoding="utf-8")
    (output / "robots.txt").write_text(
        "User-agent: *\nDisallow: " + prefix + "/\n",
        encoding="utf-8",
    )
    (output / "404.html").write_text(
        '<!doctype html><html lang="es"><meta charset="utf-8">'
        '<meta name="viewport" content="width=device-width,initial-scale=1">'
        '<meta name="robots" content="noindex,nofollow">'
        '<title>Vista previa | Aptitud Labs</title>'
        '<body style="background:#0a1016;color:#9bdaee;font:16px system-ui;'
        'display:grid;place-items:center;min-height:90vh;text-align:center">'
        '<main><h1>Página no disponible</h1><p>'
        '<a style="color:#9bdaee" href="' + prefix + '/">'
        'Volver a la vista previa de Aptitud Labs</a></p></main></body></html>',
        encoding="utf-8",
    )

    count = 0
    for file in output.rglob("*"):
        if not file.is_file() or file.suffix.lower() not in TEXT_EXTENSIONS:
            continue
        try:
            text = file.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            continue
        text = rebase(text, prefix)
        if file.suffix.lower() == ".html":
            text = CANONICAL.sub("", text)
            text = ROBOTS.sub('<meta name="robots" content="noindex,nofollow">', text)
            if "<head>" in text and 'name="robots"' not in text:
                text = text.replace("<head>", '<head><meta name="robots" content="noindex,nofollow">', 1)
            # Ensure relative links resolve correctly from deep URLs.
            if "<head>" in text:
                text = text.replace("<head>", '<head><base href="' + prefix + '/">', 1)
        file.write_text(text, encoding="utf-8")
        count += 1

    assert (output / "index.html").is_file(), "Missing home page"
    assert (output / "proyectos" / "index.html").is_file(), "Missing separate portfolio"
    assert (output / "assets" / "motion-graphics-v5.js").is_file(), "Missing Motion V5 JS"
    assert (output / "assets" / "motion-graphics-v5.css").is_file(), "Missing Motion V5 CSS"
    html = (output / "index.html").read_text(encoding="utf-8")
    assert prefix + "/assets/motion-graphics-v5.css" in html, "CSS was not rebased"
    assert prefix + "/assets/motion-graphics-v5.js" in html, "JS was not rebased"
    assert prefix + "/proyectos/" in html, "Portfolio navigation was not rebased"
    assert "noindex,nofollow" in html, "Public preview must not enter search indexes"
    print(f"GitHub Pages preview generated: {prefix}/, {count} text files rebased")
    print("Motion V5, Home, Portfolio, Services, Plans, NFC and Quote preserved.")
    print("Excluded: repository workflows, history, scripts, reports and Vercel config.")


if __name__ == "__main__":
    main()
