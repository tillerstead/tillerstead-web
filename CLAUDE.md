# Tillerstead — Claude Context

## Repository

- Public web repo: `tillerstead/tillerstead-web`
- Originally extracted from `evident-technologies/platform` at commit `0688af78d2d65df1cafbf97be6e4bb127c83c2a6`.
- Private ops (admin/toolkit) are intentionally excluded and belong in a separate private repo.

## Stack

- **Framework**: Eleventy 3.1
- **Templates**: Nunjucks (public site templates under `_includes/` and `src/`)
- **Styling**: PostCSS, custom CSS, Open Props, Modern Normalize
- **Build**: Eleventy CLI, PostCSS CLI, HTML Minifier Terser, Clean CSS, Sharp
- **Testing**: Playwright, Pa11y (accessibility), Lighthouse
- **Deploy target**: Cloudflare Pages (tillerstead.com) — not yet cut over

## Template Conventions

Templates use Nunjucks syntax:

```nunjucks
{% set items = collections.posts | reverse %}
{% include "components/hero.njk" %}
{{ content }}
{{ page.date | date("%B %d, %Y") }}
```

### File Locations

- Pages: `src/*.njk`, `src/*.md`, root `*.html`
- Includes: `_includes/**/*.njk`
- Layouts: `_includes/layouts/*.njk`
- Data: `_data/*.yml`
- Assets: `assets/`

## Build

```bash
pnpm install
pnpm run build
pnpm run lint
pnpm run verify
```

## Notes

- This is a standalone repo; workspace dependencies have been vendored or removed.
- No `admin/`, `toolkit/`, `.git-encrypt/`, or generated artifacts are tracked here.
