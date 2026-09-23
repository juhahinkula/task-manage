import { pool } from '../config/database.js';
import { CreateTaskDTO, UpdateTaskDTO } from '../types/index.js';

export interface Task {
  id: number;
  title: string;
  description: string | null;
  status: 'todo' | 'in-progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  dueDate: Date | null;
  userId: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskQuery {
  status?: string;
  priority?: string;
  search?: string;
  sortBy?: string;
  order?: string;
}

// Allowlist of sortable columns: user input can't be interpolated into an
// identifier position via parameters, so it's validated against this set
// instead.
const SORTABLE_COLUMNS: Record<string, string> = {
  title: 'title',
  status: 'status',
  priority: 'priority',
  dueDate: '"dueDate"',
  createdAt: '"createdAt"',
  updatedAt: '"updatedAt"'
};

export const findTasks = async (userId: number, query: TaskQuery): Promise<Task[]> => {
  const conditions = ['"userId" = $1'];
  const params: unknown[] = [userId];

  if (query.status) {
    params.push(query.status);
    conditions.push(`status = $${params.length}`);
  }

  if (query.priority) {
    params.push(query.priority);
    conditions.push(`priority = $${params.length}`);
  }

  if (query.search) {
    params.push(`%${query.search}%`);
    conditions.push(`(title ILIKE $${params.length} OR description ILIKE $${params.length})`);
  }

  const sortColumn = SORTABLE_COLUMNS[query.sortBy ?? ''] ?? '"createdAt"';
  const sortOrder = query.order?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  const { rows } = await pool.query<Task>(
    `SELECT * FROM tasks WHERE ${conditions.join(' AND ')} ORDER BY ${sortColumn} ${sortOrder}`,
    params
  );
  return rows;
};

export const findTaskById = async (id: number, userId: number): Promise<Task | null> => {
  const { rows } = await pool.query<Task>(
    'SELECT * FROM tasks WHERE id = $1 AND "userId" = $2',
    [id, userId]
  );
  return rows[0] ?? null;
};

export const createTask = async (userId: number, data: CreateTaskDTO): Promise<Task> => {
  const { rows } = await pool.query<Task>(
    `INSERT INTO tasks (title, description, status, priority, "dueDate", "userId")
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [
      data.title,
      data.description ?? null,
      data.status ?? 'todo',
      data.priority ?? 'medium',
      data.dueDate ?? null,
      userId
    ]
  );
  return rows[0];
};

export const updateTask = async (
  id: number,
  userId: number,
  data: UpdateTaskDTO
): Promise<Task | null> => {
  const fields: string[] = [];
  const params: unknown[] = [];

  const set = (column: string, value: unknown): void => {
    params.push(value);
    fields.push(`"${column}" = $${params.length}`);
  };

  if (data.title !== undefined) set('title', data.title);
  if (data.description !== undefined) set('description', data.description);
  if (data.status !== undefined) set('status', data.status);
  if (data.priority !== undefined) set('priority', data.priority);
  if (data.dueDate !== undefined) set('dueDate', data.dueDate);

  if (fields.length === 0) {
    return findTaskById(id, userId);
  }

  fields.push('"updatedAt" = NOW()');
  params.push(id, userId);

  const { rows } = await pool.query<Task>(
    `UPDATE tasks SET ${fields.join(', ')} WHERE id = $${params.length - 1} AND "userId" = $${params.length} RETURNING *`,
    params
  );
  return rows[0] ?? null;
};

export const deleteTask = async (id: number, userId: number): Promise<boolean> => {
  const result = await pool.query('DELETE FROM tasks WHERE id = $1 AND "userId" = $2', [id, userId]);
  return (result.rowCount ?? 0) > 0;
};
