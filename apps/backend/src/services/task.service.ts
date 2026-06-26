import { db, schema } from '../db';
import { eq, and, desc, gte, lte } from 'drizzle-orm';
import { CreateTaskInput, UpdateTaskInput } from '../types';

export class TaskService {
  async create(userId: string, input: CreateTaskInput) {
    const [task] = await db
      .insert(schema.tasks)
      .values({
        title: input.title,
        description: input.description,
        status: input.status,
        priority: input.priority,
        progress: input.progress,
        dueDate: input.dueDate ? new Date(input.dueDate) : null,
        userId,
      })
      .returning();

    return task;
  }

  async findAll(userId: string, filters?: { status?: string; priority?: string }) {
    const conditions = [eq(schema.tasks.userId, userId)];

    if (filters?.status) {
      conditions.push(eq(schema.tasks.status, filters.status as any));
    }
    if (filters?.priority) {
      conditions.push(eq(schema.tasks.priority, filters.priority as any));
    }

    return db
      .select()
      .from(schema.tasks)
      .where(and(...conditions))
      .orderBy(desc(schema.tasks.createdAt));
  }

  async findById(taskId: string, userId: string) {
    const [task] = await db
      .select()
      .from(schema.tasks)
      .where(and(
        eq(schema.tasks.id, taskId),
        eq(schema.tasks.userId, userId)
      ))
      .limit(1);

    return task;
  }

  async update(taskId: string, userId: string, input: UpdateTaskInput) {
    const existing = await this.findById(taskId, userId);
    if (!existing) {
      throw new Error('Задача не найдена');
    }

    const changes: { field: string; oldValue: string | null; newValue: string | null }[] = [];

    if (input.title !== undefined && input.title !== existing.title) {
      changes.push({ field: 'title', oldValue: existing.title, newValue: input.title });
    }
    if (input.description !== undefined && input.description !== existing.description) {
      changes.push({ field: 'description', oldValue: existing.description, newValue: input.description });
    }
    if (input.status !== undefined && input.status !== existing.status) {
      changes.push({ field: 'status', oldValue: existing.status, newValue: input.status });
    }
    if (input.priority !== undefined && input.priority !== existing.priority) {
      changes.push({ field: 'priority', oldValue: existing.priority, newValue: input.priority });
    }
    if (input.progress !== undefined && input.progress !== existing.progress) {
      changes.push({ field: 'progress', oldValue: String(existing.progress), newValue: String(input.progress) });
    }

    const updateData: Record<string, any> = {};
    if (input.title !== undefined) updateData.title = input.title;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.status !== undefined) updateData.status = input.status;
    if (input.priority !== undefined) updateData.priority = input.priority;
    if (input.progress !== undefined) updateData.progress = input.progress;
    if (input.dueDate !== undefined) {
      const newDue = input.dueDate ? new Date(input.dueDate) : null;
      const oldDue = existing.dueDate ? new Date(existing.dueDate) : null;
      if (String(newDue) !== String(oldDue)) {
        changes.push({
          field: 'dueDate',
          oldValue: oldDue ? oldDue.toISOString().split('T')[0] : null,
          newValue: newDue ? newDue.toISOString().split('T')[0] : null,
        });
      }
      updateData.dueDate = newDue;
    }

    updateData.updatedAt = new Date();

    const [updated] = await db
      .update(schema.tasks)
      .set(updateData)
      .where(and(
        eq(schema.tasks.id, taskId),
        eq(schema.tasks.userId, userId)
      ))
      .returning();

    // Save history
    if (changes.length > 0) {
      await db.insert(schema.taskHistory).values(
        changes.map((change) => ({
          taskId,
          field: change.field,
          oldValue: change.oldValue,
          newValue: change.newValue,
          changedBy: userId,
        }))
      );
    }

    return updated;
  }

  async delete(taskId: string, userId: string) {
    const existing = await this.findById(taskId, userId);
    if (!existing) {
      throw new Error('Задача не найдена');
    }

    await db
      .delete(schema.tasks)
      .where(and(
        eq(schema.tasks.id, taskId),
        eq(schema.tasks.userId, userId)
      ));

    return { message: 'Задача удалена' };
  }

  async getHistory(taskId: string, userId: string) {
    const task = await this.findById(taskId, userId);
    if (!task) {
      throw new Error('Задача не найдена');
    }

    return db
      .select()
      .from(schema.taskHistory)
      .where(eq(schema.taskHistory.taskId, taskId))
      .orderBy(desc(schema.taskHistory.createdAt));
  }

  async getDueSoonTasks() {
    const now = new Date();
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    return db
      .select()
      .from(schema.tasks)
      .where(and(
        eq(schema.tasks.status, 'PENDING'),
        gte(schema.tasks.dueDate, now),
        lte(schema.tasks.dueDate, in24Hours)
      ));
  }
}

export const taskService = new TaskService();