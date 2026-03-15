import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import config from '../utils/config';

export interface AuthRequest extends NextRequest {
  user?: {
    userId: string;
    role: string;
    gymId?: string;
  };
}

export const verifyToken = (req: NextRequest) => {
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

  if (!token) {
    return { error: 'Unauthorized', status: 401 };
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as any;
    return { user: decoded };
  } catch (error) {
    return { error: 'Invalid token', status: 401 };
  }
};

// Helper for route handlers
export const withAuth = (handler: Function) => {
  return async (req: NextRequest, ...args: any[]) => {
    const { user, error, status } = verifyToken(req);
    
    if (error) {
      return NextResponse.json({ error }, { status });
    }

    // Attach user to the request context (simulated since NextRequest is immutable)
    return handler(req, user, ...args);
  };
};
