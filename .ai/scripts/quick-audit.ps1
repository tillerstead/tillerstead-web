# /.ai/scripts/quick-audit.ps1
# Fast pre-commit audit - completes in <3 seconds

Set-StrictMode -Version Latest
$ErrorActionPreference = "Continue"

$Root = (Get-Location).Path
$ExitCode = 0

Write-Host "Quick Audit: Checking governance files..." -ForegroundColor Cyan

# Check critical governance files exist
$requiredFiles = @(
  "AI_IMPORTANT.md",
  ".ai/CODEX.md",
  ".ai/COMPLIANCE.md"
)

foreach ($file in $requiredFiles) {
  $path = Join-Path $Root $file
  if (-not (Test-Path $path)) {
    Write-Host "  ✗ Missing: $file" -ForegroundColor Red
    $ExitCode = 1
  } else {
    Write-Host "  ✓ Found: $file" -ForegroundColor Green
  }
}

# Quick check for prohibited patterns in staged files only (very fast)
try {
  $stagedFiles = @(git diff --cached --name-only --diff-filter=ACM 2>$null)
  
  if ($stagedFiles.Count -gt 0) {
    Write-Host "Scanning $($stagedFiles.Count) staged files..." -ForegroundColor Cyan
    
    $prohibitedPatterns = @(
      @{ Pattern = 'eval\s*\('; Message = 'eval() detected' },
      @{ Pattern = 'debugger;'; Message = 'debugger found' }
    )
    
    # Only check files that exist and are text files
    foreach ($file in $stagedFiles | Where-Object { $_ -match '\.(md|js|ts)$' } | Select-Object -First 30) {
      $fullPath = Join-Path $Root $file
      if (Test-Path $fullPath) {
        try {
          $content = Get-Content -Path $fullPath -Raw -ErrorAction Stop
          
          foreach ($check in $prohibitedPatterns) {
            if ($content -match $check.Pattern) {
              Write-Host "  ⚠ $file : $($check.Message)" -ForegroundColor Yellow
            }
          }
        } catch {
          # Skip binary or problematic files
        }
      }
    }
  }
} catch {
  # Git might not be available or no staged files
}

if ($ExitCode -eq 0) {
  Write-Host "✓ Quick audit passed" -ForegroundColor Green
} else {
  Write-Host "✗ Quick audit found issues" -ForegroundColor Red
}

exit $ExitCode
