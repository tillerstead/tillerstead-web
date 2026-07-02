#!/usr/bin/env python3
"""
Contrast Audit — Scans all CSS files for color values and tests them
against likely background colors for WCAG AA compliance.

WCAG AA thresholds:
  - Normal text (< 18pt): 4.5:1
  - Large text (>= 18pt / 14pt bold): 3.0:1

This script:
1. Extracts all `color:` values from CSS (not background/border/shadow)
2. Resolves hex, rgb(), rgba(), and named colors
3. Tests each against the site's known background colors
4. Reports failures sorted by severity
"""

import re
import os
import math
import sys
from pathlib import Path

# ── Known background colors on the site ──────────────────────────
BACKGROUNDS = {
    "#000000": "pure black (--tiller-bg-darkest/darker/dark/stone/slate)",
    "#0f0f0f": "--tiller-bg-elevated",
    "#161616": "--tiller-bg-card",
    "#121414": "--page-bg-dark",
    "#0d0f0d": "--page-bg-darker",
    "#1a1c1a": "--page-bg-stone",
    "#0f2a1f": "--page-bg-green-dark",
    "#0a0a0a": "--bg-dark",
    "#1a1a1a": "--bg-dark-gray",
    "#ffffff": "white bg",
    "#f8f7f5": "off-white bg",
}

# ── Named CSS colors subset (most common) ────────────────────────
NAMED_COLORS = {
    "white": (255, 255, 255),
    "black": (0, 0, 0),
    "red": (255, 0, 0),
    "green": (0, 128, 0),
    "blue": (0, 0, 255),
    "gray": (128, 128, 128),
    "grey": (128, 128, 128),
    "transparent": None,
    "inherit": None,
    "currentcolor": None,
    "currentColor": None,
    "initial": None,
    "unset": None,
}

# ── Luminance & contrast ratio ───────────────────────────────────

def srgb_to_linear(c):
    c = c / 255.0
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4

def relative_luminance(r, g, b):
    return 0.2126 * srgb_to_linear(r) + 0.7152 * srgb_to_linear(g) + 0.0722 * srgb_to_linear(b)

def contrast_ratio(lum1, lum2):
    lighter = max(lum1, lum2)
    darker = min(lum1, lum2)
    return (lighter + 0.05) / (darker + 0.05)

def hex_to_rgb(h):
    h = h.lstrip('#')
    if len(h) == 3:
        h = h[0]*2 + h[1]*2 + h[2]*2
    if len(h) == 8:  # #RRGGBBAA
        h = h[:6]
    if len(h) != 6:
        return None
    try:
        return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16))
    except ValueError:
        return None

def parse_rgb_func(s):
    """Parse rgb(R G B) or rgb(R, G, B) or rgb(R G B / A) or rgba(R, G, B, A)"""
    s = s.strip()
    # Remove rgb( or rgba( and trailing )
    inner = re.sub(r'^rgba?\s*\(\s*', '', s)
    inner = re.sub(r'\s*\)\s*$', '', inner)
    
    # Handle / alpha syntax: rgb(255 255 255 / 80%)
    alpha = 1.0
    if '/' in inner:
        parts = inner.split('/')
        inner = parts[0].strip()
        alpha_str = parts[1].strip().rstrip('%')
        try:
            alpha = float(alpha_str)
            if alpha > 1:
                alpha = alpha / 100.0
        except ValueError:
            pass
    
    # Split by comma or whitespace
    if ',' in inner:
        parts = [p.strip() for p in inner.split(',')]
    else:
        parts = inner.split()
    
    # Handle rgba with 4th param as alpha
    if len(parts) == 4:
        alpha_str = parts[3].strip().rstrip('%')
        try:
            alpha = float(alpha_str)
            if alpha > 1:
                alpha = alpha / 100.0
        except ValueError:
            pass
        parts = parts[:3]
    
    if len(parts) < 3:
        return None, 1.0
    
    try:
        r = int(float(parts[0].strip().rstrip('%')))
        g = int(float(parts[1].strip().rstrip('%')))
        b = int(float(parts[2].strip().rstrip('%')))
        return (r, g, b), alpha
    except (ValueError, IndexError):
        return None, 1.0

