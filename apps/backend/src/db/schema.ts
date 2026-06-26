import { pgTable, uuid, text, integer, timestamp, pgEnum } from 'drizzle-orm/pg-core';

export const roleEnum = pgEnum('role', ['ADMIN', 'USER']);
export const taskStatusEnum = pgEnum('task_status', ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']);
export const priorityEnum = pgEnum('priority', ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  name: text('name').notNull(),
  role: roleEnum('role').default('USER').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const tasks = pgTable('tasks', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  status: taskStatusEnum('status').default('PENDING').notNull(),
  priority: priorityEnum('priority').default('MEDIUM').notNull(),
  progress: integer('progress').default(0).notNull(),
  dueDate: timestamp('due_date'),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const taskHistory = pgTable('task_history', {
  id: uuid('id').defaultRandom().primaryKey(),
  taskId: uuid('task_id').notNull().references(() => tasks.id, { onDelete: 'cascade' }),
  field: text('field').notNull(),
  oldValue: text('old_value'),
  newValue: text('new_value'),
  changedBy: text('changed_by').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const pushTokens = pgTable('push_tokens', {
  id: uuid('id').defaultRandom().primaryKey(),
  token: text('token').notNull().unique(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});