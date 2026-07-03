# Tillerstead.com

Professional tile and stone installation website for Tillerstead LLC, a New Jersey licensed Home Improvement Contractor (HIC #13VH10808800). The canonical production deploy target is Cloudflare Pages.

## Quick Start

```bash
# Install dependencies
npm ci

# Start development server
npx @11ty/eleventy --serve

# Or use the helper script
pwsh dev.ps1 serve
```

Site will be available at http://localhost:4000

## Prerequisites

| Tool    | Version                  | Check     |
| ------- | ------------------------ | --------- |
| Node.js | ≥18 (22 LTS recommended) | `node -v` |
| npm     | ≥9                       | `npm -v`  |

### Windows Setup

```powershell
# Install Node.js via nvm-windows or official installer

# Install dependencies
npm ci
```

### macOS/Linux Setup

```bash
# Install Node.js via nvm
nvm install 22
nvm use 22

# Install dependencies
npm ci
```

## Development

### Available Commands

| Command          | Description                               |
| ---------------- | ----------------------------------------- |
| `npm run dev`    | Start development server with live reload |
| `npm run build`  | Build site for production                 |
| `npm run lint`   | Run all linters (CSS, JS, HTML)           |
| `npm run format` | Format code with Prettier                 |
| `npm test`       | Run Playwright navigation tests           |

### Verification Scripts

Cross-platform scripts to verify the build:

```bash
# Bash (Linux/macOS/WSL)
./scripts/verify.sh

# PowerShell (Windows)
pwsh scripts/verify.ps1

# Quick mode (skip slow tests)
./scripts/verify.sh --quick
pwsh scripts/verify.ps1 -Quick
```

### Helper Script (Windows)

```powershell
pwsh dev.ps1 serve    # Start dev server
pwsh dev.ps1 build    # Build site
pwsh dev.ps1 clean    # Clean build artifacts
pwsh dev.ps1 test     # Run build test
```

## Architecture

### Tech Stack

- **Static Site Generator:** Eleventy 3.x
- **CSS:** Native CSS with custom properties (design tokens)
- **JavaScript:** ES Modules with progressive enhancement
- **Build:** npm scripts + Eleventy
- **Testing:** Playwright, pa11y-ci, Lighthouse CI
- **Linting:** ESLint, Stylelint, html-validate, Prettier

### Directory Structure

```
├── .eleventy.js         # Eleventy configuration
├── _data/               # YAML data files
├── _includes/           # Reusable HTML components
├── _layouts/            # Page templates
├── _posts/              # Blog posts
├── assets/
│   ├── css/             # Stylesheets (design tokens in root-vars.css)
│   ├── js/              # JavaScript modules
│   ├── img/             # Images
│   └── icons/           # SVG icons
├── scripts/             # Build and utility scripts
└── tests/               # Playwright tests
```

### Design Tokens

All design tokens are defined in `assets/css/root-vars.css`:

- Colors: `--tiller-color-*`, `--tiller-bg-*`
- Spacing: `--tiller-spacing-*` (responsive with clamp)
- Typography: `--tiller-font-size-*` (responsive with clamp)
- Shadows: `--tiller-shadow-*`
- Border radius: `--tiller-border-radius-*`
- Transitions: `--tiller-transition-*`

WCAG-compliant tokens include `-wcag` suffix for accessible contrast.

## Deployment

### Cloudflare Pages (Canonical)

Automatically deploys on push to `main` via GitHub Actions:

1. CI workflow runs linting, build, and tests
2. Cloudflare Pages workflow builds and deploys the Eleventy output
3. Site is live at https://tillerstead.com

### Netlify (Secondary)

`netlify.toml` remains available as a secondary static-host target.

## Quality Assurance

### Automated Checks (CI)

- **ESLint:** JavaScript linting
- **Stylelint:** CSS linting
- **html-validate:** HTML validation
- **Playwright:** Navigation tests
- **npm audit:** Security vulnerability scanning
- **Lighthouse CI:** Performance monitoring

### Accessibility

- WCAG 2.1 AA compliance target
- pa11y-ci with axe-core runner
- Skip-to-content links
- Focus-visible states
- Reduced motion support

### Performance

- Critical CSS extraction
- Image optimization (WebP, AVIF)
- Service worker for offline support
- Lazy loading for images

## Contributing

1. Create a feature branch from `main`
2. Make changes
3. Run verification: `./scripts/verify.sh`
4. Submit a pull request

## License

Proprietary software. All rights reserved by Evident Technologies LLC.
See [LICENSE](../../LICENSE).

## Contact

Tillerstead LLC  
HIC #13VH10808800  
https://tillerstead.com

## Tillerstead Standalone Status

This repository is the standalone public website for Tillerstead LLC.

Current migration status:

* Standalone GitHub repo created.
* Public/private split completed.
* Local install/lint/build/verify pass.
* Cloudflare preview deployment is pending valid Cloudflare authentication.
* DNS cutover has not happened.
* Private ops materials are excluded and reserved for a future private ops repository.
