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
    let token: string | undefined;

    // Debug logging - log ALL headers to see what's coming through
    console.log('[Auth] ========== REQUEST DEBUG ==========');
    console.log('[Auth] Path:', req.path);
    console.log('[Auth] Method:', req.method);
    console.log('[Auth] All headers:', JSON.stringify(req.headers, null, 2));
    
    // Try multiple ways to get the authorization header
    // Express lowercases all header names
    let authHeader = req.headers['authorization'];
    
    // Handle array case (some proxies send headers as arrays)
    if (Array.isArray(authHeader)) {
      authHeader = authHeader[0];
    }
    
    console.log('[Auth] Raw authorization header:', authHeader);
    console.log('[Auth] Header type:', typeof authHeader);

    if (authHeader && typeof authHeader === 'string') {
      // Handle "Bearer TOKEN" format
      if (authHeader.toLowerCase().startsWith('bearer ')) {
        token = authHeader.substring(7).trim(); // Remove "Bearer " (7 chars)
        console.log('[Auth] Token extracted via substring:', token ? token.substring(0, 20) + '...' : 'EMPTY');
      } else {
        // Try split as fallback
        const parts = authHeader.split(' ');
        if (parts.length >= 2) {
          token = parts[1];
          console.log('[Auth] Token extracted via split:', token ? token.substring(0, 20) + '...' : 'EMPTY');
        } else {
          // Maybe just the token without "Bearer" prefix
          token = authHeader;
          console.log('[Auth] Using full header as token:', token ? token.substring(0, 20) + '...' : 'EMPTY');
        }
      }
    } else {
      console.log('[Auth] No authorization header found or wrong type');
    }

    if (!token || token === '' || token === 'undefined' || token === 'null') {
      console.log('[Auth] Token is empty/invalid:', token);
      res.status(401).json({ 
        message: 'Not authorized, no token', 
        debug: {
          hint: 'Make sure to include Authorization: Bearer <token> header',
          receivedHeaders: Object.keys(req.headers),
          authHeaderPresent: !!authHeader,
          authHeaderType: typeof authHeader,
          tokenValue: token ? token.substring(0, 10) : 'null/undefined'
        }
      });
      return;
    }

    console.log('[Auth] JWT_SECRET used for verification:', JWT_SECRET.substring(0, 10) + '...');

    try {
      // Verify token
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string };
      console.log('[Auth] Token verified successfully. User:', decoded.userId, 'Role:', decoded.role);
      req.user = decoded;
      next();
    } catch (error: any) {
      console.error('[Auth] Token verification failed:', error.message);
      res.status(401).json({ 
        message: 'Not authorized, token failed',
        error: error.message,
        tokenPrefix: token.substring(0, 20) + '...'
      });
      return;
    }
  } catch (error: any) {
    console.error('[Auth] Server error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
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
