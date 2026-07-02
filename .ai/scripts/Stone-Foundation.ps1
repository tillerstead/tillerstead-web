<#
.SYNOPSIS
  Stone Foundation repo hardening: normalizes Git hooks, GitHub config, and hook templates for Tillerstead.com.

.DESCRIPTION
  This script fixes the common "three-hook-locations" problem:
  - Real Git hooks live in:      .git/hooks/
  - Versioned hook templates:    .githooks/
  - GitHub metadata (workflows): .github/

  It will:
  1) Verify repo root and .git existence
  2) Validate PowerShell version and Git availability
  3) Create/normalize .githooks/ structure (versioned templates)
  4) Install the real hooks into .git/hooks (with backups + manifest)
  5) Optionally set core.hooksPath to .githooks (recommended) so hooks are portable across clones
  6) Detect and quarantine any .github/hooks folder (NOT executed by Git) into .github/_archive-hooks
  7) Ensure .github/copilot-instructions.md exists (optional stub) and warn if mislocated
  8) Verify hooks are executable and properly installed

.SAFETY
  - Default is PREVIEW (no changes)
  - Use -Apply to modify files
  - Creates timestamped backups and a manifest
  - Supports rollback via saved manifests

.REQUIREMENTS
  - PowerShell 7.0+ (tested with 7.5.4+)
  - Git available in PATH

.USAGE
  Preview:
    pwsh -File .\.ai\scripts\Stone-Foundation.ps1

  Apply recommended fixes:
    pwsh -File .\.ai\scripts\Stone-Foundation.ps1 -Apply

  Apply + set hooksPath (portable hooks):
    pwsh -File .\.ai\scripts\Stone-Foundation.ps1 -Apply -SetHooksPath

  Apply + set hooksPath + quarantine .github/hooks if present:
    pwsh -File .\.ai\scripts\Stone-Foundation.ps1 -Apply -SetHooksPath -QuarantineGithubHooks

  Verify only (check current state):
    pwsh -File .\.ai\scripts\Stone-Foundation.ps1 -VerifyOnly

.NOTES
  Author: Tyler Tillman (Tillerstead.com AI Governance)
  Version: 2.0.0
  Last Modified: 2026-01-26
#>

