import { Request, Response, NextFunction } from 'express';

// Middleware temporal para testing - NO usar en producción
export const mockAuthMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Simula un usuario autenticado para testing
  (req as any).user = {
    id: req.body?.userId || 'valid-user-id',
    email: 'test@example.com',
    public_key: 'GTESTPUBLICKEYTESTPUBLICKEYTESTPUBKEY12'
  };
  
  next();
};