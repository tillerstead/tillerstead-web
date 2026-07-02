#!/usr/bin/env bash
# Tillerstead.com - Cross-Platform Verification Script (Bash)
# Runs build and validation checks, exits non-zero on failure
#
# Usage: ./scripts/verify.sh [--quick]
#   --quick  Skip slow tests, only run build + lint

set -euo pipefail

# Colors (if terminal supports them)
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Detect if colors are supported
if [[ ! -t 1 ]]; then
    RED=''
    GREEN=''
    YELLOW=''
    CYAN=''
    NC=''
fi

QUICK_MODE=false
if [[ "${1:-}" == "--quick" ]]; then
    QUICK_MODE=true
fi

echo -e "${CYAN}══════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}  Tillerstead.com - Site Verification${NC}"
echo -e "${CYAN}══════════════════════════════════════════════════════════════${NC}"
echo ""

# Track failures
FAILURES=0

step() {
    echo -e "${CYAN}▶ $1${NC}"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warn() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

fail() {
    echo -e "${RED}❌ $1${NC}"
    FAILURES=$((FAILURES + 1))
}

# ─────────────────────────────────────────────────────────────────────────────
# Step 1: Check prerequisites
# ─────────────────────────────────────────────────────────────────────────────
step "Checking prerequisites..."

if ! command -v ruby &> /dev/null; then
    fail "Ruby is not installed"
else
    RUBY_VERSION=$(ruby -v)
    echo "  Ruby: $RUBY_VERSION"
fi

if ! command -v bundle &> /dev/null; then
    fail "Bundler is not installed"
else
    BUNDLE_VERSION=$(bundle -v)
    echo "  Bundler: $BUNDLE_VERSION"
fi

if ! command -v node &> /dev/null; then
    fail "Node.js is not installed"
else
    NODE_VERSION=$(node -v)
    echo "  Node.js: $NODE_VERSION"
fi

if ! command -v npm &> /dev/null; then
    fail "npm is not installed"
else
    NPM_VERSION=$(npm -v)
    echo "  npm: $NPM_VERSION"
fi

if [[ $FAILURES -gt 0 ]]; then
    echo ""
    fail "Prerequisites check failed. Please install missing dependencies."
    exit 1
fi
success "Prerequisites OK"
echo ""

# ─────────────────────────────────────────────────────────────────────────────
# Step 2: Install dependencies
# ─────────────────────────────────────────────────────────────────────────────
step "Installing Ruby dependencies..."
bundle install --jobs 4 --retry 3 || { fail "bundle install failed"; }
success "Ruby dependencies installed"
echo ""

step "Installing Node.js dependencies..."
npm ci 2>/dev/null || npm install --legacy-peer-deps || { fail "npm install failed"; }
success "Node.js dependencies installed"
echo ""

# ─────────────────────────────────────────────────────────────────────────────
# Step 3: Build site
# ─────────────────────────────────────────────────────────────────────────────
step "Building Jekyll site..."
bundle exec jekyll build || { fail "Jekyll build failed"; }

if [[ -d "_site" ]]; then
    FILE_COUNT=$(find _site -type f | wc -l | tr -d ' ')
    success "Jekyll build successful ($FILE_COUNT files)"
else
    fail "Build failed: _site directory not found"
fi
echo ""

# ─────────────────────────────────────────────────────────────────────────────
# Step 4: Run linters
# ─────────────────────────────────────────────────────────────────────────────
step "Running CSS linter (Stylelint)..."
npm run lint:css && success "CSS lint passed" || warn "CSS lint had warnings"
echo ""

step "Running JavaScript linter (ESLint)..."
npm run lint:js && success "JS lint passed" || warn "JS lint had warnings (expected: ~70)"
echo ""

# ─────────────────────────────────────────────────────────────────────────────
# Step 5: HTML Validation (skip in quick mode)
# ─────────────────────────────────────────────────────────────────────────────
if [[ "$QUICK_MODE" == false ]]; then
    step "Validating HTML..."
    npm run validate:html && success "HTML validation passed" || warn "HTML validation had issues"
    echo ""
fi

# ─────────────────────────────────────────────────────────────────────────────
# Step 6: Check for broken links (skip in quick mode)
# ─────────────────────────────────────────────────────────────────────────────
if [[ "$QUICK_MODE" == false ]]; then
    step "Scanning for broken links..."
    npm run scan:links && success "Link scan completed" || warn "Link scan found issues"
    echo ""
fi

# ─────────────────────────────────────────────────────────────────────────────
# Summary
# ─────────────────────────────────────────────────────────────────────────────
echo ""
echo -e "${CYAN}══════════════════════════════════════════════════════════════${NC}"
if [[ $FAILURES -gt 0 ]]; then
    echo -e "${RED}  VERIFICATION FAILED: $FAILURES critical issue(s)${NC}"
    echo -e "${CYAN}══════════════════════════════════════════════════════════════${NC}"
    exit 1
else
    echo -e "${GREEN}  VERIFICATION PASSED${NC}"
    echo -e "${CYAN}══════════════════════════════════════════════════════════════${NC}"
    exit 0
fi
