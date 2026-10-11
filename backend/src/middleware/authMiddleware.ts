import { Request, Response, NextFunction } from 'express';
import { verifySessionToken, TokenPayload } from '../utils/tokenUtils';

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

/**
 * Middleware that authenticates incoming requests.
 * Extracts token from 'Authorization: Bearer <token>' or fallback header 'x-auth-token'.
 * Attaches verified payload to req.user and establishes actor context.
 */
export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  let token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token && typeof req.headers['x-auth-token'] === 'string') {
    token = req.headers['x-auth-token'];
  }

  if (!token) {
    return res.status(401).json({ error: 'Acceso no autenticado. Inicie sesion nuevamente.' });
  }

  const payload = verifySessionToken(token);
  if (!payload) {
    return res.status(401).json({ error: 'Sesion invalida o expirada. Por favor vuelva a identificarse.' });
  }

  req.user = payload;

  // Set trusted actor headers for internal service usage so controllers read trusted data
  req.headers['x-user-id'] = String(payload.userId);
  req.headers['x-user-role'] = payload.role;
  if (payload.machineId) {
    req.headers['x-machine-id'] = String(payload.machineId);
  } else {
    delete req.headers['x-machine-id'];
  }

  next();
}

/**
 * Middleware that restricts access to specific roles.
 */
export function requireRoles(...allowedRoles: string[]) {
  const normalizedAllowed = allowedRoles.map(r => r.toUpperCase());
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const userRole = (req.user.role || '').toUpperCase();
    if (!normalizedAllowed.includes(userRole)) {
      return res.status(403).json({
        error: `Acceso denegado: se requiere uno de los roles [${allowedRoles.join(', ')}]`
      });
    }

    next();
  };
}
