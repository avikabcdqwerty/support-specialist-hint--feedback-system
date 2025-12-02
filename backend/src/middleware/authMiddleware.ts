import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';

/**
 * User roles supported by the system.
 */
export enum UserRole {
  USER = 'user',
  SUPPORT_SPECIALIST = 'support_specialist',
  ADMIN = 'admin',
}

/**
 * Extends Express Request to include authenticated user info.
 */
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: UserRole;
  };
}

/**
 * Middleware to authenticate JWT and attach user info to request.
 */
export const authenticateJWT = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication token missing or invalid.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT secret not configured.');
    }
    const decoded = jwt.verify(token, secret) as JwtPayload;

    // Attach user info to request
    req.user = {
      id: decoded.sub as string,
      role: decoded.role as UserRole,
    };
    next();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('JWT authentication error:', err);
    return res.status(401).json({ error: 'Invalid or expired authentication token.' });
  }
};

/**
 * Middleware to authorize only Support Specialists.
 */
export const authorizeSupportSpecialist = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (req.user?.role === UserRole.SUPPORT_SPECIALIST || req.user?.role === UserRole.ADMIN) {
    return next();
  }
  return res.status(403).json({ error: 'Access denied. Support Specialist role required.' });
};

/**
 * Middleware to authorize only the intended user or Support Specialist (for QA/audit).
 * Used for endpoints where either the user or a support specialist can access.
 */
export const authorizeUserOrSupportSpecialist = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  // If Support Specialist or Admin, allow
  if (req.user?.role === UserRole.SUPPORT_SPECIALIST || req.user?.role === UserRole.ADMIN) {
    return next();
  }

  // If user, check if accessing own resource
  // For GET /hint, user can only fetch their own hints
  // For POST /hint/view/:hintId, user can only mark their own hint as viewed
  // For GET /progress/:userId, only support specialist allowed (handled elsewhere)
  // For POST /hint/:userId, only support specialist allowed (handled elsewhere)

  // For endpoints with :userId param, check if matches req.user.id
  const userIdParam = req.params.userId || req.body.userId;
  if (userIdParam && req.user?.id === userIdParam) {
    return next();
  }

  // For endpoints where userId is not in params, allow user to proceed
  if (!userIdParam && req.user?.role === UserRole.USER) {
    return next();
  }

  return res.status(403).json({ error: 'Access denied.' });
};