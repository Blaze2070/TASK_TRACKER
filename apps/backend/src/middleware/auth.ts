import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JwtPayload } from '../types';

const JWT_SECRET = process.env.JWT_SECRET!;

export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Требуется авторизация' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as unknown as JwtPayload;
    (req as any).user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Недействительный токен' });
  }
};

export const requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
  const user = (req as any).user as JwtPayload;
  
  if (!user || user.role !== 'ADMIN') {
    res.status(403).json({ error: 'Доступ запрещен. Требуются права администратора' });
    return;
  }
  
  next();
};