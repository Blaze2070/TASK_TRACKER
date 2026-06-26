import { Request } from 'express';

export interface JwtPayload {
  userId: string;
  email: string;
  role: 'ADMIN' | 'USER';
}

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  status?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  progress?: number;
  dueDate?: string;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  progress?: number;
  dueDate?: string | null;
}