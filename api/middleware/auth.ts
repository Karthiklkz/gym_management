import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import config from '../utils/config';
import { unauthorized, forbidden } from '../utils/response';

export interface AuthUser {
  userId: string;
  role: 'SUPER_ADMIN' | 'GYM_ADMIN' | 'TRAINER' | 'MEMBER';
  gymId?: string;
  branchId?: string;
}

export interface AuthRequest extends NextRequest {
  user?: AuthUser;
}

export const verifyToken = (req: NextRequest) => {
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

  if (!token) {
    return { error: 'Unauthorized', status: 401 };
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as AuthUser;
    return { user: decoded };
  } catch (error) {
    return { error: 'Invalid token', status: 401 };
  }
};

/**
 * Validates if the user has one of the required roles
 */
export const authorize = (req: NextRequest, allowedRoles: string[]) => {
  const { user, error, status } = verifyToken(req);

  if (error) {
    return { error, status };
  }

  if (user && !allowedRoles.includes(user.role)) {
    console.log(`[AUTH DEBUG]: Role Mismatch! User Role: "${user.role}", Allowed Roles: ${JSON.stringify(allowedRoles)}`);
    return { error: 'Forbidden: You do not have permission to access this resource', status: 403 };
  }

  return { user };
};

/**
 * For Gym Admin: Validates if they are accessing a resource that belongs to their gym.
 * If gym_id is provided in the query or body, it must match the user's gymId.
 */
export const validateGymOwnership = (user: AuthUser, requestedGymId?: string) => {
  if (user.role === 'SUPER_ADMIN') return true;

  if (user.role === 'GYM_ADMIN') {
    if (!requestedGymId) return true; // Responsibility of the controller to filter by user.gymId
    return user.gymId === requestedGymId;
  }

  return false;
};

// Helper for route handlers
export const withAuth = (handler: (req: NextRequest, user: AuthUser, ...args: any[]) => Promise<NextResponse>) => {
  return async (req: NextRequest, ...args: any[]) => {
    const { user, error, status } = verifyToken(req);

    if (error) {
      if (status === 401) return unauthorized(error);
      return forbidden(error);
    }

    return handler(req, user as AuthUser, ...args);
  };
};

/**
 * Combined helper for role and ownership check
 */
export const withRole = (allowedRoles: string[], handler: (req: NextRequest, user: AuthUser, ...args: any[]) => Promise<NextResponse>) => {
  return async (req: NextRequest, ...args: any[]) => {
    const { user, error, status } = authorize(req, allowedRoles);

    if (error) {
      if (status === 401) return unauthorized(error);
      return forbidden(error);
    }

    return handler(req, user as AuthUser, ...args);
  };
};
