import bcrypt from 'bcryptjs';
import { pool } from '../config/database.js';

const HASH_ROUNDS = 10;

export interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
}

export type PublicUser = Omit<User, 'password'>;

const PUBLIC_COLUMNS = 'id, name, email, "createdAt", "updatedAt"';

export const findUserByEmail = async (email: string): Promise<User | null> => {
  const { rows } = await pool.query<User>('SELECT * FROM users WHERE email = $1', [email]);
  return rows[0] ?? null;
};

export const findUserById = async (id: number): Promise<User | null> => {
  const { rows } = await pool.query<User>('SELECT * FROM users WHERE id = $1', [id]);
  return rows[0] ?? null;
};

export const findPublicUserById = async (id: number): Promise<PublicUser | null> => {
  const { rows } = await pool.query<PublicUser>(
    `SELECT ${PUBLIC_COLUMNS} FROM users WHERE id = $1`,
    [id]
  );
  return rows[0] ?? null;
};

export const createUser = async (data: {
  name: string;
  email: string;
  password: string;
}): Promise<User> => {
  const hashedPassword = await bcrypt.hash(data.password, HASH_ROUNDS);
  const { rows } = await pool.query<User>(
    `INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING *`,
    [data.name, data.email, hashedPassword]
  );
  return rows[0];
};

export const comparePassword = async (candidate: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(candidate, hash);
};
