import pandas as pd
import os
import requests
import json

# Setup Supabase client or run locally
# Let us read the database students and compare with excel sheets.

from supabase import create_client, Client
import dotenv
dotenv.load_dotenv(dotenv_path="/Users/jashwanthsingh/Documents/New project/Asset-Manager/.env.production.local")

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(url, key)

def get_db_students():
    res = supabase.from_("qr_users").select("*").eq("role", "student").execute()
    return res.data

def read_excel_students():
    # File 1: SPHN_ Hostel Data.xlsx (3rd Year students in AY 2026-27, roll numbers starting with 24N81A)
    # File 2: SPHN_Hostel Data1.xlsx (2nd Year students in AY 2026-27, roll numbers starting with 25N81A)
    f1 = "/Users/jashwanthsingh/Documents/New project/Asset-Manager/SPHN_ Hostel Data.xlsx"
    f2 = "/Users/jashwanthsingh/Documents/New project/Asset-Manager/SPHN_Hostel Data1.xlsx"
    
    excel_students = []
    
    # Read f1
    df1 = pd.read_excel(f1, header=None)
    # The header has title, columns are on row index 0. Row 0: S.NO, ROLL NO, NAME, YEAR
    # Data starts from row index 1
    for idx, row in df1.iterrows():
        if idx == 0:
            continue
        vals = list(row.values)
        if len(vals) < 3:
            continue
        roll = str(vals[1]).strip().upper()
        name = str(vals[2]).strip().upper()
        if roll and roll != "NAN" and len(roll) == 10:
            excel_students.append({
                "roll": roll,
                "name": name,
                "source": "Hostel Data (3rd Year)",
                "expected_year": "III"
            })
            
    # Read f2
    df2 = pd.read_excel(f2, sheet_name="Sheet1", header=None)
    # Row 0: 'ROLL_NO', 'STUDENT NAME'
    # Data starts from row index 1
    for idx, row in df2.iterrows():
        if idx == 0:
            continue
        vals = list(row.values)
        if len(vals) < 2:
            continue
        roll = str(vals[0]).strip().upper()
        name = str(vals[1]).strip().upper()
        if roll and roll != "NAN" and len(roll) == 10:
            excel_students.append({
                "roll": roll,
                "name": name,
                "source": "Hostel Data1 (2nd Year)",
                "expected_year": "II"
            })
            
    return excel_students

def compare():
    db = get_db_students()
    ex = read_excel_students()
    
    db_map = {s["unique_id"].strip().upper(): s for s in db}
    
    print(f"Total students in DB: {len(db)}")
    print(f"Total students in Excel files: {len(ex)}")
    
    missing_in_db = []
    different_section = []
    
    for s in ex:
        roll = s["roll"]
        if roll not in db_map:
            missing_in_db.append(s)
        else:
            db_s = db_map[roll]
            # Check if year in db_s["section"] matches expected_year
            # e.g. section is "DS III/I/A", expected_year is "III"
            db_section = db_s.get("section") or ""
            expected_year = s["expected_year"]
            if expected_year == "III" and "III" not in db_section:
                different_section.append((s, db_s))
            elif expected_year == "II" and "II" not in db_section:
                different_section.append((s, db_s))
                
    print(f"\nMissing in DB: {len(missing_in_db)}")
    for m in missing_in_db[:10]:
        print(m)
        
    print(f"\nDifferent Year/Section: {len(different_section)}")
    for ex_s, db_s in different_section[:10]:
        print(f"Excel: {ex_s['roll']} ({ex_s['expected_year']}) vs DB Section: {db_s['section']}")

if __name__ == "__main__":
    compare()
