import { Client } from 'pg';

const PROJECT_REF = 'ayevvaecybqjvlvmrbme';
const PASSWORD = 'Gsnih3ugHwsMaMYV';
const ENCODED = encodeURIComponent(PASSWORD);

const candidates = [
  `postgresql://postgres.${PROJECT_REF}:${ENCODED}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`,
  `postgresql://postgres.${PROJECT_REF}:${ENCODED}@aws-0-us-east-1.pooler.supabase.com:5432/postgres`,
  `postgresql://postgres.${PROJECT_REF}:${ENCODED}@aws-0-us-east-2.pooler.supabase.com:6543/postgres`,
  `postgresql://postgres.${PROJECT_REF}:${ENCODED}@aws-0-ap-south-1.pooler.supabase.com:6543/postgres`,
  `postgresql://postgres.${PROJECT_REF}:${ENCODED}@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres`,
  `postgresql://postgres.${PROJECT_REF}:${ENCODED}@aws-0-eu-west-1.pooler.supabase.com:6543/postgres`,
  `postgresql://postgres.${PROJECT_REF}:${ENCODED}@aws-0-eu-central-1.pooler.supabase.com:6543/postgres`,
  `postgresql://postgres.${PROJECT_REF}:${ENCODED}@aws-0-us-west-1.pooler.supabase.com:6543/postgres`,
  `postgresql://postgres.${PROJECT_REF}:${ENCODED}@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres`,
  `postgresql://postgres.${PROJECT_REF}:${ENCODED}@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres`,
  `postgresql://postgres.${PROJECT_REF}:${ENCODED}@aws-0-eu-west-2.pooler.supabase.com:6543/postgres`,
];

for (const url of candidates) {
  const tag = url.replace(ENCODED, '***').slice(40, 110);
  const c = new Client({ connectionString: url, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 8000 });
  try {
    await c.connect();
    const r = await c.query('select current_database() as db, version() as v');
    console.log(`OK ${tag}`);
    console.log(`  DB: ${r.rows[0].db}`);
    await c.end();
    console.log('WORKING_URL=' + url);
    process.exit(0);
  } catch (e) {
    console.log(`FAIL ${tag}: ${(e.message||'').slice(0,80)}`);
    try { await c.end(); } catch {}
  }
}
console.log('No connection worked');
process.exit(1);
