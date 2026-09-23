import { Pool } from 'pg';
import dotenv from 'dotenv';
import { applySchema } from '../db/runSchema.js';

dotenv.config();

const databaseUrl = process.env.DATABASE_URL || '******localhost:5432/taskmanagement';

export const pool = new Pool({
  connectionString: databaseUrl,
  max: 5,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 30000
});

export const connectDB = async (): Promise<void> => {
  try {
    await pool.query('SELECT 1');
    console.log('Database connection established successfully.');

    // Apply schema.sql (CREATE TABLE IF NOT EXISTS) in development, mirroring
    // the old Sequelize sync-on-boot behavior.
    if (process.env.NODE_ENV === 'development' || process.env.DB_SYNC === 'true') {
      await applySchema(pool);
      console.log('Database schema applied.');
    }
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    // Don't exit in test environment
    if (process.env.NODE_ENV !== 'test') {
      process.exit(1);
    }
  }
};
