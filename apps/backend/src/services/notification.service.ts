import { Expo, ExpoPushMessage } from 'expo-server-sdk';
import { db, schema } from '../db';
import { eq } from 'drizzle-orm';

const expo = new Expo({ accessToken: process.env.EXPO_ACCESS_TOKEN });

export class NotificationService {
  async registerPushToken(userId: string, token: string) {
    const existing = await db
      .select()
      .from(schema.pushTokens)
      .where(eq(schema.pushTokens.token, token))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(schema.pushTokens).values({ userId, token });
    }
  }

  async sendPushNotification(userId: string, title: string, body: string, data?: Record<string, unknown>) {
    const tokens = await db
      .select()
      .from(schema.pushTokens)
      .where(eq(schema.pushTokens.userId, userId));

    if (tokens.length === 0) return;

    const messages: ExpoPushMessage[] = tokens
      .filter((t) => Expo.isExpoPushToken(t.token))
      .map((t) => ({
        to: t.token,
        sound: 'default',
        title,
        body,
        data,
      }));

    if (messages.length === 0) return;

    try {
      await expo.sendPushNotificationsAsync(messages);
    } catch (error) {
      console.error('Ошибка отправки push-уведомления:', error);
    }
  }

  async sendTaskDueSoonNotifications() {
    const { taskService } = await import('./task.service');
    const dueSoonTasks = await taskService.getDueSoonTasks();

    for (const task of dueSoonTasks) {
      await this.sendPushNotification(
        task.userId,
        'Срок задачи истекает',
        `Задача "${task.title}" должна быть выполнена до ${task.dueDate?.toLocaleDateString('ru-RU')}`,
        { taskId: task.id }
      );
    }
  }
}

export const notificationService = new NotificationService();