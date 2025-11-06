import { Request, Response, NextFunction } from 'express';
import { JWTService } from '../services/jwtService';
import { JWTPayload } from '../types';

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

/**
 * Authentication middleware
 * Verifies JWT token and adds user info to request
 */
export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    const token = JWTService.extractTokenFromHeader(authHeader);

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Access token required',
        error: 'No token provided',
      });
      return;
    }

    // Check if token is expired
    if (JWTService.isTokenExpired(token)) {
      res.status(401).json({
        success: false,
        message: 'Token expired',
        error: 'Please login again',
      });
      return;
    }

    // Verify token
    const decoded = JWTService.verifyToken(token);
    if (!decoded) {
      res.status(401).json({
        success: false,
        message: 'Invalid token',
        error: 'Token verification failed',
      });
      return;
    }

    // Add user info to request
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication failed',
      error: 'Internal server error',
    });
  }
};

/**
 * Optional authentication middleware
 * Adds user info if token is valid, but doesn't require it
 */
export const optionalAuth = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    const token = JWTService.extractTokenFromHeader(authHeader);

    if (token && !JWTService.isTokenExpired(token)) {
      const decoded = JWTService.verifyToken(token);
      if (decoded) {
        req.user = decoded;
      }
    }

    next();
  } catch (error) {
    console.error('Optional auth error:', error);
    next(); // Continue even if auth fails
  }
};
