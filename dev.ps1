# Tillerstead.com Development Helper
param(
    [Parameter(Position=0)]
    [ValidateSet("serve", "local", "build", "deploy", "clean", "test")]
    [string]$Command = "local"
)

switch ($Command) {
    "local" {
        Write-Host "🚀 Starting local dev server (Node.js + CSS hot-swap + inspector)..." -ForegroundColor Cyan
        Write-Host "   http://localhost:4173" -ForegroundColor Green
        Write-Host "   Alt+I to toggle element inspector in browser" -ForegroundColor Yellow
        node scripts/devserver.js --open
    }
    "serve" {
        Write-Host "🚀 Starting Jekyll dev server..." -ForegroundColor Cyan
        bundle exec jekyll serve --livereload
    }
    "build" {
        Write-Host "🔨 Building site..." -ForegroundColor Cyan
        bundle exec jekyll build
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Build successful!" -ForegroundColor Green
        }
    }
    "deploy" {
        Write-Host "🚀 Deploying to GitHub..." -ForegroundColor Cyan
        bundle exec jekyll build
        if ($LASTEXITCODE -eq 0) {
            git add .
            $msg = Read-Host "Commit message"
            git commit -m "$msg"
            git push origin main
            Write-Host "✅ Deployed!" -ForegroundColor Green
        }
    }
    "clean" {
        Write-Host "🧹 Cleaning build artifacts..." -ForegroundColor Cyan
        Remove-Item -Recurse -Force -ErrorAction SilentlyContinue _site, .jekyll-cache
        Write-Host "✅ Clean complete!" -ForegroundColor Green
    }
    "test" {
        Write-Host "🧪 Running tests..." -ForegroundColor Cyan
        bundle exec jekyll build
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Site builds successfully!" -ForegroundColor Green
        } else {
            Write-Host "❌ Build failed!" -ForegroundColor Red
        }
    }
}
