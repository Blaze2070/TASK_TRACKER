import { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { AuthRequest } from '../types';

export class AuthController {
  async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, name } = req.body;
      const result = await authService.register(email, password, name);
      res.status(201).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);
      res.json(result);
    } catch (error: any) {
      res.status(401).json({ error: error.message });
    }
  }

  async getProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const user = await authService.getProfile(userId);
      res.json(user);
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  }
}

export const authController = new AuthController();