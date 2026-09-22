"""
Import cumulative attendance from Excel files into Supabase.
This script:
1. Creates the qr_cumulative_attendance table if it doesn't exist
2. Parses all 3 Excel files (2nd, 3rd, 4th year)
3. Maps hall ticket numbers to user IDs in qr_users
4. Inserts/upserts subject-wise attendance data
NEVER deletes any data — only adds.
"""
import openpyxl
import json
from supabase import create_client

SUPABASE_URL = 'https://fothvpivwytaibkdhkci.supabase.co'
SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZvdGh2cGl2d3l0YWlia2Roa2NpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzQ4NjE1NSwiZXhwIjoyMDk5MDYyMTU1fQ.4Zd8L5qYLHtV7T0SHe4r5wa8woX13Q1Km1foWr9zzUU'

sb = create_client(SUPABASE_URL, SUPABASE_KEY)

# Step 1: Create the table via SQL
print("Step 1: Creating qr_cumulative_attendance table (if not exists)...")
create_table_sql = """
CREATE TABLE IF NOT EXISTS qr_cumulative_attendance (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES qr_users(id) ON DELETE CASCADE,
    hall_ticket TEXT NOT NULL,
    year TEXT NOT NULL,
    section TEXT NOT NULL,
    semester TEXT NOT NULL DEFAULT 'I',
    period_from TEXT DEFAULT '2026-07-06',
    period_to TEXT DEFAULT '2026-09-15',
    subject TEXT NOT NULL,
    classes_conducted INTEGER NOT NULL DEFAULT 0,
    classes_attended INTEGER NOT NULL DEFAULT 0,
    attendance_percentage NUMERIC(5,2) DEFAULT 0,
    total_classes_conducted INTEGER DEFAULT 0,
    total_classes_attended INTEGER DEFAULT 0,
    overall_percentage NUMERIC(5,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, subject, period_from, period_to)
);

CREATE INDEX IF NOT EXISTS idx_cumul_user_id ON qr_cumulative_attendance(user_id);
CREATE INDEX IF NOT EXISTS idx_cumul_hall_ticket ON qr_cumulative_attendance(hall_ticket);
CREATE INDEX IF NOT EXISTS idx_cumul_year_section ON qr_cumulative_attendance(year, section);
"""

try:
    result = sb.rpc('exec_sql', {'query': create_table_sql}).execute()
    print(f"  Table creation result: OK")
except Exception as e:
    print(f"  Table creation via RPC failed (expected if RPC not set up): {str(e)[:150]}")
    print("  Will try direct insert - table might already exist or need manual creation")

# Step 2: Try to create table using postgrest
# Since we can't directly run DDL via postgrest, let's just try inserting
# If table doesn't exist, we'll use the REST API approach

# Step 3: Parse Excel files
FILES = [
    {
        'path': '/Users/jashwanthsingh/Downloads/DS- II-I (A,B,C) CUMULATIVE ATTENDANCE from 6th JULY to 15th SEP-2026 (SR25 AUTONOMOUS BATCH).xlsx',
        'year': 'II',
        'semester': 'I',
        'batch': 'SR25',
    },
    {
        'path': '/Users/jashwanthsingh/Downloads/DS-III-I (A,B,C) CUMULATIVE ATTENDANCE from- 6th July-2026 to 15th -SEP-2026 (SR24 BATCH).xlsx',
        'year': 'III',
        'semester': 'I',
        'batch': 'SR24',
    },
    {
        'path': '/Users/jashwanthsingh/Downloads/DS IV-I (A & B)CUMULATIVE ATTENDANCE  from  6th July to 15th SEP-2026 (23 BATCH).xlsx',
        'year': 'IV',
        'semester': 'I',
        'batch': '23',
    },
]

SECTION_MAP = {
    'DS-A': 'A', 'DS-B': 'B', 'DS-C': 'C',
    'DS-3A': 'A', 'DS-3B': 'B', 'DS-3C': 'C',
    'DS-4-1-A': 'A', 'DS-4-1-B': 'B',
}

# Pre-fetch all student users to build hall_ticket -> user_id map
print("\nStep 2: Fetching all students from qr_users...")
all_users = []
offset = 0
while True:
    r = sb.table('qr_users').select('id, unique_id, name, section').eq('role', 'student').range(offset, offset + 999).execute()
    all_users.extend(r.data)
    if len(r.data) < 1000:
        break
    offset += 1000
print(f"  Found {len(all_users)} students")

user_map = {}
for u in all_users:
    user_map[u['unique_id'].upper().strip()] = u

print(f"\nStep 3: Parsing Excel files and preparing data...")
all_records = []
stats = {'matched': 0, 'not_found': 0, 'total_subjects': 0}
not_found_rolls = []

