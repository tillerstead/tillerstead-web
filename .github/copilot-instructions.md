---
description: 'Tillerstead workspace rules: NJ contractor compliance, admin/server architecture, and web standards for tillerstead.com.'
applyTo: ['products/tillerstead/**']
---

# Copilot Instructions — Tillerstead

## Purpose

Tillerstead is a **New Jersey licensed home improvement contractor** (HIC
#13VH10808800) serving Atlantic County and South Jersey. This repo is the
public website (tillerstead.com) and admin dashboard for managing the
contracting business.

**This is NOT a software startup.** It is a construction business with a
digital presence. All AI assistance must reflect trade credibility, NJ
compliance, and homeowner trust.

## Canonical Governance Sources

Executive directives and operating mode live in:

- **/AI_IMPORTANT.md** — Primary executive directives
- **/.ai/** — Technical authority and compliance rules
- **/codebooks/** — Voice, style, and communication standards

---

## Architecture

| Layer            | Technology                          | Notes                        |
| ---------------- | ----------------------------------- | ---------------------------- |
| **Public site**  | Jekyll + GitHub Pages               | tillerstead.com, SEO-focused |
| **Admin server** | Express (ES modules, port 3001)     | Owner-only dashboard         |
| **Auth**         | bcrypt + speakeasy 2FA + GitHub PAT | Owner-only (xTx396)          |
| **Data store**   | JSON file-based CRUD                | `admin/data/` (gitignored)   |
| **Calculators**  | TCNA-compliant tile calculators     | Public-facing tools          |

## Directory Map

```
admin/
├── server.js              # Express entry point
├── lib/
│   ├── nj-compliance.js   # NJSA 56:8-136 constants and validation
│   └── data-store.js      # JSON file CRUD with atomic writes
├── routes/
│   ├── jobs.js            # Job CRUD with NJ compliance enforcement
│   ├── estimates.js       # Estimates with auto-numbering, NJ sales tax
│   └── homeowners.js      # Homeowner CRM with delete protection
├── public/
│   ├── dashboard.html     # Main admin dashboard
│   ├── jobs.html          # Job management page
│   ├── jobs-app.js        # Jobs frontend SPA logic
│   └── admin-styles.css   # Admin CSS (tabs, tables, badges, modals)
└── data/                  # Client data — GITIGNORED, never commit
```

## NJ Compliance (Non-Negotiable)

- **License:** HIC #13VH10808800 — must appear on all contracts
- **Max deposit:** 1/3 of contract price (NJSA 56:8-136)
- **Right to cancel:** 3 business days
- **Lead paint:** Disclosure required for pre-1978 structures
- **Min contract amount:** $500 for written contract requirement
- **Sales tax:** 6.625% on materials only (labor exempt)

## Business Data Models

| Entity        | Store Key    | Purpose                                      |
| ------------- | ------------ | -------------------------------------------- |
| **Job**       | `jobs`       | Project lifecycle: lead → completed → closed |
| **Estimate**  | `estimates`  | Line-item estimates with NJ tax calc         |
| **Homeowner** | `homeowners` | Client CRM with property info                |

## Job Status Workflow

lead → estimated → contracted → permitted → scheduled → in_progress →
punch_list → completed → closed (or cancelled at any stage)

## Coding Standards

- ES modules (`import`/`export`)
- Express route handlers with proper error handling
- 44px minimum touch targets for mobile
- All NJ compliance rules enforced server-side, not just client-side
- Client data in `admin/data/` — never commit to git
- Homeowner records deletion-protected when jobs exist

## What NOT to Build

- No SaaS multi-tenancy — this is a single-contractor system
- No payment processing — invoicing is external
- No public homeowner login — admin-only system
- No marketing automation or email campaigns
