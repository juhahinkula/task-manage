import { Response, NextFunction } from 'express';
import { body } from 'express-validator';
import jwt from 'jsonwebtoken';
import { AuthRequest, CreateUserDTO, LoginDTO } from '../types/index.js';
import { findUserByEmail, createUser, comparePassword, findPublicUserById } from '../models/User.js';
import { config } from '../config/config.js';

// Validation rules
export const registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ min: 2, max: 100 }),
  body('email').isEmail().withMessage('Please provide a valid email').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
];

export const loginValidation = [
  body('email').isEmail().withMessage('Please provide a valid email').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required')
];

// Controllers
export const register = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, email, password }: CreateUserDTO = req.body;

    // Check if user exists
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
      return;
    }

    // Create user
    const user = await createUser({
      name,
      email,
      password
    });

    // Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      config.jwtSecret as jwt.Secret,
      { expiresIn: config.jwtExpiresIn } as jwt.SignOptions
    );

    res.status(201).json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password }: LoginDTO = req.body;

    // Check if user exists
    const user = await findUserByEmail(email);
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
      return;
    }

    // Check password
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
      return;
    }

    // Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      config.jwtSecret as jwt.Secret,
      { expiresIn: config.jwtExpiresIn } as jwt.SignOptions
    );

    res.status(200).json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = await findPublicUserById(req.user!.id);

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};