for file_info in FILES:
    wb = openpyxl.load_workbook(file_info['path'], data_only=True)
    year = file_info['year']
    semester = file_info['semester']
    
    print(f"\n  --- {file_info['path'].split('/')[-1]} ---")
    print(f"  Year: {year}, Sheets: {wb.sheetnames}")
    
    for sheet_name in wb.sheetnames:
        ws = wb[sheet_name]
        section = SECTION_MAP.get(sheet_name, 'A')
        print(f"\n  Processing sheet: {sheet_name} -> Section {section}")
        
        # Find header row (Row 4) and classes conducted row (Row 5)
        # Headers start at row 4, classes conducted at row 5, data from row 6
        
        # Read subject headers from row 4
        subjects = []
        total_col = None
        avg_col = None
        for col_idx in range(3, ws.max_column + 1):
            val = ws.cell(row=4, column=col_idx).value
            if val is not None:
                val_str = str(val).strip()
                if val_str.upper() in ('TOTAL', 'TOTAL '):
                    total_col = col_idx
                    break
                elif val_str.upper() in ('AVG', 'AVG ', 'AVG.'):
                    avg_col = col_idx
                    break
                else:
                    subjects.append({'col': col_idx, 'name': val_str})
        
        # Read classes conducted from row 5
        classes_conducted = {}
        total_conducted = 0
        for sub in subjects:
            val = ws.cell(row=5, column=sub['col']).value
            conducted = int(val) if val is not None and str(val).strip().isdigit() else 0
            classes_conducted[sub['col']] = conducted
            total_conducted += conducted
        
        # Read total conducted from total column
        if total_col:
            tc = ws.cell(row=5, column=total_col).value
            if tc is not None:
                total_conducted = int(tc)
        
        print(f"    Subjects: {[s['name'] for s in subjects]}")
        print(f"    Classes conducted: {[classes_conducted[s['col']] for s in subjects]}")
        print(f"    Total conducted: {total_conducted}")
        
        # Read student data starting from row 6
        student_count = 0
        for row_idx in range(6, ws.max_row + 1):
            hall_ticket = ws.cell(row=row_idx, column=2).value
            if hall_ticket is None:
                continue
            hall_ticket = str(hall_ticket).strip().upper()
            if not hall_ticket or len(hall_ticket) < 5:
                continue
            # Skip if it's a non-data row
            if 'NO.' in hall_ticket or 'HALL' in hall_ticket or 'TICKET' in hall_ticket:
                continue
            
            # Look up user
            user = user_map.get(hall_ticket)
            if not user:
                stats['not_found'] += 1
                if hall_ticket not in not_found_rolls:
                    not_found_rolls.append(hall_ticket)
                continue
            
            stats['matched'] += 1
            student_count += 1
            
            # Read total attended and percentage
            total_attended = 0
            overall_pct = 0
            if total_col:
                ta = ws.cell(row=row_idx, column=total_col).value
                if ta is not None:
                    try: total_attended = int(float(str(ta)))
                    except: total_attended = 0
            
            # Find avg column (it's after total)
            if total_col:
                avg_val = ws.cell(row=row_idx, column=total_col + 1).value
                if avg_val is not None:
                    try: overall_pct = round(float(str(avg_val)), 2)
                    except: overall_pct = 0
            
            # Create a record per subject
            for sub in subjects:
                attended = ws.cell(row=row_idx, column=sub['col']).value
                if attended is None:
                    attended = 0
                else:
                    try: attended = int(float(str(attended)))
                    except: attended = 0
                
                conducted = classes_conducted.get(sub['col'], 0)
                pct = round((attended / conducted * 100), 2) if conducted > 0 else 0
                
                stats['total_subjects'] += 1
                all_records.append({
                    'user_id': user['id'],
                    'hall_ticket': hall_ticket,
                    'year': year,
                    'section': section,
                    'semester': semester,
                    'period_from': '2026-07-06',
                    'period_to': '2026-09-15',
                    'subject': sub['name'],
                    'classes_conducted': conducted,
                    'classes_attended': attended,
                    'attendance_percentage': pct,
                    'total_classes_conducted': total_conducted,
                    'total_classes_attended': total_attended,
                    'overall_percentage': overall_pct,
                })
        
        print(f"    Students processed: {student_count}")

print(f"\n--- Summary ---")
print(f"  Students matched: {stats['matched']}")
print(f"  Students not found: {stats['not_found']}")
print(f"  Total subject records: {stats['total_subjects']}")
if not_found_rolls:
    print(f"  Not found rolls (first 20): {not_found_rolls[:20]}")

# Step 4: Insert data in batches (UPSERT to avoid duplicates)
print(f"\nStep 4: Inserting {len(all_records)} records into qr_cumulative_attendance...")
BATCH_SIZE = 100
inserted = 0
errors = 0
for i in range(0, len(all_records), BATCH_SIZE):
    batch = all_records[i:i + BATCH_SIZE]
    try:
        result = sb.table('qr_cumulative_attendance').upsert(
            batch,
            on_conflict='user_id,subject,period_from,period_to'
        ).execute()
        inserted += len(batch)
        if (i // BATCH_SIZE) % 10 == 0:
            print(f"  Inserted {inserted}/{len(all_records)} records...")
    except Exception as e:
        errors += 1
        print(f"  Error at batch {i//BATCH_SIZE}: {str(e)[:200]}")
        # If table doesn't exist, try to give helpful message
        if 'qr_cumulative_attendance' in str(e) and ('not found' in str(e).lower() or 'PGRST205' in str(e)):
            print("\n  *** TABLE DOES NOT EXIST! ***")
            print("  You need to create the table manually in Supabase SQL Editor.")
            print("  Run this SQL:")
            print(create_table_sql)
            break

print(f"\n=== DONE ===")
print(f"  Successfully inserted: {inserted}")
print(f"  Errors: {errors}")
