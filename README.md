# 5kweeks.life

Marketing landing page for **5k Weeks** — a habit-tracker and life-calendar app that helps you see your life as a grid of weeks and fill each one with five habits that matter (goals, meditation, gratitude, exercise, fasting).

Live at **[5kweeks.life](https://5kweeks.life)** · hosted on GitHub Pages.

## Structure

| File | Purpose |
| --- | --- |
| `index.html` | Single-page landing site (all CSS/JS inline, no build step) |
| `privacy.html` / `terms.html` | Legal pages |
| `favicon.svg`, `favicon.ico`, `apple-touch-icon.png`, `icon-192.png`, `icon-512.png` | Icons |
| `og-image.png` | 1200×630 social-share image |
| `site.webmanifest` | PWA manifest |
| `CNAME` | Custom domain for GitHub Pages |
| `robots.txt`, `sitemap.xml` | SEO |
| `_assets/` | Source HTML used to render `og-image.png` and the icons (not served) |

## Local preview

It's a static site — just open `index.html`, or serve the folder:

```sh
python3 -m http.server 8000
# → http://localhost:8000
```

## Regenerating images

The OG image and icons are rendered from the HTML in `_assets/` via headless Chrome:

```sh
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
"$CHROME" --headless=new --force-device-scale-factor=2 --window-size=1200,630 \
  --virtual-time-budget=6000 --screenshot="$PWD/_assets/og-raw.png" \
  "file://$PWD/_assets/og-image.html"
sips -z 630 1200 _assets/og-raw.png --out og-image.png
```

## Notes / TODO

- App-store buttons are in a **"Coming soon"** state. When the app ships, swap the
  `.store.soon` spans in `index.html` back to `<a href="…">` links pointing at the
  real App Store / Google Play URLs.
- `privacy.html` / `terms.html` are sensible starting drafts — review against the
  app's actual data practices before relying on them.
