import { taskService } from '../src/services/task.service';
import { mockSelect, mockInsert, mockUpdate, mockDelete, createQueryChain } from './setup';

const testTask = {
  id: 'task-1',
  title: 'Test Task',
  description: 'Description',
  status: 'PENDING' as const,
  priority: 'HIGH' as const,
  progress: 0,
  dueDate: new Date('2026-07-01'),
  userId: 'user-1',
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('TaskService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a task successfully', async () => {
      mockInsert.mockReturnValue(createQueryChain([testTask]));

      const result = await taskService.create('user-1', {
        title: 'Test Task',
        description: 'Description',
        status: 'PENDING',
        priority: 'HIGH',
        progress: 0,
      });

      expect(result.id).toBe('task-1');
      expect(result.title).toBe('Test Task');
      expect(mockInsert).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return all tasks for user', async () => {
      mockSelect.mockReturnValue(createQueryChain([testTask]));

      const tasks = await taskService.findAll('user-1');

      expect(tasks).toHaveLength(1);
      expect(tasks[0].id).toBe('task-1');
      expect(mockSelect).toHaveBeenCalled();
    });

    it('should filter by status', async () => {
      mockSelect.mockReturnValue(createQueryChain([testTask]));

      const tasks = await taskService.findAll('user-1', { status: 'PENDING' });

      expect(tasks).toHaveLength(1);
      expect(mockSelect).toHaveBeenCalled();
    });

    it('should filter by priority', async () => {
      mockSelect.mockReturnValue(createQueryChain([testTask]));

      const tasks = await taskService.findAll('user-1', { priority: 'HIGH' });

      expect(tasks).toHaveLength(1);
      expect(mockSelect).toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('should return task by id', async () => {
      mockSelect.mockReturnValue(createQueryChain([testTask]));

      const task = await taskService.findById('task-1', 'user-1');

      expect(task).toBeDefined();
      expect(task!.id).toBe('task-1');
    });

    it('should return undefined when task not found', async () => {
      mockSelect.mockReturnValue(createQueryChain([]));

      const task = await taskService.findById('non-existent', 'user-1');

      expect(task).toBeUndefined();
    });
  });

  describe('update', () => {
    it('should update a task title', async () => {
      mockSelect.mockReturnValueOnce(createQueryChain([testTask]));
      mockInsert.mockReturnValueOnce(createQueryChain([]));
      mockUpdate.mockReturnValueOnce(createQueryChain([{ ...testTask, title: 'Updated Task' }]));

      const updated = await taskService.update('task-1', 'user-1', {
        title: 'Updated Task',
      });

      expect(updated.title).toBe('Updated Task');
      expect(mockUpdate).toHaveBeenCalled();
    });

    it('should update a task description', async () => {
      const updatedTask = { ...testTask, description: 'New Description' };
      mockSelect.mockReturnValueOnce(createQueryChain([testTask]));
      mockInsert.mockReturnValueOnce(createQueryChain([]));
      mockUpdate.mockReturnValueOnce(createQueryChain([updatedTask]));

      const updated = await taskService.update('task-1', 'user-1', {
        description: 'New Description',
      });

      expect(updated.description).toBe('New Description');
    });

    it('should update a task status', async () => {
      const updatedTask = { ...testTask, status: 'IN_PROGRESS' as const };
      mockSelect.mockReturnValueOnce(createQueryChain([testTask]));
      mockInsert.mockReturnValueOnce(createQueryChain([]));
      mockUpdate.mockReturnValueOnce(createQueryChain([updatedTask]));

      const updated = await taskService.update('task-1', 'user-1', {
        status: 'IN_PROGRESS',
      });

      expect(updated.status).toBe('IN_PROGRESS');
    });

    it('should update a task priority', async () => {
      const updatedTask = { ...testTask, priority: 'CRITICAL' as const };
      mockSelect.mockReturnValueOnce(createQueryChain([testTask]));
      mockInsert.mockReturnValueOnce(createQueryChain([]));
      mockUpdate.mockReturnValueOnce(createQueryChain([updatedTask]));

      const updated = await taskService.update('task-1', 'user-1', {
        priority: 'CRITICAL',
      });

      expect(updated.priority).toBe('CRITICAL');
    });

    it('should update a task progress', async () => {
      const updatedTask = { ...testTask, progress: 75 };
      mockSelect.mockReturnValueOnce(createQueryChain([testTask]));
      mockInsert.mockReturnValueOnce(createQueryChain([]));
      mockUpdate.mockReturnValueOnce(createQueryChain([updatedTask]));

      const updated = await taskService.update('task-1', 'user-1', {
        progress: 75,
      });

      expect(updated.progress).toBe(75);
    });

    it('should update a task dueDate', async () => {
      const newDueDate = new Date('2026-08-15');
      const updatedTask = { ...testTask, dueDate: newDueDate };
      mockSelect.mockReturnValueOnce(createQueryChain([testTask]));
      mockInsert.mockReturnValueOnce(createQueryChain([]));
      mockUpdate.mockReturnValueOnce(createQueryChain([updatedTask]));

      const updated = await taskService.update('task-1', 'user-1', {
        dueDate: '2026-08-15',
      });

      expect(updated.dueDate).toEqual(newDueDate);
    });

    it('should clear dueDate when null passed', async () => {
      const updatedTask = { ...testTask, dueDate: null };
      mockSelect.mockReturnValueOnce(createQueryChain([testTask]));
      mockInsert.mockReturnValueOnce(createQueryChain([]));
      mockUpdate.mockReturnValueOnce(createQueryChain([updatedTask]));

      const updated = await taskService.update('task-1', 'user-1', {
        dueDate: null,
      });

      expect(updated.dueDate).toBeNull();
    });

    it('should update everything at once', async () => {
      const updatedTask = {
        ...testTask,
        title: 'Full Update',
        description: 'Full Desc',
        status: 'COMPLETED' as const,
        priority: 'LOW' as const,
        progress: 100,
        dueDate: new Date('2026-12-31'),
      };
      mockSelect.mockReturnValueOnce(createQueryChain([testTask]));
      mockInsert.mockReturnValueOnce(createQueryChain([]));
      mockUpdate.mockReturnValueOnce(createQueryChain([updatedTask]));

      const updated = await taskService.update('task-1', 'user-1', {
        title: 'Full Update',
        description: 'Full Desc',
        status: 'COMPLETED',
        priority: 'LOW',
        progress: 100,
        dueDate: '2026-12-31',
      });

      expect(updated.title).toBe('Full Update');
      expect(updated.description).toBe('Full Desc');
      expect(updated.status).toBe('COMPLETED');
      expect(updated.priority).toBe('LOW');
      expect(updated.progress).toBe(100);
      expect(updated.dueDate).toEqual(new Date('2026-12-31'));
    });

    it('should throw error when task not found', async () => {
      mockSelect.mockReturnValue(createQueryChain([]));

      await expect(
        taskService.update('non-existent', 'user-1', { title: 'New' })
      ).rejects.toThrow('Задача не найдена');
    });
  });

  describe('delete', () => {
    it('should delete a task', async () => {
      mockSelect.mockReturnValue(createQueryChain([testTask]));

      const result = await taskService.delete('task-1', 'user-1');

      expect(result.message).toBe('Задача удалена');
      expect(mockDelete).toHaveBeenCalled();
    });

    it('should throw error when task not found', async () => {
      mockSelect.mockReturnValue(createQueryChain([]));

      await expect(
        taskService.delete('non-existent', 'user-1')
      ).rejects.toThrow('Задача не найдена');
    });
  });

  describe('getHistory', () => {
    it('should return task history', async () => {
      mockSelect.mockReturnValueOnce(createQueryChain([testTask]));
      mockSelect.mockReturnValueOnce(createQueryChain([
        {
          id: 'hist-1',
          taskId: 'task-1',
          field: 'title',
          oldValue: 'Old Title',
          newValue: 'New Title',
          changedBy: 'user-1',
          createdAt: new Date(),
        },
      ]));

      const history = await taskService.getHistory('task-1', 'user-1');

      expect(history).toHaveLength(1);
      expect(history[0].field).toBe('title');
    });

    it('should throw error when task not found', async () => {
      mockSelect.mockReturnValue(createQueryChain([]));

      await expect(
        taskService.getHistory('non-existent', 'user-1')
      ).rejects.toThrow('Задача не найдена');
    });
  });

  describe('getDueSoonTasks', () => {
    it('should return tasks due within 24 hours', async () => {
      mockSelect.mockReturnValue(createQueryChain([testTask]));

      const tasks = await taskService.getDueSoonTasks();

      expect(tasks).toHaveLength(1);
      expect(mockSelect).toHaveBeenCalled();
    });
  });
});