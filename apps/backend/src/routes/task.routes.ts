import { Router } from 'express';
import { taskController } from '../controllers/task.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.post('/', (req, res) => taskController.create(req as any, res));
router.get('/', (req, res) => taskController.findAll(req as any, res));
router.get('/:id', (req, res) => taskController.findById(req as any, res));
router.put('/:id', (req, res) => taskController.update(req as any, res));
router.delete('/:id', (req, res) => taskController.delete(req as any, res));
router.get('/:id/history', (req, res) => taskController.getHistory(req as any, res));

export default router;