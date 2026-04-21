import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: string;
  };
}

// Protect routes - verify JWT token
export const protect = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    let token;

    // Debug logging
    console.log('[Auth] Request path:', req.path);
    console.log('[Auth] Method:', req.method);
    console.log('[Auth] Origin:', req.headers.origin);
    
    // Check for token in Authorization header (case-insensitive)
    // Handle both string and string[] cases from headers
    const rawAuthHeader = req.headers.authorization || req.headers.Authorization;
    const authHeader = Array.isArray(rawAuthHeader) ? rawAuthHeader[0] : rawAuthHeader;
    console.log('[Auth] Authorization header:', authHeader);

    if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer')) {
      token = authHeader.split(' ')[1];
      console.log('[Auth] Token extracted:', token ? token.substring(0, 20) + '...' : 'none');
    } else {
      console.log('[Auth] No Bearer token found');
    }

    if (!token) {
      res.status(401).json({ message: 'Not authorized, no token', hint: 'Make sure to include Authorization: Bearer <token> header' });
      return;
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string };
      req.user = decoded;
      next();
    } catch (error) {
      res.status(401).json({ message: 'Not authorized, token failed' });
      return;
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Restrict to specific roles
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

// Admin only
export const adminOnly = restrictTo('admin');

// Recruiter or Admin
export const recruiterOrAdmin = restrictTo('admin', 'recruiter');
