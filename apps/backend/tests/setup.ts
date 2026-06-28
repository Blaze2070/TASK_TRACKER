process.env.JWT_SECRET = 'test-secret-key';
process.env.EXPO_ACCESS_TOKEN = 'test-expo-token';

jest.mock('expo-server-sdk', () => {
  const ExpoMock = jest.fn(() => ({
    sendPushNotificationsAsync: jest.fn(),
  }));
  (ExpoMock as any).isExpoPushToken = jest.fn().mockReturnValue(true);
  return {
    Expo: ExpoMock,
    ExpoPushMessage: jest.fn(),
  };
});

function createQueryChain(resolvedValue: unknown) {
  const thenFn = (onResolve: (val: unknown) => void) => {
    return Promise.resolve(resolvedValue).then(onResolve);
  };

  const chain: any = {
    from: jest.fn(() => chain),
    where: jest.fn(() => chain),
    limit: jest.fn(() => chain),
    orderBy: jest.fn(() => chain),
    returning: jest.fn(() => chain),
    values: jest.fn(() => chain),
    set: jest.fn(() => chain),
    then: thenFn,
    catch: (onReject: (err: unknown) => void) => Promise.resolve(resolvedValue).then(undefined, onReject),
  };

  return chain;
}

const mockSelect = jest.fn(() => createQueryChain([]));
const mockInsert = jest.fn(() => createQueryChain([]));
const mockUpdate = jest.fn(() => createQueryChain([]));
const mockDelete = jest.fn(() => createQueryChain([]));

jest.mock('../src/db', () => ({
  db: {
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
    delete: mockDelete,
  },
  schema: {
    users: {
      id: 'id',
      email: 'email',
      password: 'password',
      name: 'name',
      role: 'role',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
    tasks: {
      id: 'id',
      title: 'title',
      description: 'description',
      status: 'status',
      priority: 'priority',
      progress: 'progress',
      dueDate: 'due_date',
      userId: 'user_id',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
    taskHistory: {
      id: 'id',
      taskId: 'task_id',
      field: 'field',
      oldValue: 'old_value',
      newValue: 'new_value',
      changedBy: 'changed_by',
      createdAt: 'created_at',
    },
    pushTokens: {
      id: 'id',
      token: 'token',
      userId: 'user_id',
      createdAt: 'created_at',
    },
  },
}));

export { mockSelect, mockInsert, mockUpdate, mockDelete, createQueryChain };