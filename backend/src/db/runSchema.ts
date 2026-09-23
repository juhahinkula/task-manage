import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Pool } from 'pg';

// ponytail: schema.sql lives only under src/ and isn't copied by tsc. We read
// it relative to process.cwd(), which npm always sets to backend/ for these
// scripts. If the app is later packaged/run from elsewhere, copy schema.sql
// into dist/db during build instead.
const SCHEMA_PATH = join(process.cwd(), 'src', 'db', 'schema.sql');

export const applySchema = async (pool: Pool): Promise<void> => {
  const schema = readFileSync(SCHEMA_PATH, 'utf-8');
  await pool.query(schema);
};
