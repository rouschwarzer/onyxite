import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL!);

async function main() {
    // 1. Backfill object_key = id for all files
    const result = await sql`UPDATE files SET object_key = id WHERE object_key IS NULL`;
    console.log('Backfilled object_key:', result);

    // 2. Verify
    const check = await sql`SELECT count(*) as total, count(object_key) as has_key FROM files`;
    console.log('After backfill:', check[0]);

    // 3. Sample check
    const sample = await sql`SELECT id, object_key, name FROM files LIMIT 3`;
    console.log('Sample:', JSON.stringify(sample, null, 2));
}

main().catch(console.error);
