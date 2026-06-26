import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cron from 'node-cron';
import authRoutes from './routes/auth.routes';
import taskRoutes from './routes/task.routes';
import { notificationService } from './services/notification.service';

const app = express();
export const expressApp = app;
const PORT = process.env.PORT || 3001;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

import { csvService } from './services/csv.service';
import { authenticate } from './middleware/auth';
import { AuthRequest } from './types';

app.get('/api/export/csv', authenticate, async (req, res) => {
  try {
    const userId = (req as AuthRequest).user!.userId;
    const csv = await csvService.exportTasks(userId);
    res.header('Content-Type', 'text/csv; charset=utf-8');
    res.header('Content-Disposition', 'attachment; filename=tasks.csv');
    res.send('\uFEFF' + csv);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/push-token', authenticate, async (req, res) => {
  try {
    const userId = (req as AuthRequest).user!.userId;
    const { token } = req.body;
    await notificationService.registerPushToken(userId, token);
    res.json({ message: 'Push-токен сохранен' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

cron.schedule('0 * * * *', () => {
  notificationService.sendTaskDueSoonNotifications().catch(console.error);
});

app.post('/api/notifications/test', authenticate, async (req, res) => {
  try {
    const userId = (req as AuthRequest).user!.userId;
    await notificationService.sendPushNotification(
      userId,
      '🔔 Тестовое уведомление',
      'Если вы видите это — уведомления работают!',
    );
    res.json({ message: 'Тестовое уведомление отправлено' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});

export default app;