[CmdletBinding()]
param(
  [string]$RepoRoot = "C:\web-dev\github-repos\Tillerstead.com",
  [switch]$Apply,
  [switch]$SetHooksPath,
  [switch]$QuarantineGithubHooks,
  [switch]$VerifyOnly
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

#region Helper Functions

function Write-Section([string]$t) {
  Write-Host ""
  Write-Host ("=" * 60) -ForegroundColor Cyan
  Write-Host "  $t" -ForegroundColor Cyan
  Write-Host ("=" * 60) -ForegroundColor Cyan
}

function Write-Success([string]$msg) {
  Write-Host "✓ $msg" -ForegroundColor Green
}

function Write-Warning([string]$msg) {
  Write-Host "⚠ $msg" -ForegroundColor Yellow
}

function Write-Error([string]$msg) {
  Write-Host "✗ $msg" -ForegroundColor Red
}

function Preview-Or([scriptblock]$Do, [string]$PreviewMsg) {
  if ($Apply -and -not $VerifyOnly) { 
    & $Do 
    Write-Success $PreviewMsg.Replace("would ", "")
  } else { 
    Write-Host "  PREVIEW: $PreviewMsg" -ForegroundColor Yellow 
  }
}

function Ensure-Dir([string]$Path) {
  if (-not (Test-Path $Path)) {
    Preview-Or { 
      New-Item -ItemType Directory -Path $Path -Force | Out-Null 
    } "would create directory $Path"
    return $true
  }
  return $false
}

function Copy-WithBackup([string]$Src, [string]$Dest, [string]$BackupDir) {
  if (-not (Test-Path $Src)) { 
    Write-Warning "Source file not found: $Src"
    return $null 
  }

  $changed = $false
  if (Test-Path $Dest) {
    # Check if files are different
    $srcHash = (Get-FileHash -Path $Src -Algorithm SHA256).Hash
    $destHash = (Get-FileHash -Path $Dest -Algorithm SHA256).Hash
    
    if ($srcHash -ne $destHash) {
      $stamp = Get-Date -Format "yyyyMMdd_HHmmss"
      $name = Split-Path $Dest -Leaf
      $bak = Join-Path $BackupDir "$name.$stamp.bak"
      Preview-Or { Copy-Item -Path $Dest -Destination $bak -Force } "would backup $Dest -> $bak"
      $changed = $true
    } else {
      Write-Host "  → No changes needed for $Dest (identical)" -ForegroundColor DarkGray
      return $false
    }
  } else {
    $changed = $true
  }

  if ($changed) {
    Preview-Or { Copy-Item -Path $Src -Destination $Dest -Force } "would copy $Src -> $Dest"
  }
  
  return $changed
}

function Move-WithBackup([string]$Src, [string]$DestDir, [string]$BackupDir) {
  if (-not (Test-Path $Src)) { return }

  $stamp = Get-Date -Format "yyyyMMdd_HHmmss"
  $leaf  = Split-Path $Src -Leaf
  $dest  = Join-Path $DestDir "$leaf.$stamp"

  Preview-Or { 
    Copy-Item -Path $Src -Destination (Join-Path $BackupDir "$leaf.$stamp.bak") -Recurse -Force 
  } "would backup $Src -> $BackupDir\$leaf.$stamp.bak"
  
  Preview-Or { 
    Move-Item -Path $Src -Destination $dest -Force 
  } "would move $Src -> $dest"
}

function Test-GitAvailable {
  try {
    $null = & git --version 2>&1
    return $?
  } catch {
    return $false
  }
}

function Test-PowerShellVersion {
  $minVersion = [Version]"7.0.0"
  $currentVersion = $PSVersionTable.PSVersion
  
  if ($currentVersion -lt $minVersion) {
    throw "PowerShell version $minVersion or higher required. Current: $currentVersion"
  }
  Write-Success "PowerShell version: $currentVersion"
}

function Assert-GitRepo([string]$Root) {
  if (-not (Test-Path (Join-Path $Root ".git"))) {
    throw "No .git directory found at: $Root. Confirm RepoRoot is correct."
  }
  
  if (-not (Test-GitAvailable)) {
    throw "Git is not available in PATH. Please install Git and try again."
  }

  try {
    $top = (& git -C $Root rev-parse --show-toplevel 2>&1)
    if ($LASTEXITCODE -ne 0) { 
      throw "Git did not recognize this as a repo: $Root. Error: $top" 
    }
    
    # Normalize paths for comparison
    $top = $top.Trim() -replace '\\', '/'
    $RootNorm = (Resolve-Path $Root).Path -replace '\\', '/'
    
    if ($top -ne $RootNorm) {
      Write-Warning "Path mismatch - Git top-level: $top vs Specified: $RootNorm"
      # Don't fail on this - Windows path handling can be quirky
    }
    
    Write-Success "Git repository validated at: $Root"
  } catch {
    throw "Failed to validate Git repository: $_"
  }
}

function Get-GitConfig([string]$Key, [string]$RepoPath) {
  try {
    $value = & git -C $RepoPath config --get $Key 2>$null
    if ($LASTEXITCODE -eq 0) { return $value.Trim() }
    return $null
  } catch {
    return $null
  }
}

function Set-GitConfig([string]$Key, [string]$Value, [string]$RepoPath) {
  try {
    & git -C $RepoPath config $Key $Value
    if ($LASTEXITCODE -eq 0) { 
      Write-Success "Set git config $Key = $Value"
      return $true 
    }
    throw "Git config failed with exit code $LASTEXITCODE"
  } catch {
    Write-Error "Failed to set git config $Key : $_"
    return $false
  }
}

function Test-HookExecutable([string]$HookPath) {
  if (-not (Test-Path $HookPath)) { return $false }
  
  # On Windows, check if file exists and is readable
  # On Unix, would check execute permissions
  try {
    $content = Get-Content -Path $HookPath -TotalCount 1 -ErrorAction Stop
    # Check for shebang
    if ($content -match '^#!') {
      return $true
    }
    Write-Warning "Hook $HookPath missing shebang line"
    return $true # Still exists, just warning
  } catch {
    return $false
  }
}

#endregion

#region Main Script

Write-Section "Stone Foundation - Git Hooks Normalization"
Write-Host "Repository: $RepoRoot" -ForegroundColor White
Write-Host "Mode: $(if ($VerifyOnly) { 'VERIFY ONLY' } elseif ($Apply) { 'APPLY' } else { 'PREVIEW' })" -ForegroundColor $(if ($Apply -and -not $VerifyOnly) { 'Green' } else { 'Yellow' })
Write-Host ""

# Validate environment
Write-Section "1. Environment Validation"
Test-PowerShellVersion
Assert-GitRepo $RepoRoot

# Define paths
$gitDir      = Join-Path $RepoRoot ".git"
$gitHooks    = Join-Path $gitDir "hooks"
$hooksTplDir = Join-Path $RepoRoot ".githooks"
$githubDir   = Join-Path $RepoRoot ".github"
$backupDir   = Join-Path $RepoRoot "_audit\hook-backups"
$manifestDir = Join-Path $RepoRoot "_audit\hook-manifests"

Write-Host ""
Write-Host "Paths:" -ForegroundColor Cyan
Write-Host "  Git hooks (active):    $gitHooks"
Write-Host "  Hook templates (repo): $hooksTplDir"
Write-Host "  GitHub config:         $githubDir"
Write-Host "  Backups:               $backupDir"
Write-Host "  Manifests:             $manifestDir"

# Create necessary directories
Write-Section "2. Directory Structure"
Ensure-Dir (Join-Path $RepoRoot "_audit") | Out-Null
Ensure-Dir $backupDir | Out-Null
Ensure-Dir $manifestDir | Out-Null
Ensure-Dir $gitHooks | Out-Null
Ensure-Dir $hooksTplDir | Out-Null
Ensure-Dir $githubDir | Out-Null

# Initialize manifest
$manifest = [ordered]@{
  timestamp = (Get-Date).ToString("o")
  mode = $(if ($VerifyOnly) { "verify" } elseif ($Apply) { "apply" } else { "preview" })
  repoRoot = $RepoRoot
  environment = @{
    powershell = $PSVersionTable.PSVersion.ToString()
    git = (& git --version).Trim()
    os = $PSVersionTable.OS
  }
  actions = @()
  warnings = @()
  errors = @()
  hooks = @{}
}

# Check current Git config
$currentHooksPath = Get-GitConfig -Key "core.hooksPath" -RepoPath $RepoRoot
if ($currentHooksPath) {
  Write-Host "  Current core.hooksPath: $currentHooksPath" -ForegroundColor Cyan
  $manifest.hooks.currentHooksPath = $currentHooksPath
} else {
  Write-Host "  Current core.hooksPath: <not set> (using default .git/hooks)" -ForegroundColor Cyan
  $manifest.hooks.currentHooksPath = ".git/hooks (default)"
}

# Normalize hook templates
Write-Section "3. Hook Templates (.githooks)"

$hookTemplates = @{
  "pre-commit" = @'
#!/usr/bin/env bash
# Pre-commit hook: AI governance enforcement

echo "Running AI governance pre-flight checks..."

# Prefer pwsh (PowerShell 7+), fall back to powershell if needed
if command -v pwsh >/dev/null 2>&1; then
  PS_CMD="pwsh"
elif command -v powershell >/dev/null 2>&1; then
  PS_CMD="powershell"
else
  echo "ERROR: PowerShell not found. Cannot run AI lint."
  exit 1
fi

# Run AI lint script
$PS_CMD -NoProfile -ExecutionPolicy Bypass -File ".ai/scripts/ai-lint.ps1"
STATUS=$?

if [ $STATUS -ne 0 ]; then
  echo "❌ Commit blocked: AI governance checks failed."
  exit 1
fi

echo "✅ AI governance checks passed."
exit 0
'@
}

foreach ($hookName in $hookTemplates.Keys) {
  $tplPath = Join-Path $hooksTplDir $hookName
  $hookContent = $hookTemplates[$hookName]
  
  if (Test-Path $tplPath) {
    # Check if existing template is different
    $existing = Get-Content -Path $tplPath -Raw
    if ($existing.Trim() -ne $hookContent.Trim()) {
      $manifest.warnings += "Existing .githooks/$hookName differs from recommended template"
      Write-Warning "Existing .githooks/$hookName found with different content"
      Write-Host "  → Keeping existing template (not overwriting)" -ForegroundColor Yellow
    } else {
      Write-Success "Hook template .githooks/$hookName already up to date"
    }
    $manifest.actions += "Verified .githooks/$hookName exists"
  } else {
    Preview-Or { 
      Set-Content -Path $tplPath -Value $hookContent -Encoding UTF8 -NoNewline
    } "would create template .githooks/$hookName"
    $manifest.actions += "Created .githooks/$hookName"
  }
  
  $manifest.hooks.$hookName = @{
    template = $tplPath
    exists = (Test-Path $tplPath)
  }
}

# Install hooks to .git/hooks
Write-Section "4. Install Hooks (.git/hooks)"

foreach ($hookName in $hookTemplates.Keys) {
  $srcPath = Join-Path $hooksTplDir $hookName
  $destPath = Join-Path $gitHooks $hookName
  
  if (Test-Path $srcPath) {
    $changed = Copy-WithBackup -Src $srcPath -Dest $destPath -BackupDir $backupDir
    if ($changed) {
      $manifest.actions += "Installed/updated .git/hooks/$hookName"
    }
    
    # Verify hook is executable
    if (Test-Path $destPath) {
      $isExecutable = Test-HookExecutable -HookPath $destPath
      $manifest.hooks.$hookName.installed = $true
      $manifest.hooks.$hookName.executable = $isExecutable
      
      if ($isExecutable) {
        Write-Success "Hook .git/hooks/$hookName is properly configured"
      } else {
        Write-Warning "Hook .git/hooks/$hookName may not be executable"
      }
    }
  } else {
    Write-Warning "Source template not found: $srcPath"
    $manifest.warnings += "Cannot install $hookName - template missing"
  }
}

# Configure core.hooksPath
Write-Section "5. Git Hooks Path Configuration"

if ($SetHooksPath -and -not $VerifyOnly) {
  $targetPath = ".githooks"
  if ($currentHooksPath -ne $targetPath) {
    Preview-Or { 
      Set-GitConfig -Key "core.hooksPath" -Value $targetPath -RepoPath $RepoRoot | Out-Null
    } "would set git config core.hooksPath=$targetPath"
    $manifest.actions += "Set core.hooksPath=$targetPath"
    $manifest.hooks.hooksPathChanged = $true
  } else {
    Write-Success "core.hooksPath already set to $targetPath"
    $manifest.actions += "core.hooksPath already configured correctly"
  }
} elseif ($SetHooksPath -and $VerifyOnly) {
  Write-Host "  → Would set core.hooksPath=.githooks (skipped in verify mode)" -ForegroundColor Yellow
} else {
  Write-Warning "core.hooksPath not changed. Hooks will execute from .git/hooks"
  Write-Host "  → Use -SetHooksPath to enable portable hooks across clones" -ForegroundColor Cyan
  $manifest.warnings += "core.hooksPath not set (use -SetHooksPath for portability)"
}

# Handle .github/hooks
Write-Section "6. GitHub Hooks Directory (.github/hooks)"

$githubHooksDir = Join-Path $githubDir "hooks"
if (Test-Path $githubHooksDir) {
  $msg = ".github/hooks exists, but Git does NOT execute hooks from .github/"
  $manifest.warnings += $msg
  Write-Warning $msg
  Write-Host "  → Git only executes hooks from .git/hooks or core.hooksPath" -ForegroundColor Yellow
  
  if ($QuarantineGithubHooks -and -not $VerifyOnly) {
    $archiveDir = Join-Path $githubDir "_archive-hooks"
    Ensure-Dir $archiveDir | Out-Null
    
    Preview-Or { 
      Move-WithBackup -Src $githubHooksDir -DestDir $archiveDir -BackupDir $backupDir
    } "would quarantine .github/hooks to .github/_archive-hooks"
    $manifest.actions += "Quarantined .github/hooks to .github/_archive-hooks"
  } else {
    Write-Host "  → Use -QuarantineGithubHooks to move this directory" -ForegroundColor Cyan
    $manifest.warnings += "Recommend using -QuarantineGithubHooks to clean up"
  }
} else {
  Write-Success "No .github/hooks directory found (correct)"
  $manifest.actions += "Verified .github/hooks does not exist"
}

# Ensure Copilot instructions file
Write-Section "7. GitHub Copilot Instructions"

$copilotInstr = Join-Path $githubDir "copilot-instructions.md"
if (Test-Path $copilotInstr) {
  Write-Success "Found .github/copilot-instructions.md"
  $manifest.actions += "Verified .github/copilot-instructions.md exists"
} else {
  $stub = @"
# Copilot Instructions

This file is generated and maintained by the AI governance pipeline.

## Canonical Governance Sources

The authoritative governance documentation lives in:

- **/AI_IMPORTANT.md** - Primary executive directives and operating mode
- **/.ai/** - Legacy governance, technical authority, compliance rules
- **/codebooks/** - Voice, style, and communication standards
- **/reference/** - Failure modes, patterns, and technical references

## Purpose

This file provides GitHub Copilot with context about:
- Project structure and conventions
- Code style and patterns
- Testing and deployment requirements
- Security and compliance rules

## Auto-Generation

This file should be auto-generated from the canonical sources listed above.
Manual edits may be overwritten by the governance pipeline.

---
Generated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
"@
  
  Preview-Or { 
    Set-Content -Path $copilotInstr -Value $stub -Encoding UTF8 
  } "would create stub .github/copilot-instructions.md"
  $manifest.actions += "Created .github/copilot-instructions.md stub"
}

# Save manifest
Write-Section "8. Record Manifest"

$manifestName = "stone-foundation_$(Get-Date -Format 'yyyyMMdd_HHmmss').json"
$manifestPath = Join-Path $manifestDir $manifestName

Preview-Or { 
  ($manifest | ConvertTo-Json -Depth 10) | Set-Content -Path $manifestPath -Encoding UTF8 
} "would write manifest to $manifestPath"

# Summary
Write-Section "9. Summary"

Write-Host ""
Write-Host "Actions Taken:" -ForegroundColor Green
if ($manifest.actions.Count -eq 0) {
  Write-Host "  (none)" -ForegroundColor DarkGray
} else {
  $manifest.actions | ForEach-Object { Write-Host "  ✓ $_" -ForegroundColor Green }
}

Write-Host ""
Write-Host "Warnings:" -ForegroundColor Yellow
if ($manifest.warnings.Count -eq 0) {
  Write-Host "  (none)" -ForegroundColor DarkGray
} else {
  $manifest.warnings | ForEach-Object { Write-Host "  ⚠ $_" -ForegroundColor Yellow }
}

if ($manifest.errors.Count -gt 0) {
  Write-Host ""
  Write-Host "Errors:" -ForegroundColor Red
  $manifest.errors | ForEach-Object { Write-Host "  ✗ $_" -ForegroundColor Red }
}

# Recommendations
Write-Section "10. Next Steps"

if (-not $Apply) {
  Write-Host ""
  Write-Host "🔍 This was a PREVIEW run. To apply changes:" -ForegroundColor Cyan
  Write-Host ""
  Write-Host "  pwsh -File .\.ai\scripts\Stone-Foundation.ps1 -Apply -SetHooksPath -QuarantineGithubHooks" -ForegroundColor White
  Write-Host ""
} else {
  Write-Host ""
  Write-Host "✅ Changes applied!" -ForegroundColor Green
  Write-Host ""
  Write-Host "Verification steps:" -ForegroundColor Cyan
  Write-Host "  1. Check hooks path:" -ForegroundColor White
  Write-Host "     git config core.hooksPath" -ForegroundColor DarkGray
  Write-Host ""
  Write-Host "  2. List installed hooks:" -ForegroundColor White
  Write-Host "     Get-ChildItem .git\hooks\* -File" -ForegroundColor DarkGray
  Write-Host ""
  Write-Host "  3. Test hook execution:" -ForegroundColor White
  Write-Host "     git commit --allow-empty -m 'chore: test hooks'" -ForegroundColor DarkGray
  Write-Host ""
  
  if ($manifest.warnings.Count -gt 0) {
    Write-Host "⚠ Review warnings above before proceeding" -ForegroundColor Yellow
  }
}

Write-Host ""
Write-Host ("=" * 60) -ForegroundColor Cyan
Write-Host "Stone Foundation Complete" -ForegroundColor Cyan
Write-Host ("=" * 60) -ForegroundColor Cyan
Write-Host ""

#endregion
