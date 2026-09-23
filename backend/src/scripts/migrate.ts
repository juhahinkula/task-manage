import { pool } from '../config/database.js';
import { applySchema } from '../db/runSchema.js';

const main = async (): Promise<void> => {
  await applySchema(pool);
  console.log('Schema applied successfully.');
  await pool.end();
};

main().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});