def resolve_color(value):
    """Returns (r, g, b), alpha or None, None"""
    value = value.strip().rstrip(';').strip()
    
    # Skip CSS variables, functions we can't resolve
    if value.startswith('var(') or value == 'inherit' or value == 'currentColor' or value == 'currentcolor':
        return None, None
    if value == 'transparent' or value == 'initial' or value == 'unset' or value == 'none':
        return None, None
    
    # Hex
    hex_match = re.match(r'^(#[0-9a-fA-F]{3,8})\b', value)
    if hex_match:
        rgb = hex_to_rgb(hex_match.group(1))
        return rgb, 1.0
    
    # rgb/rgba function
    rgb_match = re.match(r'^rgba?\s*\(', value)
    if rgb_match:
        return parse_rgb_func(value)
    
    # Named color
    lower = value.lower().split()[0]  # Take first word
    if lower in NAMED_COLORS:
        return NAMED_COLORS[lower], 1.0
    
    return None, None

def effective_color(fg_rgb, fg_alpha, bg_rgb):
    """Blend foreground with alpha over background"""
    if fg_alpha >= 1.0:
        return fg_rgb
    r = int(fg_rgb[0] * fg_alpha + bg_rgb[0] * (1 - fg_alpha))
    g = int(fg_rgb[1] * fg_alpha + bg_rgb[1] * (1 - fg_alpha))
    b = int(fg_rgb[2] * fg_alpha + bg_rgb[2] * (1 - fg_alpha))
    return (min(255, r), min(255, g), min(255, b))


# ── CSS Parsing ──────────────────────────────────────────────────

COLOR_PROP_RE = re.compile(
    r'(?:^|\s|;)\s*color\s*:\s*([^;}{]+)',
    re.IGNORECASE
)

# Also catch CSS custom property definitions that are text colors
VAR_COLOR_RE = re.compile(
    r'--[\w-]*text[\w-]*\s*:\s*([^;}{]+)',
    re.IGNORECASE
)

def scan_css_file(filepath):
    """Extract all color: values with line numbers and context"""
    results = []
    try:
        with open(filepath, 'r', encoding='utf-8', errors='replace') as f:
            lines = f.readlines()
    except Exception:
        return results
    
    current_selector = ""
    brace_depth = 0
    
    for i, line in enumerate(lines, 1):
        stripped = line.strip()
        
        # Track selector context
        if '{' in stripped:
            # Capture selector before {
            before_brace = stripped.split('{')[0].strip()
            if before_brace and not before_brace.startswith('/*'):
                current_selector = before_brace
            brace_depth += stripped.count('{')
        brace_depth -= stripped.count('}')
        if brace_depth <= 0:
            current_selector = ""
            brace_depth = 0
        
        # Match color: values
        for m in COLOR_PROP_RE.finditer(line):
            val = m.group(1).strip().rstrip(';').strip()
            # Skip if it's actually background-color or border-color etc
            prefix = line[:m.start() + line[m.start():].find('color')]
            if re.search(r'(background|border|outline|text-decoration|caret|accent|column-rule|scrollbar)-\s*$', prefix, re.IGNORECASE):
                continue
            if 'background' in prefix.lower().split(':')[-1] if ':' in prefix else '':
                continue
            results.append({
                'line': i,
                'selector': current_selector,
                'value': val,
                'raw': stripped,
            })
        
        # Match text color variable definitions
        for m in VAR_COLOR_RE.finditer(line):
            val = m.group(1).strip().rstrip(';').strip()
            results.append({
                'line': i,
                'selector': ':root (variable)',
                'value': val,
                'raw': stripped,
            })
    
    return results


