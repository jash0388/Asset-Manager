import pandas as pd
import os

files = [
    "/Users/jashwanthsingh/Downloads/Individual Faculty  Time Table -26-27.xlsx",
    "/Users/jashwanthsingh/Downloads/A.Y-26-27 SEM-I CLASS INCHARGES NAMES.xlsx",
    "/Users/jashwanthsingh/Downloads/MENTOR BOOK FACULTY LIST-26-27.xlsx"
]

for f in files:
    if os.path.exists(f):
        print(f"\n=== File: {os.path.basename(f)} ===")
        xl = pd.ExcelFile(f)
        print("Sheets:", xl.sheet_names)
        for name in xl.sheet_names[:3]:  # Print first 3 sheets
            df = xl.parse(name)
            print(f"Sheet '{name}' columns: {list(df.columns)}")
            print("First 5 rows:")
            print(df.head(5))
            print("Total rows:", len(df))
