import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/config.js';
import { AuthRequest } from '../types/index.js';
import { findUserById } from '../models/User.js';

export const protect = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token: string | undefined;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
      return;
    }

    try {
      const decoded = jwt.verify(token, config.jwtSecret) as { id: number; email: string };
      
      const user = await findUserById(decoded.id);
      
      if (!user) {
        res.status(401).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      req.user = {
        id: user.id,
        email: user.email
      };

      next();
    } catch (error) {
      res.status(401).json({
        success: false,
        message: 'Not authorized to access this route:' + error
      });
      return;
    }
  } catch (error) {
    next(error);
  }
};
