#!/usr/bin/env python3
"""Dark-to-light theme migration for all dashboard files."""
import re, os, glob

BASE = "/Users/jashwanthsingh/Documents/New project/Asset-Manager/artifacts/qr-attendance/src"

files = [
    f"{BASE}/components/Layout.tsx",
    f"{BASE}/pages/HodDashboard.tsx",
    f"{BASE}/pages/HourlyAttendance.tsx",
    f"{BASE}/pages/InchargeDashboard.tsx",
    f"{BASE}/pages/PrincipalDashboard.tsx",
    f"{BASE}/pages/Dashboard.tsx",
    f"{BASE}/pages/Login.tsx",
    f"{BASE}/pages/MentorApp.tsx",
    f"{BASE}/pages/Attendance.tsx",
    f"{BASE}/pages/History.tsx",
    f"{BASE}/pages/Mentors.tsx",
    f"{BASE}/pages/Users.tsx",
    f"{BASE}/pages/Scanner.tsx",
]

# Order matters — most specific first to avoid double replacements
REPLACEMENTS = [
    # ---- BACKGROUNDS (dark → light) ----
    ("bg-slate-950",         "bg-gray-50"),
    ("bg-slate-900/50",      "bg-white"),
    ("bg-slate-900/60",      "bg-white"),
    ("bg-slate-900",         "bg-white"),
    ("bg-slate-855",         "bg-gray-50"),
    ("bg-slate-850",         "bg-gray-50"),
    ("bg-slate-800/20",      "bg-gray-50"),
    ("bg-slate-800/30",      "bg-gray-50"),
    ("bg-slate-800/50",      "bg-gray-100"),
    ("bg-slate-800/60",      "bg-gray-100"),
    ("bg-slate-800/80",      "bg-gray-100"),
    ("bg-slate-800",         "bg-gray-100"),
    ("bg-slate-700",         "bg-gray-200"),
    ("bg-slate-600",         "bg-gray-300"),

    # ---- HOVER BACKGROUNDS ----
    ("hover:bg-slate-950",   "hover:bg-gray-100"),
    ("hover:bg-slate-900",   "hover:bg-gray-50"),
    ("hover:bg-slate-800/30","hover:bg-gray-100"),
    ("hover:bg-slate-800",   "hover:bg-gray-100"),
    ("hover:bg-slate-700",   "hover:bg-gray-200"),

    # ---- BORDERS ----
    ("border-slate-950",     "border-gray-200"),
    ("border-slate-900",     "border-gray-200"),
    ("border-slate-855",     "border-gray-200"),
    ("border-slate-850",     "border-gray-200"),
    ("border-slate-800/80",  "border-gray-200"),
    ("border-slate-800/50",  "border-gray-200"),
    ("border-slate-800",     "border-gray-200"),
    ("border-slate-700/60",  "border-gray-200"),
    ("border-slate-700/50",  "border-gray-200"),
    ("border-slate-700/30",  "border-gray-200"),
    ("border-slate-700",     "border-gray-300"),
    ("border-b-slate-800",   "border-b-gray-200"),
    ("border-t-slate-800",   "border-t-gray-200"),
    ("border-l-slate-800",   "border-l-gray-200"),
    ("hover:border-slate-700","hover:border-gray-300"),

    # ---- TEXT (light slate → dark gray for light bg) ----
    ("text-slate-100",       "text-gray-900"),
    ("text-slate-200",       "text-gray-800"),
    ("text-slate-300",       "text-gray-700"),
    ("text-slate-350",       "text-gray-600"),
    ("text-slate-400",       "text-gray-500"),
    ("text-slate-450",       "text-gray-400"),
    ("text-slate-500",       "text-gray-400"),
    ("hover:text-slate-100", "hover:text-gray-900"),
    ("hover:text-slate-200", "hover:text-gray-800"),

    # ---- PLACEHOLDER ----
    ("placeholder-slate-700","placeholder-gray-400"),
    ("placeholder-slate-600","placeholder-gray-400"),
    ("placeholder-slate-500","placeholder-gray-400"),

    # ---- DIVIDE ----
    ("divide-slate-800",     "divide-gray-200"),
    ("divide-slate-700",     "divide-gray-200"),

    # ---- RING / SHADOW ----
    ("ring-slate-800",       "ring-gray-200"),
    ("shadow-slate-900",     "shadow-gray-200"),
]

for filepath in files:
    if not os.path.exists(filepath):
        print(f"SKIP (not found): {filepath}")
        continue

    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    original = content
    for old, new in REPLACEMENTS:
        content = content.replace(old, new)

    if content != original:
        count = sum(original.count(old) for old, _ in REPLACEMENTS)
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"✅ Updated: {os.path.basename(filepath)}")
    else:
        print(f"⬜ No changes: {os.path.basename(filepath)}")

print("\nDone!")
