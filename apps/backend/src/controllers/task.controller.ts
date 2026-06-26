import { Response } from 'express';
import { taskService } from '../services/task.service';
import { AuthRequest } from '../types';

export class TaskController {
  async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const task = await taskService.create(userId, req.body);
      res.status(201).json(task);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async findAll(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { status, priority } = req.query as { status?: string; priority?: string };
      const tasks = await taskService.findAll(userId, { status, priority });
      res.json(tasks);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async findById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const task = await taskService.findById(req.params.id as string, userId);
      if (!task) {
        res.status(404).json({ error: 'Задача не найдена' });
        return;
      }
      res.json(task);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async update(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const task = await taskService.update(req.params.id as string, userId, req.body);
      res.json(task);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async delete(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const result = await taskService.delete(req.params.id as string, userId);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getHistory(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const history = await taskService.getHistory(req.params.id as string, userId);
      res.json(history);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}

export const taskController = new TaskController();