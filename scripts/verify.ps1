# Tillerstead.com - Cross-Platform Verification Script (PowerShell)
# Runs build and validation checks, exits non-zero on failure
#
# Usage: pwsh scripts/verify.ps1 [-Quick]
#   -Quick  Skip slow tests, only run build + lint

param(
    [switch]$Quick
)

$ErrorActionPreference = "Stop"

# Track failures
$script:Failures = 0

function Write-Step {
    param([string]$Message)
    Write-Host "▶ $Message" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Warn {
    param([string]$Message)
    Write-Host "⚠️  $Message" -ForegroundColor Yellow
}

function Write-Fail {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
    $script:Failures++
}

Write-Host ""
Write-Host "══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Tillerstead.com - Site Verification" -ForegroundColor Cyan
Write-Host "══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# ─────────────────────────────────────────────────────────────────────────────
# Step 1: Check prerequisites
# ─────────────────────────────────────────────────────────────────────────────
Write-Step "Checking prerequisites..."

try {
    $rubyVersion = ruby -v 2>&1
    Write-Host "  Ruby: $rubyVersion"
} catch {
    Write-Fail "Ruby is not installed"
}

try {
    $bundleVersion = bundle -v 2>&1
    Write-Host "  Bundler: $bundleVersion"
} catch {
    Write-Fail "Bundler is not installed"
}

try {
    $nodeVersion = node -v 2>&1
    Write-Host "  Node.js: $nodeVersion"
} catch {
    Write-Fail "Node.js is not installed"
}

try {
    $npmVersion = npm -v 2>&1
    Write-Host "  npm: $npmVersion"
} catch {
    Write-Fail "npm is not installed"
}

if ($script:Failures -gt 0) {
    Write-Host ""
    Write-Fail "Prerequisites check failed. Please install missing dependencies."
    exit 1
}
Write-Success "Prerequisites OK"
Write-Host ""

# ─────────────────────────────────────────────────────────────────────────────
# Step 2: Install dependencies
# ─────────────────────────────────────────────────────────────────────────────
Write-Step "Installing Ruby dependencies..."
try {
    bundle install --jobs 4 --retry 3
    if ($LASTEXITCODE -ne 0) { throw "bundle install failed" }
    Write-Success "Ruby dependencies installed"
} catch {
    Write-Fail "bundle install failed: $_"
}
Write-Host ""

Write-Step "Installing Node.js dependencies..."
try {
    $null = npm ci 2>&1
    if ($LASTEXITCODE -ne 0) {
        npm install --legacy-peer-deps
        if ($LASTEXITCODE -ne 0) { throw "npm install failed" }
    }
    Write-Success "Node.js dependencies installed"
} catch {
    Write-Fail "npm install failed: $_"
}
Write-Host ""

# ─────────────────────────────────────────────────────────────────────────────
# Step 3: Build site
# ─────────────────────────────────────────────────────────────────────────────
Write-Step "Building Jekyll site..."
try {
    bundle exec jekyll build
    if ($LASTEXITCODE -ne 0) { throw "Jekyll build failed" }
    
    if (Test-Path "_site") {
        $fileCount = (Get-ChildItem -Path "_site" -Recurse -File).Count
        Write-Success "Jekyll build successful ($fileCount files)"
    } else {
        Write-Fail "Build failed: _site directory not found"
    }
} catch {
    Write-Fail "Jekyll build failed: $_"
}
Write-Host ""

# ─────────────────────────────────────────────────────────────────────────────
# Step 4: Run linters
# ─────────────────────────────────────────────────────────────────────────────
Write-Step "Running CSS linter (Stylelint)..."
npm run lint:css
if ($LASTEXITCODE -eq 0) {
    Write-Success "CSS lint passed"
} else {
    Write-Warn "CSS lint had warnings"
}
Write-Host ""

Write-Step "Running JavaScript linter (ESLint)..."
npm run lint:js
if ($LASTEXITCODE -eq 0) {
    Write-Success "JS lint passed"
} else {
    Write-Warn "JS lint had warnings (expected: ~70)"
}
Write-Host ""

# ─────────────────────────────────────────────────────────────────────────────
# Step 5: HTML Validation (skip in quick mode)
# ─────────────────────────────────────────────────────────────────────────────
if (-not $Quick) {
    Write-Step "Validating HTML..."
    npm run validate:html
    if ($LASTEXITCODE -eq 0) {
        Write-Success "HTML validation passed"
    } else {
        Write-Warn "HTML validation had issues"
    }
    Write-Host ""
}

# ─────────────────────────────────────────────────────────────────────────────
# Step 6: Check for broken links (skip in quick mode)
# ─────────────────────────────────────────────────────────────────────────────
if (-not $Quick) {
    Write-Step "Scanning for broken links..."
    npm run scan:links
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Link scan completed"
    } else {
        Write-Warn "Link scan found issues"
    }
    Write-Host ""
}

# ─────────────────────────────────────────────────────────────────────────────
# Summary
# ─────────────────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
if ($script:Failures -gt 0) {
    Write-Host "  VERIFICATION FAILED: $($script:Failures) critical issue(s)" -ForegroundColor Red
    Write-Host "══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    exit 1
} else {
    Write-Host "  VERIFICATION PASSED" -ForegroundColor Green
    Write-Host "══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    exit 0
}
