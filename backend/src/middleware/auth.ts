import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Keep ONLY user typing (safe approach)
interface AuthUser {
  userId: string;
  role: string;
}

// Extend Request safely using intersection type inside functions
type AuthRequest = Request & {
  user?: AuthUser;
};

// =======================
// AUTH MIDDLEWARE
// =======================
export const protect = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token: string | undefined;

    // SAFE access (no TS errors)
    console.log('[Auth] Path:', req.path);
    console.log('[Auth] Method:', req.method);

    const authHeader = req.headers?.authorization;

    if (authHeader && typeof authHeader === 'string') {
      token = authHeader.startsWith('Bearer ')
        ? authHeader.split(' ')[1]
        : authHeader;
    }

    if (!token) {
      res.status(401).json({ message: 'Not authorized, no token' });
      return;
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;

      req.user = decoded;
      next();
    } catch (err: any) {
      res.status(401).json({
        message: 'Token invalid',
        error: err.message,
      });
    }
  } catch (err: any) {
    res.status(500).json({
      message: 'Server error',
      error: err.message,
    });
  }
};

// =======================
// ROLE PROTECTION
// =======================
export const restrictTo = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ message: 'Not allowed' });
      return;
    }

    next();
  };
};

export const adminOnly = restrictTo('admin');
export const recruiterOrAdmin = restrictTo('admin', 'recruiter');