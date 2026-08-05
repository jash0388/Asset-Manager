import pandas as pd
import glob
import os

files = ["SPHN_ Hostel Data.xlsx", "SPHN_Hostel Data1.xlsx"]
for f in files:
    full_path = os.path.join("/Users/jashwanthsingh/Documents/New project/Asset-Manager", f)
    if os.path.exists(full_path):
        print(f"\n=== File: {f} ===")
        xl = pd.ExcelFile(full_path)
        print("Sheets:", xl.sheet_names)
        for name in xl.sheet_names:
            df = xl.parse(name)
            print(f"Sheet '{name}' columns: {list(df.columns)}")
            print("All rows:")
            pd.set_option('display.max_rows', None)
            pd.set_option('display.max_columns', None)
            pd.set_option('display.width', 1000)
            print(df)
            print("Total rows:", len(df))
