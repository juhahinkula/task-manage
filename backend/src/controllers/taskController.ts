import { Response, NextFunction } from 'express';
import { body } from 'express-validator';
import { AuthRequest, CreateTaskDTO, UpdateTaskDTO } from '../types/index.js';
import { findTasks, findTaskById, createTask as createTaskRecord, updateTask as updateTaskRecord, deleteTask as deleteTaskRecord } from '../models/Task.js';

// Validation rules
export const createTaskValidation = [
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 200 }),
  body('description').optional().trim(),
  body('status').optional().isIn(['todo', 'in-progress', 'done']),
  body('priority').optional().isIn(['low', 'medium', 'high']),
  body('dueDate').notEmpty().withMessage('Due date is required').bail().isISO8601().withMessage('Invalid date format')
];

export const updateTaskValidation = [
  body('title').optional().trim().notEmpty().isLength({ max: 200 }),
  body('description').optional().trim(),
  body('status').optional().isIn(['todo', 'in-progress', 'done']),
  body('priority').optional().isIn(['low', 'medium', 'high']),
  body('dueDate').optional({ checkFalsy: true }).isISO8601().withMessage('Invalid date format')
];

const parseTaskId = (rawId: string | string[]): number | null => {
  const id = Number(rawId);
  return Number.isInteger(id) ? id : null;
};

// Controllers
export const getTasks = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { status, priority, search, sortBy, order } = req.query;

    const tasks = await findTasks(req.user!.id, {
      status: status as string | undefined,
      priority: priority as string | undefined,
      search: search as string | undefined,
      sortBy: sortBy as string | undefined,
      order: order as string | undefined
    });

    res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks
    });
  } catch (error) {
    next(error);
  }
};

export const getTask = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = parseTaskId(req.params.id);
    const task = id === null ? null : await findTaskById(id, req.user!.id);

    if (!task) {
      res.status(404).json({
        success: false,
        message: 'Task not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: task
    });
  } catch (error) {
    next(error);
  }
};

export const createTask = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const taskData: CreateTaskDTO = req.body;

    const task = await createTaskRecord(req.user!.id, taskData);

    res.status(201).json({
      success: true,
      data: task
    });
  } catch (error) {
    next(error);
  }
};

export const updateTask = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = parseTaskId(req.params.id);
    const updateData: UpdateTaskDTO = req.body;
    const task = id === null ? null : await updateTaskRecord(id, req.user!.id, updateData);

    if (!task) {
      res.status(404).json({
        success: false,
        message: 'Task not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: task
    });
  } catch (error) {
    next(error);
  }
};

export const deleteTask = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = parseTaskId(req.params.id);
    const deleted = id === null ? false : await deleteTaskRecord(id, req.user!.id);

    if (!deleted) {
      res.status(404).json({
        success: false,
        message: 'Task not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
