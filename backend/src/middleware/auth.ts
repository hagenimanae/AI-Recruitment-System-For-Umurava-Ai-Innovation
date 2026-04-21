import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'elissa123//';

// Extend Express Request properly
export interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: string;
  };
}

// Protect routes - verify JWT token
export const protect = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token: string | undefined;

    console.log('[Auth] Path:', req.path);
    console.log('[Auth] Method:', req.method);

    const authHeader = req.headers.authorization;

    if (authHeader && typeof authHeader === 'string') {
      if (authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
      } else {
        token = authHeader;
      }
    }

    if (!token) {
      res.status(401).json({
        message: 'Not authorized, no token',
      });
      return;
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as {
        userId: string;
        role: string;
      };

      req.user = decoded;
      next();
    } catch (error: any) {
      res.status(401).json({
        message: 'Not authorized, token failed',
        error: error.message,
      });
    }
  } catch (error: any) {
    res.status(500).json({
      message: 'Server error',
      error: error.message,
    });
  }
};

// Restrict to roles
export const restrictTo = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: 'Not authorized' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ message: 'Not authorized to perform this action' });
      return;
    }

    next();
  };
};

// Role helpers
export const adminOnly = restrictTo('admin');
export const recruiterOrAdmin = restrictTo('admin', 'recruiter');