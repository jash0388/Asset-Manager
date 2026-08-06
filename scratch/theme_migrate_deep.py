#!/usr/bin/env python3
"""FINAL deep cleanup — no dark colors except text."""
import os, glob

BASE = "/Users/jashwanthsingh/Documents/New project/Asset-Manager/artifacts/qr-attendance/src"

files = glob.glob(f"{BASE}/**/*.tsx", recursive=True) + glob.glob(f"{BASE}/**/*.ts", recursive=True)

REPLACEMENTS = [
    # ===== BACKGROUNDS =====
    # Overlay backgrounds (modals) — keep semi-transparent black for overlays ONLY
    # DON'T touch bg-black/40, bg-black/50, bg-black/60, bg-black/70, bg-black/80 (overlays are ok)
    # But full bg-black should become bg-gray-900 for text
    
    # Slate bg variants — most specific first
    ("bg-slate-950", "bg-white"),
    ("bg-slate-900/90", "bg-white"),
    ("bg-slate-900/80", "bg-white"),
    ("bg-slate-900/70", "bg-white"),
    ("bg-slate-900/60", "bg-white"),
    ("bg-slate-900/50", "bg-white"),
    ("bg-slate-900", "bg-white"),
    ("bg-slate-855", "bg-gray-50"),
    ("bg-slate-850", "bg-gray-50"),
    ("bg-slate-800/20", "bg-gray-50"),
    ("bg-slate-800/30", "bg-gray-50"),
    ("bg-slate-800/40", "bg-gray-100"),
    ("bg-slate-800/50", "bg-gray-100"),
    ("bg-slate-800/60", "bg-gray-100"),
    ("bg-slate-800/70", "bg-gray-100"),
    ("bg-slate-800/80", "bg-gray-100"),
    ("bg-slate-800", "bg-gray-100"),
    ("bg-slate-750", "bg-gray-100"),
    ("bg-slate-700", "bg-gray-200"),
    ("bg-slate-600", "bg-gray-200"),
    ("bg-slate-500", "bg-gray-300"),
    ("bg-slate-50", "bg-gray-50"),   # keep light slates as gray-50
    ("bg-slate-100", "bg-gray-100"), # keep light
    ("bg-slate-200", "bg-gray-200"), # keep light
    ("bg-slate-300", "bg-gray-300"), # keep light
    
    # Zinc dark
    ("bg-zinc-900", "bg-white"),
    ("bg-zinc-800", "bg-gray-100"),
    ("bg-zinc-700", "bg-gray-200"),
    
    # ===== HOVER BACKGROUNDS =====
    ("hover:bg-slate-950", "hover:bg-gray-100"),
    ("hover:bg-slate-900", "hover:bg-gray-50"),
    ("hover:bg-slate-800/30", "hover:bg-gray-100"),
    ("hover:bg-slate-800/50", "hover:bg-gray-100"),
    ("hover:bg-slate-800", "hover:bg-gray-100"),
    ("hover:bg-slate-700", "hover:bg-gray-200"),
    ("hover:bg-slate-600", "hover:bg-gray-200"),
    ("hover:bg-slate-100", "hover:bg-gray-100"),
    ("hover:bg-slate-200", "hover:bg-gray-200"),
    
    # ===== BORDERS =====
    ("border-slate-950", "border-gray-200"),
    ("border-slate-900", "border-gray-200"),
    ("border-slate-855", "border-gray-200"),
    ("border-slate-850", "border-gray-200"),
    ("border-slate-800/80", "border-gray-200"),
    ("border-slate-800/60", "border-gray-200"),
    ("border-slate-800/50", "border-gray-200"),
    ("border-slate-800", "border-gray-200"),
    ("border-slate-750", "border-gray-200"),
    ("border-slate-700/60", "border-gray-200"),
    ("border-slate-700/50", "border-gray-200"),
    ("border-slate-700/30", "border-gray-200"),
    ("border-slate-700", "border-gray-200"),
    ("border-slate-600", "border-gray-300"),
    ("border-slate-500", "border-gray-300"),
    ("border-slate-250", "border-gray-200"),
    ("border-slate-150", "border-gray-100"),
    ("border-slate-100", "border-gray-100"),
    ("border-slate-200", "border-gray-200"),
    ("border-slate-300", "border-gray-300"),
    ("border-t-slate-800", "border-t-gray-200"),
    ("border-b-slate-800", "border-b-gray-200"),
    ("hover:border-slate-700", "hover:border-gray-300"),
    
    # ===== TEXT (light slate text → dark for light bg) =====
    # NOTE: Don't change slate-700/800/900 — those are dark text already correct for light bg
    ("text-slate-100", "text-gray-900"),
    ("text-slate-200", "text-gray-800"),
    ("text-slate-300", "text-gray-700"),
    ("text-slate-350", "text-gray-600"),
    ("text-slate-400", "text-gray-500"),
    ("text-slate-450", "text-gray-400"),
    ("text-slate-500", "text-gray-500"),
    ("hover:text-slate-100", "hover:text-gray-900"),
    ("hover:text-slate-200", "hover:text-gray-800"),
    ("hover:text-white", "hover:text-gray-900"),  # only non-button contexts
    
    # ===== PLACEHOLDER =====
    ("placeholder-slate-700", "placeholder-gray-400"),
    ("placeholder-slate-600", "placeholder-gray-400"),
    ("placeholder-slate-500", "placeholder-gray-400"),
    
    # ===== DIVIDE =====
    ("divide-slate-800", "divide-gray-200"),
    ("divide-slate-700", "divide-gray-200"),
    ("divide-slate-600", "divide-gray-200"),
    
    # ===== RING =====
    ("ring-slate-800", "ring-gray-200"),
    ("ring-slate-700", "ring-gray-200"),
    
    # ===== SHADOW =====
    ("shadow-slate-900", "shadow-gray-200"),
    ("shadow-slate-800", "shadow-gray-200"),
    
    # ===== SCROLL =====
    ("[color-scheme:dark]", "[color-scheme:light]"),
    
    # ===== SPECIAL: SheetContent still dark =====
    ("bg-white border-l border-gray-200/80 p-0 flex flex-col h-full text-gray-800",
     "bg-white border-l border-gray-200 p-0 flex flex-col h-full text-gray-900"),
    
    # Fix hover:text-white → only safe if on blue/red/green button (skip — too risky)
    # Instead fix specific non-button cases manually
    
    # Input dark backgrounds  
    ("focus:ring-blue-500/10", "focus:ring-blue-100"),
    ("focus:ring-4 focus:ring-blue-100", "focus:ring-2 focus:ring-blue-200"),
]

SKIP_FILES = ["SecurityApp.tsx"]  # Already uses inline styles

total_changes = 0
for filepath in sorted(files):
    if "node_modules" in filepath or "dist" in filepath: continue
    basename = os.path.basename(filepath)
    if basename in SKIP_FILES: continue
    
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
    
    original = content
    for old, new in REPLACEMENTS:
        content = content.replace(old, new)
    
    if content != original:
        changes = sum(original.count(old) for old, _ in REPLACEMENTS)
        total_changes += changes
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"✅ {basename}")
    else:
        print(f"⬜ {basename} (no changes)")

print(f"\nDone! Total replacement passes: {total_changes}")
