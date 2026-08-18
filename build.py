#!/usr/bin/env python3
"""
APIQR static site build.

Each file in _src/pages/ starts with a JSON front-matter block between
--- markers, followed by the page body. The body is dropped into
_src/shell.html, which supplies the head, header, footer and scripts, so
those stay identical everywhere.

Run:  python build.py
"""

import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(ROOT, "_src")
PAGES = os.path.join(SRC, "pages")

NAV_KEYS = {
    "why": "A_WHY",
    "regulation": "A_REG",
    "software": "A_SW",
    "resources": "A_RES",
    "about": "A_ABOUT",
}

ORG = {
    "@type": "Organization",
    "@id": "https://www.apiqr.in/#org",
    "name": "URL Aseptic Automation Inc.",
    "alternateName": "APIQR",
    "url": "https://www.apiqr.in/",
    "logo": {
        "@type": "ImageObject",
        "url": "https://www.apiqr.in/assets/img/logo-512.png",
        "width": 512,
        "height": 512,
    },
    "image": "https://www.apiqr.in/assets/img/logo-512.png",
    "description": (
        "Serialization, track-and-trace and end-of-line automation solutions for the "
        "pharmaceutical industry, with L1 to L5 capability and 12+ years of serialization experience."
    ),
    "address": {
        "@type": "PostalAddress",
        "addressLocality": "Ahmedabad",
        "addressRegion": "Gujarat",
        "addressCountry": "IN",
    },
    "areaServed": "IN",
    "knowsAbout": [
        "API Serialization", "G.S.R. 20(E)", "GS1 Standards",
        "SSCC", "GTIN", "Pharmaceutical Track and Trace",
    ],
}


def breadcrumb(trail):
    """trail: list of (name, slug). Slug '' means the homepage."""
    return {
        "@type": "BreadcrumbList",
        "itemListElement": [
            {
                "@type": "ListItem",
                "position": i + 1,
                "name": name,
                "item": "https://www.apiqr.in/" + slug,
            }
            for i, (name, slug) in enumerate(trail)
        ],
    }


def split_front_matter(raw, path):
    m = re.match(r"^---\s*\n(.*?)\n---\s*\n(.*)$", raw, re.S)
    if not m:
        sys.exit("Missing front matter in " + path)
    try:
        meta = json.loads(m.group(1))
    except json.JSONDecodeError as e:
        sys.exit("Bad JSON front matter in %s: %s" % (path, e))
    return meta, m.group(2)


def build():
    shell = open(os.path.join(SRC, "shell.html"), encoding="utf-8").read()
    written = []

    for name in sorted(os.listdir(PAGES)):
        if not name.endswith(".html"):
            continue
        path = os.path.join(PAGES, name)
        meta, body = split_front_matter(open(path, encoding="utf-8").read(), path)

        slug = "" if name == "index.html" else name

        graph = [ORG]
        if meta.get("crumbs"):
            graph.append(breadcrumb([tuple(c) for c in meta["crumbs"]]))
        graph.extend(meta.get("schema", []))

        page = shell
        page = page.replace("{{TITLE}}", meta["title"])
        page = page.replace("{{OGTITLE}}", meta.get("ogtitle", meta["title"]))
        page = page.replace("{{DESC}}", meta["desc"])
        page = page.replace("{{SLUG}}", slug)
        page = page.replace("{{HEAD}}", meta.get("head", ""))
        page = page.replace("{{ROBOTS}}", meta.get(
            "robots", "index, follow, max-image-preview:large, max-snippet:-1"))
        page = page.replace("{{SCHEMA}}", json.dumps(
            {"@context": "https://schema.org", "@graph": graph},
            indent=2, ensure_ascii=False))

        active = meta.get("nav")
        for key, token in NAV_KEYS.items():
            page = page.replace("{{%s}}" % token,
                                ' aria-current="page"' if key == active else "")

        page = page.replace("{{BODY}}", body.rstrip() + "\n")

        left = re.findall(r"\{\{[A-Z_]+\}\}", page)
        if left:
            sys.exit("Unreplaced tokens in %s: %s" % (name, set(left)))

        out = os.path.join(ROOT, name)
        open(out, "w", encoding="utf-8").write(page)
        written.append(name)

    print("Built %d pages:" % len(written))
    for n in written:
        print("  ", n)


if __name__ == "__main__":
    build()
