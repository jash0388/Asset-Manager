import os
import re

def fix_file(path):
    with open(path, 'r') as f:
        content = f.read()
    
    # Fix catch (err) -> catch (err: any)
    content = re.sub(r'catch\s*\(err\)', 'catch (err: any)', content)
    
    # Fix (req, res) -> (req: any, res: any)
    content = re.sub(r'\(req,\s*res\)\s*=>', '(req: any, res: any) =>', content)
    content = re.sub(r'\(req: any,\s*res\)\s*=>', '(req: any, res: any) =>', content)
    
    # Fix (r) => or (s) => or (i) => to (r: any) => etc in .map/filter
    # This is trickier but we can target common single-letter params
    for p in ['r', 's', 'i', 'u', 'm', 'rec']:
        content = re.sub(rf'\({p}\)\s*=>', f'({p}: any) =>', content)

    with open(path, 'w') as f:
        f.write(content)

files = [
    'artifacts/api-server/src/routes/attendance.ts',
    'artifacts/api-server/src/routes/users.ts',
    'artifacts/api-server/src/routes/mentor.ts',
    'artifacts/api-server/src/routes/auth.ts',
    'artifacts/api-server/src/routes/health.ts'
]

for f in files:
    if os.path.exists(f):
        fix_file(f)
        print(f"Fixed {f}")
