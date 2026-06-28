import { CsvService } from '../src/services/csv.service';
import { mockSelect, createQueryChain } from './setup';

describe('CsvService', () => {
  let csvService: CsvService;

  beforeEach(() => {
    jest.clearAllMocks();
    csvService = new CsvService();
  });

  it('should generate CSV with correct headers and data', async () => {
    const mockTasks = [
      {
        id: 'task-1',
        title: 'Test Task',
        description: 'Description',
        status: 'PENDING',
        priority: 'HIGH',
        progress: 50,
        dueDate: new Date('2026-07-01'),
        createdAt: new Date('2026-06-28'),
        updatedAt: new Date('2026-06-28'),
      },
    ];

    mockSelect.mockReturnValue(createQueryChain(mockTasks));

    const csv = await csvService.exportTasks('user-1');

    expect(csv).toContain('ID');
    expect(csv).toContain('Название');
    expect(csv).toContain('Статус');
    expect(csv).toContain('Приоритет');
    expect(csv).toContain('Прогресс');
    expect(csv).toContain('Срок выполнения');
    expect(csv).toContain('Test Task');
    expect(csv).toContain('50%');
    expect(csv).toContain('PENDING');
    expect(csv).toContain('HIGH');
    expect(csv).toContain(';');
  });

  it('should return empty string when no tasks', async () => {
    mockSelect.mockReturnValue(createQueryChain([]));

    const csv = await csvService.exportTasks('user-1');

    expect(csv).toBe('');
  });
});