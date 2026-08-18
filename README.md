# APIQR — apiqr.in

Marketing site for **APIQR**, the cloud API/bulk-drug serialization platform by
URL Aseptic Automation. Static HTML, no framework, no build dependencies beyond
Python 3.

---

## ⚠️ Do not edit the HTML files in the repo root

Every `.html` file at the root is **generated**. Editing one directly means your
change is silently thrown away the next time anyone runs the build.

```
_src/shell.html      the <head>, header, footer and scripts — shared by every page
_src/pages/*.html    one file per page: JSON front matter, then the page body
build.py             renders _src/pages/* into the root *.html files
```

Edit the source, then rebuild:

```bash
python build.py
```

It prints the pages it wrote, and exits with an error if a page leaves an
unreplaced `{{TOKEN}}` — so a broken template fails loudly instead of shipping.

### Front matter

Each file in `_src/pages/` opens with a JSON block between `---` markers:

| Key | Purpose |
| --- | --- |
| `title` | `<title>` tag |
| `ogtitle` | Open Graph / Twitter title (falls back to `title`) |
| `desc` | Meta description, OG and Twitter description |
| `nav` | Which nav item gets `aria-current="page"` |
| `robots` | Overrides the default `index, follow` |
| `crumbs` | Breadcrumb trail, rendered into JSON-LD |
| `schema` | Extra JSON-LD nodes merged into the `@graph` |
| `head` | Raw markup injected into `<head>` — used for the homepage LCP preload |

The `Organization` schema node is shared and lives in `build.py`.

---

## Local preview

The site is entirely static, but `file://` will not resolve the absolute paths
correctly, so serve it:

```bash
python -m http.server 8000
# then open http://localhost:8000/
```

---

## Deployment

Published with **GitHub Pages** from the `main` branch, root folder. Any push to
`main` republishes within a minute or two.

`.nojekyll` is present so Pages serves the files verbatim rather than running
them through Jekyll.

### Note on `.htaccess`

`.htaccess` is Apache configuration for the eventual **apiqr.in** hosting. GitHub
Pages ignores it completely. It handles:

- forcing HTTPS and the `www.` canonical host
- returning 404 for `/_src/` and `/build.py`
- gzip compression and cache headers

On GitHub Pages none of that applies, so `_src/` and `build.py` are reachable
over HTTP there. That is harmless for a public repo, but it is a real difference
between the Pages preview and production.

---

## CSS

Two stylesheets, both hand-written, loaded in this order:

- `assets/css/style.css` — design system, header, hero, shared sections, footer
- `assets/css/pages.css` — inner-page layouts (`.page-head`, prose, forms, tables)

### Brand palette is locked

```
Cyan       #00AFEF   fills, rules, icons, strokes — NEVER as text (2.51:1, fails AA)
Dark Blue  #1C3B7D   headings, buttons, dark panels, footer
Yellow     #FED75B   compliance flags only, always with dark-blue text
```

`--cyan-ink` (`#00618A`) is the cyan darkened along the same hue so it can carry
text at 6.83:1 on white. Use it wherever cyan would otherwise be a text colour.

### Type scale

All display sizes are tokens on `:root` (`--fs-page-h1`, `--fs-hero-h1`,
`--fs-h2`, `--fs-h2-cta`, `--fs-h2-prose`, …). The intended order is:

```
page-h1  >=  hero-h1  >  h2  >  h2-cta  >  h2-prose
```

**Change them as a set.** Two `max-height` media queries at the foot of
`style.css` redefine the whole scale for short viewports; overriding one heading
without the others is what inverts H1 against H2.

### Short-viewport tiers

A 1920×1080 laptop at 150% OS scaling reports a **1280×720** CSS viewport —
about 575px of page under the browser chrome. Width breakpoints cannot see this,
so the hero is compressed by two height-triggered tiers:

| Trigger | Typical hardware |
| --- | --- |
| `max-height: 900px` | 1440×900, 1600×900, 1080p at 125% |
| `max-height: 800px` | 1080p at 150%, 1366×768, 1280×720 |

Both are gated on `min-width: 1000px` so they never touch the stacked mobile
layout. They exist to keep the primary CTA above the fold; if hero content is
added, re-check that at 1265×575 before shipping.

---

## Outstanding before the client sees this

- [ ] **Contact form does not submit.** `contact.html` has `action="#"` — it
      posts nowhere. This is the site's primary conversion path.
- [ ] **Placeholder blocks are visible page content**, not comments, on
      `about.html` (client logo strip, three testimonial cards reading
      "Awaiting customer approval") and `resources.html`. Fill or remove.
- [ ] **Phone number** `+91 90990 00000` appears in the topbar, footer and
      contact page and reads as a placeholder.
- [ ] **Install count** is `300+` here but the brief says `250+` elsewhere —
      see the comment in `_src/pages/index.html`.
- [ ] **Social links** in the footer are `href="#"`.
- [ ] Canonical tags and `sitemap.xml` point at `https://www.apiqr.in/`. On the
      Pages URL that is deliberate — it stops the preview competing with
      production in search — but it needs apiqr.in to actually go live.
