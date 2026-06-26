import { db, schema } from '../db';
import { eq, and } from 'drizzle-orm';
import { stringify } from 'csv-stringify/sync';

export class CsvService {
  async exportTasks(userId: string): Promise<string> {
    const tasks = await db
      .select({
        id: schema.tasks.id,
        title: schema.tasks.title,
        description: schema.tasks.description,
        status: schema.tasks.status,
        priority: schema.tasks.priority,
        progress: schema.tasks.progress,
        dueDate: schema.tasks.dueDate,
        createdAt: schema.tasks.createdAt,
        updatedAt: schema.tasks.updatedAt,
      })
      .from(schema.tasks)
      .where(eq(schema.tasks.userId, userId))
      .orderBy(schema.tasks.createdAt);

    const records = tasks.map((task) => ({
      ID: task.id,
      Название: task.title,
      Описание: task.description || '',
      Статус: task.status,
      Приоритет: task.priority,
      Прогресс: `${task.progress}%`,
      'Срок выполнения': task.dueDate ? task.dueDate.toISOString().split('T')[0] : '',
      Создана: task.createdAt.toISOString().split('T')[0],
      Обновлена: task.updatedAt.toISOString().split('T')[0],
    }));

    return stringify(records, { header: true, delimiter: ';' });
  }
}

export const csvService = new CsvService();