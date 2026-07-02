# Tillerstead — Claude Context

## Stack

- **Framework**: Eleventy 3.1
- **Templates**: Liquid (migrated from Nunjucks — do NOT use Nunjucks)
- **Styling**: PostCSS, Open Props, Modern Normalize, PurgeCSS
- **Build**: PostCSS CLI, HTML Minifier Terser, Clean CSS, Sharp
- **Testing**: Playwright, Pa11y (accessibility), Lighthouse
- **Deploy**: Cloudflare Pages (tillerstead.com)

## Template Conventions (Post-Migration)

All templates use **Liquid syntax**. The Nunjucks-to-Liquid migration
is complete. Do not introduce Nunjucks syntax.

```liquid
{%- comment -%} Liquid tags {%- endcomment -%}
{% render "components/hero", title: page.title %}
{% assign items = collections.posts | sort: "date" | reverse %}
{{ content }}
{{ page.date | date: "%B %d, %Y" }}
```

### File Locations

- Pages: `src/*.liquid` or `src/[section]/*.liquid`
- Includes: `src/_includes/components/*.liquid`
- Layouts: `src/_layouts/*.liquid`
- Data: `src/_data/*.json` or `src/_data/*.js`

### Rules

- Use `{% render %}` for partials (not `{% include %}`)
- Use `{% assign %}` for local variables
- Eleventy data cascade: `_data/` globals → front matter → computed
- Front matter uses YAML format at top of `.liquid` files

## NJ Civic Data Integration Plans

- NJ municipal data APIs
- NJ agricultural data (USDA + NJ Dept of Agriculture)
- NJ property records and land use data
- NJ Open Data portal integration
- County-level civic engagement tools

## Shared Library Dependencies

- `@evident-technologies/design-tokens` — for design consistency (if CSS tokens used)
- Tillerstead is primarily standalone with its own PostCSS pipeline
- Does not consume `@evident-technologies/ui-core` or `@evident-technologies/ui` (not React)

## Key Scripts

```bash
npm run build          # Full production build
npm run dev            # Eleventy dev server with live reload
npm run lint:css       # CSS linting
npm run format         # Prettier formatting
npm run test:a11y      # Pa11y accessibility audit
npm run test:perf      # Lighthouse performance audit
npm run build:images   # Sharp image optimization
```

## What NOT to Touch Without Asking

- Liquid template migration patterns (settled convention)
- PostCSS pipeline configuration
- NJ civic data schema definitions (when implemented)
- SEO metadata and structured data markup
