#!/usr/bin/env python3
"""Fix light text on light backgrounds — all the text-white and light colored text on now-white cards."""
import os, glob

BASE = "/Users/jashwanthsingh/Documents/New project/Asset-Manager/artifacts/qr-attendance/src"

files = [
    f"{BASE}/pages/PrincipalDashboard.tsx",
    f"{BASE}/pages/HodDashboard.tsx",
    f"{BASE}/pages/HourlyAttendance.tsx",
    f"{BASE}/pages/InchargeDashboard.tsx",
    f"{BASE}/pages/MentorApp.tsx",
    f"{BASE}/pages/Attendance.tsx",
    f"{BASE}/pages/History.tsx",
    f"{BASE}/pages/Mentors.tsx",
    f"{BASE}/pages/Users.tsx",
    f"{BASE}/pages/Scanner.tsx",
    f"{BASE}/pages/Dashboard.tsx",
    f"{BASE}/pages/Login.tsx",
]

REPLACEMENTS = [
    # === STAT CARD TEXT — light text on now-light backgrounds ===
    # White text → dark text
    ("text-2xl font-black text-white", "text-2xl font-black text-gray-900"),
    ("text-3xl font-black text-white", "text-3xl font-black text-gray-900"),
    ("text-xl font-black text-white", "text-xl font-black text-gray-900"),
    ("text-lg font-black text-white", "text-lg font-black text-gray-900"),
    ("font-mono text-base font-black text-white", "font-mono text-base font-black text-gray-900"),
    ("text-base font-black text-white", "text-base font-black text-gray-900"),
    
    # Colored light text → darker versions (was designed for dark cards)
    ("text-emerald-300", "text-emerald-700"),
    ("text-rose-300", "text-rose-700"),
    ("text-blue-300", "text-blue-700"),
    ("text-amber-300", "text-amber-700"),
    ("text-purple-300", "text-purple-700"),
    ("text-indigo-300", "text-indigo-700"),
    ("text-cyan-300", "text-cyan-700"),
    ("text-orange-300", "text-orange-700"),
    ("text-pink-300", "text-pink-700"),
    ("text-violet-300", "text-violet-700"),
    ("text-teal-300", "text-teal-700"),
    ("text-green-300", "text-green-700"),
    ("text-red-300", "text-red-700"),
    ("text-yellow-300", "text-yellow-700"),
    
    ("text-emerald-400", "text-emerald-700"),
    ("text-rose-400", "text-rose-700"),
    ("text-blue-400", "text-blue-700"),
    ("text-amber-400", "text-amber-700"),
    ("text-purple-400", "text-purple-700"),
    ("text-indigo-400", "text-indigo-700"),
    ("text-cyan-400", "text-cyan-700"),
    ("text-orange-400", "text-orange-700"),
    ("text-teal-400", "text-teal-700"),
    ("text-green-400", "text-green-700"),
    ("text-red-400", "text-red-700"),
    ("text-yellow-400", "text-yellow-700"),
    
    # Heading text-white → dark (non-button)
    ("text-base font-bold text-white", "text-base font-bold text-gray-900"),
    ("text-lg font-bold text-white", "text-lg font-bold text-gray-900"),
    ("text-xl font-bold text-white", "text-xl font-bold text-gray-900"),
    ("text-2xl font-bold text-white", "text-2xl font-bold text-gray-900"),
    ("text-2xl sm:text-3xl font-black text-white", "text-2xl sm:text-3xl font-black text-gray-900"),
    ("text-sm font-bold text-white", "text-sm font-bold text-gray-900"),
    ("text-xs font-bold text-white", "text-xs font-bold text-gray-900"),
    ("font-bold text-white", "font-bold text-gray-900"),
    ("font-black text-white", "font-black text-gray-900"),
    ("font-semibold text-white", "font-semibold text-gray-900"),
    
    # Hover text-white on light backgrounds → dark
    ("group-hover:text-white", "group-hover:text-blue-600"),
    ("hover:text-white", "hover:text-gray-900"),
    
    # Border light colors → slightly more visible
    ("border-emerald-500/20", "border-emerald-200"),
    ("border-rose-500/20", "border-rose-200"),
    ("border-blue-500/20", "border-blue-200"),
    ("border-amber-500/20", "border-amber-200"),
    ("border-purple-500/20", "border-purple-200"),
    
    # bg opacity variants on KPI cards → solid light versions  
    ("bg-emerald-500/10", "bg-emerald-50"),
    ("bg-rose-500/10", "bg-rose-50"),
    ("bg-blue-500/10", "bg-blue-50"),
    ("bg-amber-500/10", "bg-amber-50"),
    ("bg-purple-500/10", "bg-purple-50"),
    ("bg-indigo-500/10", "bg-indigo-50"),
    ("bg-emerald-500/20", "bg-emerald-100"),
    ("bg-rose-500/20", "bg-rose-100"),
    ("bg-blue-500/20", "bg-blue-100"),
    ("bg-emerald-400/10", "bg-emerald-50"),
    ("bg-rose-400/10", "bg-rose-50"),
    ("bg-blue-400/10", "bg-blue-50"),
    ("bg-red-500/10", "bg-red-50"),
    ("bg-red-500/20", "bg-red-100"),
    ("bg-yellow-500/10", "bg-yellow-50"),
    ("bg-green-500/10", "bg-green-50"),
    
    # Remaining placeholder visibility
    ("placeholder-gray-400", "placeholder-gray-400"),  # already correct, skip
    
    # Attendance grid dark day cells 
    ("bg-gray-200 text-gray-800 border border-gray-300", "bg-gray-100 text-gray-700 border border-gray-300"),
    ("bg-gray-300 text-gray-800", "bg-gray-200 text-gray-800"),
    
    # Section badge on student analytics — was white text
    ("text-gray-200 font-mono", "text-gray-700 font-mono"),
    
    # Detailed logs status pill
    ("bg-gray-100 text-gray-500 border border-gray-200", "bg-gray-100 text-gray-600 border border-gray-200"),
    
    # HOD schedule page "Pending" pill
    ("Pending", "Pending"),  # skip — let's find context

    # SheetContent text fix
    ("text-gray-800 overflow-y-auto", "text-gray-900 overflow-y-auto"),
    
    # Red flag analytics light text
    ("text-red-300", "text-red-700"),
    ("text-yellow-300", "text-yellow-700"),
    ("text-green-300", "text-green-700"),
]

for filepath in files:
    if not os.path.exists(filepath):
        continue
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
    original = content
    for old, new in REPLACEMENTS:
        if old != new:  # skip no-op
            content = content.replace(old, new)
    if content != original:
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"✅ Fixed: {os.path.basename(filepath)}")
    else:
        print(f"⬜ No changes: {os.path.basename(filepath)}")

print("\nDone!")