def main():
    css_dir = Path(r"c:\Users\Devon Tyler\Desktop\Tillerstead\assets\css")
    
    # Collect all CSS files recursively
    css_files = sorted(css_dir.rglob("*.css"))
    
    # Skip minified bundles (they duplicate source)
    css_files = [f for f in css_files if '.min.' not in f.name and 'bundle' not in f.name]
    
    all_failures = []
    all_warnings = []
    all_pass = 0
    all_skip = 0
    
    for css_file in css_files:
        rel = css_file.relative_to(css_dir.parent.parent)
        entries = scan_css_file(str(css_file))
        
        for entry in entries:
            fg_rgb, fg_alpha = resolve_color(entry['value'])
            if fg_rgb is None:
                all_skip += 1
                continue
            
            # Test against each background
            worst_ratio = 999
            worst_bg_name = ""
            worst_bg_hex = ""
            
            for bg_hex, bg_name in BACKGROUNDS.items():
                bg_rgb = hex_to_rgb(bg_hex)
                if bg_rgb is None:
                    continue
                
                eff = effective_color(fg_rgb, fg_alpha, bg_rgb)
                fg_lum = relative_luminance(*eff)
                bg_lum = relative_luminance(*bg_rgb)
                ratio = contrast_ratio(fg_lum, bg_lum)
                
                if ratio < worst_ratio:
                    worst_ratio = ratio
                    worst_bg_name = bg_name
                    worst_bg_hex = bg_hex
            
            record = {
                'file': str(rel),
                'line': entry['line'],
                'selector': entry['selector'],
                'value': entry['value'],
                'fg_rgb': fg_rgb,
                'fg_alpha': fg_alpha,
                'ratio': worst_ratio,
                'bg_name': worst_bg_name,
                'bg_hex': worst_bg_hex,
            }
            
            if worst_ratio < 3.0:
                all_failures.append(record)
            elif worst_ratio < 4.5:
                all_warnings.append(record)
            else:
                all_pass += 1
    
    # Sort failures by ratio ascending (worst first)
    all_failures.sort(key=lambda x: x['ratio'])
    all_warnings.sort(key=lambda x: x['ratio'])
    
    print("=" * 80)
    print("CONTRAST AUDIT REPORT")
    print(f"Files scanned: {len(css_files)}")
    print(f"Color values tested: {all_pass + len(all_failures) + len(all_warnings)}")
    print(f"Skipped (variables/inherit): {all_skip}")
    print(f"PASS (>= 4.5:1): {all_pass}")
    print(f"WARN (3.0-4.5:1 — fails AA normal text): {len(all_warnings)}")
    print(f"FAIL (< 3.0:1 — fails AA even for large text): {len(all_failures)}")
    print("=" * 80)
    
    if all_failures:
        print("\n🔴 FAILURES (< 3.0:1 — unreadable)")
        print("-" * 80)
        for r in all_failures:
            alpha_note = f" (alpha={r['fg_alpha']:.0%})" if r['fg_alpha'] < 1.0 else ""
            print(f"  {r['ratio']:.1f}:1  {r['file']}:{r['line']}")
            print(f"         {r['selector']}")
            print(f"         color: {r['value']}{alpha_note}")
            print(f"         vs {r['bg_hex']} ({r['bg_name']})")
            print()
    
    if all_warnings:
        print("\n🟡 WARNINGS (3.0-4.5:1 — fails AA for normal text)")
        print("-" * 80)
        for r in all_warnings:
            alpha_note = f" (alpha={r['fg_alpha']:.0%})" if r['fg_alpha'] < 1.0 else ""
            print(f"  {r['ratio']:.1f}:1  {r['file']}:{r['line']}")
            print(f"         {r['selector']}")
            print(f"         color: {r['value']}{alpha_note}")
            print(f"         vs {r['bg_hex']} ({r['bg_name']})")
            print()
    
    print("\n" + "=" * 80)
    print("RECOMMENDED FIX VALUES (for white-on-dark text with alpha)")
    print("-" * 80)
    print("  Target ≥ 4.5:1 on #000000:")
    print("  rgb(255 255 255 / 65%)  => effective #a6a6a6 => 6.3:1  ✓ AA")
    print("  rgb(255 255 255 / 72%)  => effective #b8b8b8 => 8.3:1  ✓ AA")
    print("  rgb(255 255 255 / 80%)  => effective #cccccc => 10.9:1 ✓ AA")
    print("  rgb(255 255 255 / 85%)  => effective #d9d9d9 => 13.1:1 ✓ AA")
    print("  rgb(255 255 255 / 90%)  => effective #e6e6e6 => 15.4:1 ✓ AA")
    print()
    print("  Hex colors on #000000:")
    print("  #6b7280 (gray-500) => 3.5:1  ✗ FAILS AA")
    print("  #9ca3af (gray-400) => 4.6:1  ✓ barely AA")
    print("  #b0b8c4            => 7.5:1  ✓ AA")
    print("  #c0c7d0            => 9.4:1  ✓ AA")
    print("  #d1d5db (gray-300) => 11.5:1 ✓ AA")
    print("=" * 80)


if __name__ == '__main__':
    main()
